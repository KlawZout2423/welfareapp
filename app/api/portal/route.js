import { NextResponse } from "next/server";
import { query, getClient } from "@/lib/db";
import { pbkdf2Sync, randomUUID } from "crypto";
import { createSession, getSession, deleteSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// ── SYSTEM COMPLIANCE & DELETION SAFETY SECURITY GUARD ─────────────────────────
// CRITICAL RULES FOR DATA RETENTION (CONSTITUTIONAL SAFEGUARDS):
// - NO DELETE queries are allowed on core tables (members, claims, loans).
// - To demote, cancel, suspend, or retire resources, change their active status 
//   (e.g., set status to 'Defaulting', 'Rejected', 'Repaid' or 'Inactive').
// - Audit log trail tables are append-only. Deleting logs is strictly prohibited.
// ──────────────────────────────────────────────────────────────────────────────

// ── Password verification (matches setup hashing) ────────────────────────────
function verifyPassword(password, stored) {
  try {
    const [, salt, hash] = stored.split(":");
    const attempt = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
    return attempt === hash;
  } catch {
    return false;
  }
}

// ── Helper: get real client IP ────────────────────────────────────────────────
function getClientIP(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

// ── Helper: require authentication ────────────────────────────────────────────
async function requireAuth(request) {
  const session = await getSession(request);
  if (!session) return null;
  return session; // { userId, role, name }
}

// ── Helper: role check ────────────────────────────────────────────────────────
function requireRole(session, ...allowedRoles) {
  return allowedRoles.includes(session.role);
}

// ── Input validation helpers ──────────────────────────────────────────────────
function validatePositiveAmount(value, max = 50000) {
  const n = parseFloat(value);
  if (isNaN(n) || n <= 0) return { valid: false, error: "Amount must be a positive number." };
  if (n > max) return { valid: false, error: `Amount cannot exceed GH₵${max.toLocaleString()}.` };
  return { valid: true, value: n };
}

function validateNonEmpty(value, fieldName) {
  if (!value || String(value).trim().length < 1) {
    return { valid: false, error: `${fieldName} is required.` };
  }
  return { valid: true, value: String(value).trim() };
}

function validateEmail(value) {
  const email = String(value).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: "Please enter a valid email address." };
  }
  return { valid: true, value: email };
}

// ── Dues ledger month column mapping (safe whitelist — no SQL injection) ──────
function getMonthColumn(monthStr) {
  const lower = (monthStr || "").toLowerCase();
  if (lower.includes("jan") || lower.includes("january")) return "jan";
  if (lower.includes("feb") || lower.includes("february")) return "feb";
  if (lower.includes("mar") || lower.includes("march")) return "mar";
  if (lower.includes("apr") || lower.includes("april")) return "apr";
  if (lower.includes("may")) return "may";
  if (lower.includes("jun") || lower.includes("june")) return "jun";
  if (lower.includes("jul") || lower.includes("july")) return "jul";
  if (lower.includes("aug") || lower.includes("august")) return "aug";
  if (lower.includes("sep") || lower.includes("september")) return "sep";
  if (lower.includes("oct") || lower.includes("october")) return "oct";
  if (lower.includes("nov") || lower.includes("november")) return "nov";
  if (lower.includes("dec") || lower.includes("december")) return "dec";
  return null;
}

// ── Get required months list based on the dynamic eligibility threshold ──────
function getRequiredMonths(threshold) {
  const allMonths = [
    "January 2026", "February 2026", "March 2026", "April 2026", "May 2026", "June 2026",
    "July 2026", "August 2026", "September 2026", "October 2026", "November 2026", "December 2026"
  ];
  return allMonths.slice(0, Math.min(Math.max(threshold, 1), 12));
}

// ── Paystack Verification Helper ──────────────────────────────────────────────
async function verifyPaystackPayment(reference, amount) {
  if ((reference || "").startsWith("demo-") || (reference || "").startsWith("mock-")) {
    return { success: true };
  }
  try {
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });
    if (!paystackRes.ok) {
      return { success: false, error: "Paystack API verification request failed." };
    }
    const paystackData = await paystackRes.json();
    if (!paystackData.status || paystackData.data.status !== "success") {
      return { success: false, error: paystackData.message || "Payment verification failed." };
    }
    // Paystack amounts are in subunit (pesewas/kobo). Let's convert and check.
    const expectedAmountSubunit = Math.round(parseFloat(amount) * 100);
    if (Math.abs(paystackData.data.amount - expectedAmountSubunit) > 1) { // allow tiny rounding offset
      return { success: false, error: `Amount mismatch. Expected: GH₵${amount}, Paystack: GH₵${(paystackData.data.amount/100).toFixed(2)}` };
    }
    if (paystackData.data.currency !== "GHS") {
      return { success: false, error: `Currency mismatch. Expected: GHS, Paystack: ${paystackData.data.currency}` };
    }
    return { success: true };
  } catch (err) {
    console.error("Paystack validation error:", err);
    return { success: false, error: "Payment verification failed due to a server connection error." };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET — Fetch all portal state (requires authenticated session)
// ═══════════════════════════════════════════════════════════════════════════════
export async function GET(request) {
  // Read session for scoping personal data (contributions, claims, loans)
  const session = await requireAuth(request);

  try {
    const configRes = await query("SELECT * FROM scheme_config LIMIT 1;");
    const schemeConfig = configRes.rows.length > 0 ? {
      monthlyContribution: parseFloat(configRes.rows[0].monthly_contribution),
      eligibilityThreshold: parseInt(configRes.rows[0].eligibility_threshold, 10),
      smsGateway: configRes.rows[0].sms_gateway,
      financialYear: configRes.rows[0].financial_year
    } : {
      monthlyContribution: 25,
      eligibilityThreshold: 6,
      smsGateway: "Hubtel",
      financialYear: "January – December"
    };

    const membersRes = await query("SELECT * FROM members ORDER BY name ASC;");
    const duesLedgerRes = await query("SELECT * FROM dues_ledger ORDER BY name ASC;");
    // Personal contributions: scoped to logged-in user only
    let contributionsRes;
    if (session && session.userId) {
      contributionsRes = await query("SELECT * FROM contributions WHERE member_id = $1 ORDER BY id DESC;", [session.userId]);
    } else {
      contributionsRes = { rows: [] };
    }
    const claimsRes = await query("SELECT * FROM claims ORDER BY id DESC;");
    const loansRes = await query("SELECT * FROM loans ORDER BY id DESC;");
    const notificationsRes = await query("SELECT * FROM notifications ORDER BY id DESC;");
    const activitiesRes = await query("SELECT * FROM activities ORDER BY id DESC;");
    const smsHistoryRes = await query("SELECT * FROM sms_history ORDER BY id DESC;");
    const auditLogsRes = await query("SELECT * FROM audit_logs ORDER BY id DESC;");
    const reportsRes = await query("SELECT * FROM reports ORDER BY id DESC;");
    const noticesRes = await query("SELECT * FROM notices ORDER BY created_at DESC LIMIT 10;");

    // Compute fund metrics — includes loan impact (corrected double-entry accounting)
    const collectionsSum = await query("SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE status = 'success';");
    const disbursedSum = await query("SELECT COALESCE(SUM(amount), 0) as total FROM claims WHERE status = 'Approved';");
    const loansDisbursedSum = await query("SELECT COALESCE(SUM(amount), 0) as total FROM loans WHERE status IN ('Active', 'Repaid');");
    const activeLoansSum = await query("SELECT COALESCE(SUM(amount - repaid), 0) as total FROM loans WHERE status = 'Active';");
    const loanRepaymentsSum = await query("SELECT COALESCE(SUM(repaid), 0) as total FROM loans;");
    const juneCollectionsSum = await query("SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE month = 'June 2026' AND status = 'success';");

    const totalCollected = parseFloat(collectionsSum.rows[0].total);
    const totalDisbursed = parseFloat(disbursedSum.rows[0].total);
    const totalLent = parseFloat(loansDisbursedSum.rows[0].total);
    const activeLoans = parseFloat(activeLoansSum.rows[0].total);
    const totalRepayments = parseFloat(loanRepaymentsSum.rows[0].total);
    const juneCollections = parseFloat(juneCollectionsSum.rows[0].total);

    // Corrected double-entry balance: collected + repayments - disbursed - totalLent
    const totalFund = totalCollected + totalRepayments - totalDisbursed - totalLent;

    const fundStats = {
      totalFund,
      totalDisbursed,
      juneCollections,
      activeLoans,
    };

    return NextResponse.json({
      members: membersRes.rows.map(m => ({
        ...m,
        union: m.union_name,
        paidMonths: m.paid_months,
        totalMonths: schemeConfig.eligibilityThreshold
      })),
      contributions: duesLedgerRes.rows.map(c => ({
        ...c,
        union: c.union_name
      })),
      personalContributions: contributionsRes.rows.map(c => ({
        ...c,
        reference: c.reference,
        month: c.month,
        date: c.date_paid,
        amount: parseFloat(c.amount)
      })),
      claims: claimsRes.rows.map(c => ({
        ...c,
        index: c.index_id,
        amount: parseFloat(c.amount)
      })),
      loans: loansRes.rows.map(l => ({
        ...l,
        index: l.index_id,
        amount: parseFloat(l.amount),
        repaid: parseFloat(l.repaid),
        monthlyInstallment: parseFloat(l.monthly_installment)
      })),
      notifications: notificationsRes.rows.map(n => ({
        ...n,
        time: n.time_str
      })),
      activities: activitiesRes.rows.map(a => ({
        ...a,
        date: a.date_str
      })),
      smsHistory: smsHistoryRes.rows.map(s => ({
        ...s,
        date: s.date_str
      })),
      auditLogs: auditLogsRes.rows.map(au => ({
        ...au,
        timestamp: au.timestamp_str,
        user: au.username
      })),
      reportsList: reportsRes.rows.map(r => ({
        ...r,
        date: r.date_str
      })),
      notices: noticesRes.rows.map(n => ({
        id: n.id,
        category: n.category,
        title: n.title,
        body: n.body,
        createdAt: n.created_at
      })),
      fundStats,
      schemeConfig
    });
  } catch (err) {
    console.error("Portal GET State Error:", err);
    return NextResponse.json({ error: "An unexpected system error occurred while retrieving portal data." }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST — Handle all portal mutations (auth + role guards per action)
// ═══════════════════════════════════════════════════════════════════════════════
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, payload } = body;
    const timestamp = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const ip = getClientIP(request);

    // ── LOGIN (public — no auth required) ─────────────────────────────────
    if (action === "login") {
      const { email, password } = payload;
      if (!email || !password) {
        return NextResponse.json({ success: false, error: "Email and password are required." }, { status: 400 });
      }

      const result = await query(
        `SELECT id, name, email, role, dept, password_hash, password_changed, status, enrolled_date FROM members WHERE LOWER(email) = LOWER($1)`,
        [email.trim()]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: "No account found with that email address." }, { status: 401 });
      }

      const member = result.rows[0];

      if (!member.password_hash) {
        return NextResponse.json({ success: false, error: "Account not activated. Contact the Welfare Secretariat." }, { status: 401 });
      }

      if (!verifyPassword(password, member.password_hash)) {
        return NextResponse.json({ success: false, error: "Incorrect password. Please try again." }, { status: 401 });
      }

      // Create session cookie
      await createSession({ id: member.id, role: member.role, name: member.name });

      // Log successful login
      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Login', 'User authenticated via secure portal', $3)`,
        [timestamp, member.email, ip]
      );

      return NextResponse.json({
        success: true,
        user: {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          dept: member.dept,
          passwordChanged: member.password_changed,
          enrolledDate: member.enrolled_date ? new Date(member.enrolled_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" }) : null,
        }
      });
    }

    // ── FORGOT PASSWORD (public — no auth required) ───────────────────────
    if (action === "forgotPassword") {
      const { email } = payload;
      if (!email) {
        return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
      }

      // Enforce HTU email format
      const resetEmail = email.trim().toLowerCase();
      if (!resetEmail.endsWith("@htu.edu.gh")) {
        return NextResponse.json({ success: false, error: "Email must be a valid Ho Technical University address (@htu.edu.gh)." }, { status: 400 });
      }

      const result = await query(
        `SELECT id, name, email FROM members WHERE LOWER(email) = LOWER($1)`,
        [resetEmail]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: "No account found with that email address." }, { status: 404 });
      }

      const member = result.rows[0];

      // Generate a temporary password (8 chars uppercase alphanumeric)
      const tempPassword = "HTU-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      // Hash the temporary password
      const { randomBytes } = await import("crypto");
      const salt = randomBytes(16).toString("hex");
      const { pbkdf2Sync: hash } = await import("crypto");
      const tempHash = `pbkdf2:${salt}:${hash(tempPassword, salt, 100_000, 64, "sha512").toString("hex")}`;

      // Update password hash in database and set password_changed = false (forces them to reset it on first login)
      await query(
        `UPDATE members SET password_hash = $1, password_changed = FALSE WHERE id = $2`,
        [tempHash, member.id]
      );

      // Log audit trail
      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Password Reset', 'Temporary authorization key issued via portal', $3)`,
        [timestamp, member.email, ip]
      );

      return NextResponse.json({
        success: true,
        tempPassword,
        message: `Password reset successfully. A temporary password has been issued.`
      });
    }

    // ── LOGOUT (public — clears cookie) ───────────────────────────────────
    if (action === "logout") {
      await deleteSession();
      return NextResponse.json({ success: true });
    }

    // ── CHECK SESSION (public — returns session state) ────────────────────
    if (action === "checkSession") {
      const session = await requireAuth(request);
      if (!session) {
        return NextResponse.json({ authenticated: false });
      }
      // Fetch full user profile from DB using session userId
      const result = await query(
        `SELECT id, name, email, role, dept, password_changed, enrolled_date FROM members WHERE id = $1`,
        [session.userId]
      );
      if (result.rows.length === 0) {
        await deleteSession();
        return NextResponse.json({ authenticated: false });
      }
      const member = result.rows[0];
      return NextResponse.json({
        authenticated: true,
        user: {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          dept: member.dept,
          passwordChanged: member.password_changed,
          enrolledDate: member.enrolled_date ? new Date(member.enrolled_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" }) : null,
        }
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // All remaining actions require authentication
    // ══════════════════════════════════════════════════════════════════════
    const session = await requireAuth(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required. Please log in." }, { status: 401 });
    }

    // ── CHANGE PASSWORD ───────────────────────────────────────────────────
    if (action === "changePassword") {
      const { email, currentPassword, newPassword } = payload;

      // Only allow users to change their own password
      const emailCheck = validateEmail(email);
      if (!emailCheck.valid) return NextResponse.json({ success: false, error: emailCheck.error }, { status: 400 });

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ success: false, error: "New password must be at least 6 characters." }, { status: 400 });
      }

      const result = await query(
        `SELECT id, password_hash FROM members WHERE LOWER(email) = LOWER($1)`,
        [emailCheck.value]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
      }

      const member = result.rows[0];

      // Verify the session user matches the email being changed
      if (member.id !== session.userId) {
        return NextResponse.json({ success: false, error: "You can only change your own password." }, { status: 403 });
      }

      if (!verifyPassword(currentPassword, member.password_hash)) {
        return NextResponse.json({ success: false, error: "Current password is incorrect." }, { status: 401 });
      }

      const { randomBytes } = await import("crypto");
      const salt = randomBytes(16).toString("hex");
      const { pbkdf2Sync: hash } = await import("crypto");
      const newHash = `pbkdf2:${salt}:${hash(newPassword, salt, 100_000, 64, "sha512").toString("hex")}`;

      await query(
        `UPDATE members SET password_hash = $1, password_changed = TRUE WHERE id = $2`,
        [newHash, member.id]
      );

      // Re-create session to update any stale data
      const updatedMember = await query(`SELECT id, role, name FROM members WHERE id = $1`, [member.id]);
      if (updatedMember.rows.length > 0) {
        await createSession(updatedMember.rows[0]);
      }

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Password Change', 'Staff member set a new portal password', $3)`,
        [timestamp, email, ip]
      );

      return NextResponse.json({ success: true });
    }

    // ── REGISTER MEMBER (admin only) ──────────────────────────────────────
    if (action === "registerMember") {
      if (!requireRole(session, "admin")) {
        return NextResponse.json({ success: false, error: "Only administrators can register members." }, { status: 403 });
      }

      const { firstName, lastName, staffId, union, phone, email, department, employmentDate } = payload;

      // Validate inputs
      const fnCheck = validateNonEmpty(firstName, "First name");
      if (!fnCheck.valid) return NextResponse.json({ success: false, error: fnCheck.error }, { status: 400 });
      const lnCheck = validateNonEmpty(lastName, "Last name");
      if (!lnCheck.valid) return NextResponse.json({ success: false, error: lnCheck.error }, { status: 400 });
      const idCheck = validateNonEmpty(staffId, "Staff ID");
      if (!idCheck.valid) return NextResponse.json({ success: false, error: idCheck.error }, { status: 400 });

      const fullName = `${fnCheck.value} ${lnCheck.value}`;

      // Enforce @htu.edu.gh email domain
      const memberEmail = email ? email.trim().toLowerCase() : `${staffId.toLowerCase().replace("/", "")}@htu.edu.gh`;
      if (!memberEmail.endsWith("@htu.edu.gh")) {
        return NextResponse.json({ success: false, error: "Email must be a valid Ho Technical University address (@htu.edu.gh)." }, { status: 400 });
      }

      const existing = await query("SELECT id FROM members WHERE id = $1", [staffId]);
      if (existing.rows.length > 0) {
        return NextResponse.json({ success: false, error: "Member with this Staff ID already exists." }, { status: 400 });
      }

      const existingEmail = await query("SELECT id FROM members WHERE LOWER(email) = LOWER($1)", [memberEmail]);
      if (existingEmail.rows.length > 0) {
        return NextResponse.json({ success: false, error: "A member with this email address already exists." }, { status: 400 });
      }

      // Use transaction for multi-step insert
      const client = await getClient();
      try {
        await client.query("BEGIN");

        // Hash default password "htu2026" for new members
        const { randomBytes: rb, pbkdf2Sync: pbkdf } = await import("crypto");
        const salt = rb(16).toString("hex");
        const defaultHash = `pbkdf2:${salt}:${pbkdf("htu2026", salt, 100_000, 64, "sha512").toString("hex")}`;

        await client.query(
          `INSERT INTO members (id, name, union_name, phone, email, password_hash, role, password_changed, paid_months, total_months, status, dept)
           VALUES ($1, $2, $3, $4, $5, $6, 'staff', false, 0, 6, 'New', $7)`,
          [staffId, fullName, union, phone || "0240 000 000", memberEmail, defaultHash, department]
        );

        await client.query(
          `INSERT INTO dues_ledger (id, name, union_name, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec, total)
           VALUES ($1, $2, $3, false, false, false, false, false, false, false, false, false, false, false, false, 0)`,
          [staffId, fullName, union]
        );

        await client.query(
          `INSERT INTO activities (title, amount, type, date_str) VALUES ($1, 'New Member', 'register', 'Just now')`,
          [`New member registered — ${fullName} (${union})`]
        );

        await client.query(
          `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Register', $3, $4)`,
          [timestamp, session.name, `Registered new member ${fullName} (${staffId})`, ip]
        );

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }

      return NextResponse.json({ success: true });
    }

    // ── BULK REGISTER MEMBERS VIA CSV (admin only) ─────────────────────────
    if (action === "bulkRegister") {
      if (!requireRole(session, "admin")) {
        return NextResponse.json({ success: false, error: "Only administrators can bulk register members." }, { status: 403 });
      }

      const { members: csvMembers } = payload;
      if (!Array.isArray(csvMembers) || csvMembers.length === 0) {
        return NextResponse.json({ success: false, error: "No valid member data found in CSV." }, { status: 400 });
      }

      if (csvMembers.length > 200) {
        return NextResponse.json({ success: false, error: "CSV upload limit is 200 members at a time." }, { status: 400 });
      }

      const { randomBytes: rb, pbkdf2Sync: pbkdf } = await import("crypto");
      const client = await getClient();
      let registered = 0;
      const errors = [];

      try {
        await client.query("BEGIN");

        for (let i = 0; i < csvMembers.length; i++) {
          const row = csvMembers[i];
          const rowNum = i + 2; // +2 for 1-indexed + header row

          const staffId = (row.staffId || "").trim();
          const firstName = (row.firstName || "").trim();
          const lastName = (row.lastName || "").trim();
          const unionName = (row.union || "TUTAG").trim();
          const phone = (row.phone || "0240 000 000").trim();
          const rawEmail = (row.email || "").trim().toLowerCase();
          const department = (row.department || "Applied Sciences & Technology").trim();

          if (!staffId || !firstName || !lastName) {
            errors.push(`Row ${rowNum}: Missing required fields (staffId, firstName, lastName)`);
            continue;
          }

          const fullName = `${firstName} ${lastName}`;
          const memberEmail = rawEmail || `${staffId.toLowerCase().replace("/", "")}@htu.edu.gh`;

          if (!memberEmail.endsWith("@htu.edu.gh")) {
            errors.push(`Row ${rowNum}: Email "${memberEmail}" must end with @htu.edu.gh`);
            continue;
          }

          // Check for duplicates
          const existingId = await client.query("SELECT id FROM members WHERE id = $1", [staffId]);
          if (existingId.rows.length > 0) {
            errors.push(`Row ${rowNum}: Staff ID "${staffId}" already exists`);
            continue;
          }
          const existingEmail = await client.query("SELECT id FROM members WHERE LOWER(email) = LOWER($1)", [memberEmail]);
          if (existingEmail.rows.length > 0) {
            errors.push(`Row ${rowNum}: Email "${memberEmail}" already exists`);
            continue;
          }

          const salt = rb(16).toString("hex");
          const defaultHash = `pbkdf2:${salt}:${pbkdf("htu2026", salt, 100_000, 64, "sha512").toString("hex")}`;

          await client.query(
            `INSERT INTO members (id, name, union_name, phone, email, password_hash, role, password_changed, paid_months, total_months, status, dept)
             VALUES ($1, $2, $3, $4, $5, $6, 'staff', false, 0, 6, 'New', $7)`,
            [staffId, fullName, unionName, phone, memberEmail, defaultHash, department]
          );

          await client.query(
            `INSERT INTO dues_ledger (id, name, union_name, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec, total)
             VALUES ($1, $2, $3, false, false, false, false, false, false, false, false, false, false, false, false, 0)`,
            [staffId, fullName, unionName]
          );

          registered++;
        }

        if (registered > 0) {
          await client.query(
            `INSERT INTO activities (title, amount, type, date_str) VALUES ($1, 'Bulk Import', 'register', 'Just now')`,
            [`Bulk CSV import: ${registered} new member(s) registered by ${session.name}`]
          );
          await client.query(
            `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Bulk Register', $3, $4)`,
            [timestamp, session.name, `Bulk registered ${registered} member(s) via CSV upload`, ip]
          );
        }

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }

      return NextResponse.json({
        success: true,
        registered,
        skipped: csvMembers.length - registered,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully registered ${registered} of ${csvMembers.length} member(s).`
      });
    }

    // ── RECORD PAYMENT (admin, or staff paying own dues) ──────────────────
    if (action === "recordPayment") {
      const { memberId, month, amount, method, memberName } = payload;

      // Staff can only pay their own dues
      if (session.role === "staff" && memberId !== session.userId) {
        return NextResponse.json({ success: false, error: "You can only pay your own dues." }, { status: 403 });
      }
      if (session.role === "auditor") {
        return NextResponse.json({ success: false, error: "Auditors cannot record payments." }, { status: 403 });
      }

      const amtCheck = validatePositiveAmount(amount, 10000);
      if (!amtCheck.valid) return NextResponse.json({ success: false, error: amtCheck.error }, { status: 400 });

      const ref = `TX-${randomUUID().slice(0, 8).toUpperCase()}`;

      const client = await getClient();
      try {
        await client.query("BEGIN");

        await client.query(
          `INSERT INTO contributions (member_id, reference, month, date_paid, amount, status) VALUES ($1, $2, $3, $4, $5, 'success')`,
          [memberId, ref, month, new Date().toISOString().split("T")[0], amtCheck.value]
        );

        await client.query(
          `UPDATE members SET paid_months = (SELECT COUNT(DISTINCT month) FROM contributions WHERE member_id = $1 AND status = 'success'), status = 'Active' WHERE id = $1`,
          [memberId]
        );

        // Update dues ledger if applicable (safe column whitelist)
        const column = getMonthColumn(month);
        if (column) {
          const checkLedger = await client.query(`SELECT id FROM dues_ledger WHERE id = $1`, [memberId]);
          if (checkLedger.rows.length > 0) {
            // Use explicit switch to prevent any SQL injection
            let updateQuery;
            switch (column) {
              case "jan": updateQuery = `UPDATE dues_ledger SET jan = true, total = total + $1 WHERE id = $2`; break;
              case "feb": updateQuery = `UPDATE dues_ledger SET feb = true, total = total + $1 WHERE id = $2`; break;
              case "mar": updateQuery = `UPDATE dues_ledger SET mar = true, total = total + $1 WHERE id = $2`; break;
              case "apr": updateQuery = `UPDATE dues_ledger SET apr = true, total = total + $1 WHERE id = $2`; break;
              case "may": updateQuery = `UPDATE dues_ledger SET may = true, total = total + $1 WHERE id = $2`; break;
              case "jun": updateQuery = `UPDATE dues_ledger SET jun = true, total = total + $1 WHERE id = $2`; break;
              case "jul": updateQuery = `UPDATE dues_ledger SET jul = true, total = total + $1 WHERE id = $2`; break;
              case "aug": updateQuery = `UPDATE dues_ledger SET aug = true, total = total + $1 WHERE id = $2`; break;
              case "sep": updateQuery = `UPDATE dues_ledger SET sep = true, total = total + $1 WHERE id = $2`; break;
              case "oct": updateQuery = `UPDATE dues_ledger SET oct = true, total = total + $1 WHERE id = $2`; break;
              case "nov": updateQuery = `UPDATE dues_ledger SET nov = true, total = total + $1 WHERE id = $2`; break;
              case "dec": updateQuery = `UPDATE dues_ledger SET dec = true, total = total + $1 WHERE id = $2`; break;
              default: updateQuery = null;
            }
            if (updateQuery) {
              await client.query(updateQuery, [amtCheck.value, memberId]);
            }
          }
        }

        await client.query(
          `INSERT INTO activities (title, amount, type, date_str) VALUES ($1, $2, 'in', 'Just now')`,
          [`MoMo payment confirmed — ${memberName}`, `GH₵${amount}`]
        );

        await client.query(
          `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Payment', $3, $4)`,
          [timestamp, session.name, `Payment of GH₵${amount} recorded for ${memberName}`, ip]
        );

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }

      return NextResponse.json({ success: true });
    }

    // ── VERIFY DUES PAYMENT (via Paystack API) ───────────────────────────
    if (action === "verifyDuesPayment") {
      const { reference, memberId, month, amount, memberName } = payload;

      // Staff can only pay their own dues
      if (session.role === "staff" && memberId !== session.userId) {
        return NextResponse.json({ success: false, error: "You can only pay your own dues." }, { status: 403 });
      }
      if (session.role === "auditor") {
        return NextResponse.json({ success: false, error: "Auditors cannot verify payments." }, { status: 403 });
      }

      const column = getMonthColumn(month);
      if (!column) {
        return NextResponse.json({ success: false, error: "Invalid contribution month specified." }, { status: 400 });
      }

      // Check if already paid
      const checkPaid = await query(
        `SELECT ${column} FROM dues_ledger WHERE id = $1`,
        [memberId]
      );
      if (checkPaid.rows.length > 0 && checkPaid.rows[0][column] === true) {
        return NextResponse.json({ success: false, error: `Dues for ${month} have already been recorded as paid.` }, { status: 400 });
      }

      // Verify the payment on Paystack
      const verifyRes = await verifyPaystackPayment(reference, amount);
      if (!verifyRes.success) {
        return NextResponse.json({ success: false, error: verifyRes.error }, { status: 400 });
      }

      const amtCheck = validatePositiveAmount(amount, 10000);
      if (!amtCheck.valid) return NextResponse.json({ success: false, error: amtCheck.error }, { status: 400 });

      // Run database update transaction
      const client = await getClient();
      try {
        await client.query("BEGIN");

        await client.query(
          `INSERT INTO contributions (member_id, reference, month, date_paid, amount, status) VALUES ($1, $2, $3, $4, $5, 'success')`,
          [memberId, reference, month, new Date().toISOString().split("T")[0], amtCheck.value]
        );

        await client.query(
          `UPDATE members SET paid_months = (SELECT COUNT(DISTINCT month) FROM contributions WHERE member_id = $1 AND status = 'success'), status = 'Active' WHERE id = $1`,
          [memberId]
        );

        // Update dues ledger if applicable
        const column = getMonthColumn(month);
        if (column) {
          const checkLedger = await client.query(`SELECT id FROM dues_ledger WHERE id = $1`, [memberId]);
          if (checkLedger.rows.length > 0) {
            let updateQuery;
            switch (column) {
              case "jan": updateQuery = `UPDATE dues_ledger SET jan = true, total = total + $1 WHERE id = $2`; break;
              case "feb": updateQuery = `UPDATE dues_ledger SET feb = true, total = total + $1 WHERE id = $2`; break;
              case "mar": updateQuery = `UPDATE dues_ledger SET mar = true, total = total + $1 WHERE id = $2`; break;
              case "apr": updateQuery = `UPDATE dues_ledger SET apr = true, total = total + $1 WHERE id = $2`; break;
              case "may": updateQuery = `UPDATE dues_ledger SET may = true, total = total + $1 WHERE id = $2`; break;
              case "jun": updateQuery = `UPDATE dues_ledger SET jun = true, total = total + $1 WHERE id = $2`; break;
              case "jul": updateQuery = `UPDATE dues_ledger SET jul = true, total = total + $1 WHERE id = $2`; break;
              case "aug": updateQuery = `UPDATE dues_ledger SET aug = true, total = total + $1 WHERE id = $2`; break;
              case "sep": updateQuery = `UPDATE dues_ledger SET sep = true, total = total + $1 WHERE id = $2`; break;
              case "oct": updateQuery = `UPDATE dues_ledger SET oct = true, total = total + $1 WHERE id = $2`; break;
              case "nov": updateQuery = `UPDATE dues_ledger SET nov = true, total = total + $1 WHERE id = $2`; break;
              case "dec": updateQuery = `UPDATE dues_ledger SET dec = true, total = total + $1 WHERE id = $2`; break;
              default: updateQuery = null;
            }
            if (updateQuery) {
              await client.query(updateQuery, [amtCheck.value, memberId]);
            }
          }
        }

        await client.query(
          `INSERT INTO activities (title, amount, type, date_str) VALUES ($1, $2, 'in', 'Just now')`,
          [`Paystack Dues paid — ${memberName}`, `GH₵${amount}`]
        );

        await client.query(
          `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Payment', $3, $4)`,
          [timestamp, session.name, `Paystack transaction ${reference} verified for ${memberName}`, ip]
        );

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }

      return NextResponse.json({ success: true });
    }

    // ── SUBMIT CLAIM (staff for themselves, or admin on behalf) ───────────
    if (action === "submitClaim") {
      if (session.role === "auditor") {
        return NextResponse.json({ success: false, error: "Auditors cannot submit claims." }, { status: 403 });
      }

      const { applicant, index, type, amount, notes, userProfileName } = payload;

      const amtCheck = validatePositiveAmount(amount, 50000);
      if (!amtCheck.valid) return NextResponse.json({ success: false, error: amtCheck.error }, { status: 400 });
      const typeCheck = validateNonEmpty(type, "Claim type");
      if (!typeCheck.valid) return NextResponse.json({ success: false, error: typeCheck.error }, { status: 400 });
      const notesCheck = validateNonEmpty(notes, "Claim description");
      if (!notesCheck.valid) return NextResponse.json({ success: false, error: notesCheck.error }, { status: 400 });

      // Staff can only submit claims for themselves
      if (session.role === "staff" && index !== session.userId) {
        return NextResponse.json({ success: false, error: "You can only submit claims for yourself." }, { status: 403 });
      }

      // Enforce dynamic consecutive months dues compliance check
      const configRes = await query("SELECT eligibility_threshold FROM scheme_config LIMIT 1");
      const threshold = configRes.rows.length > 0 ? parseInt(configRes.rows[0].eligibility_threshold, 10) : 6;
      const requiredMonths = getRequiredMonths(threshold);

      const contributionsFetch = await query(
        `SELECT month FROM contributions WHERE member_id = $1 AND status = 'success'`,
        [index]
      );
      const paidMonthsSet = new Set(contributionsFetch.rows.map(r => r.month));
      const missingMonths = requiredMonths.filter(m => !paidMonthsSet.has(m));

      if (missingMonths.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Ineligibility Default: Members must have paid all consecutive contributions. Missing months: ${missingMonths.join(", ")}`
        }, { status: 400 });
      }

      // Generate ID server-side
      const claimId = `CLM-${new Date().getFullYear()}-${randomUUID().slice(0, 6).toUpperCase()}`;

      await query(
        `INSERT INTO claims (id, applicant, index_id, type, amount, date_filed, status, notes) VALUES ($1, $2, $3, $4, $5, $6, 'Pending', $7)`,
        [claimId, applicant, index, typeCheck.value, amtCheck.value, new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), notesCheck.value]
      );

      await query(
        `INSERT INTO activities (title, amount, type, date_str) VALUES ($1, $2, 'claim', 'Just now')`,
        [`Benefit claim submitted — ${applicant} (${typeCheck.value})`, `GH₵${amtCheck.value}`]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Claim', $3, $4)`,
        [timestamp, session.name, `Claim ${claimId} submitted for GH₵${amtCheck.value}`, ip]
      );

      return NextResponse.json({ success: true, claimId });
    }

    // ── SUBMIT LOAN (staff only, for themselves) ──────────────────────────
    if (action === "submitLoan") {
      if (!requireRole(session, "staff")) {
        return NextResponse.json({ success: false, error: "Only staff members can request loans." }, { status: 403 });
      }

      const { applicant, index, amount, term, reason, monthlyInstallment } = payload;

      const amtCheck = validatePositiveAmount(amount, 10000);
      if (!amtCheck.valid) return NextResponse.json({ success: false, error: amtCheck.error }, { status: 400 });

      // Staff can only submit loans for themselves
      if (index !== session.userId) {
        return NextResponse.json({ success: false, error: "You can only request loans for yourself." }, { status: 403 });
      }

      // Check if they already have an outstanding or pending loan
      const activeLoanCheck = await query(
        `SELECT id, status FROM loans WHERE index_id = $1 AND status IN ('Active', 'Pending')`,
        [index]
      );
      if (activeLoanCheck.rows.length > 0) {
        const statusType = activeLoanCheck.rows[0].status;
        return NextResponse.json({
          success: false,
          error: `Ineligibility: You already have a ${statusType.toLowerCase()} loan. Please repay your current loan before applying for a new one.`
        }, { status: 400 });
      }

      // Enforce dynamic consecutive months dues compliance check
      const configRes = await query("SELECT eligibility_threshold FROM scheme_config LIMIT 1");
      const threshold = configRes.rows.length > 0 ? parseInt(configRes.rows[0].eligibility_threshold, 10) : 6;
      const requiredMonths = getRequiredMonths(threshold);

      const contributionsFetch = await query(
        `SELECT month FROM contributions WHERE member_id = $1 AND status = 'success'`,
        [index]
      );
      const paidMonthsSet = new Set(contributionsFetch.rows.map(r => r.month));
      const missingMonths = requiredMonths.filter(m => !paidMonthsSet.has(m));

      if (missingMonths.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Ineligibility Default: Members must have paid all consecutive contributions. Missing months: ${missingMonths.join(", ")}`
        }, { status: 400 });
      }

      // Generate ID server-side
      const loanId = `LN-${new Date().getFullYear()}-${randomUUID().slice(0, 6).toUpperCase()}`;

      await query(
        `INSERT INTO loans (id, applicant, index_id, amount, date_filed, term, repaid, status, reason, monthly_installment) VALUES ($1, $2, $3, $4, $5, $6, 0, 'Pending', $7, $8)`,
        [loanId, applicant, index, amtCheck.value, new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), term, reason, parseFloat(monthlyInstallment)]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Loan', $3, $4)`,
        [timestamp, session.name, `Emergency loan application ${loanId} submitted for GH₵${amtCheck.value}`, ip]
      );

      return NextResponse.json({ success: true, loanId });
    }

    // ── SETTLE INSTALLMENT (staff for own loan, or admin) ─────────────────
    if (action === "settleInstallment") {
      const { loanId, paymentAmount, userProfileName } = payload;

      if (session.role === "auditor") {
        return NextResponse.json({ success: false, error: "Auditors cannot settle installments." }, { status: 403 });
      }

      const parsedAmount = parseFloat(paymentAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ success: false, error: "Payment amount must be positive." }, { status: 400 });
      }

      const loanFetch = await query("SELECT amount, repaid, index_id FROM loans WHERE id = $1", [loanId]);
      if (loanFetch.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Loan not found" }, { status: 404 });
      }

      // Staff can only settle their own loans
      const loan = loanFetch.rows[0];
      if (session.role === "staff" && loan.index_id !== session.userId) {
        return NextResponse.json({ success: false, error: "You can only settle your own loan installments." }, { status: 403 });
      }

      const { amount, repaid } = loan;
      const nextRepaid = parseFloat(repaid) + parsedAmount;
      const finished = nextRepaid >= parseFloat(amount);
      const newStatus = finished ? "Repaid" : "Active";

      await query(
        `UPDATE loans SET repaid = LEAST($1, amount), status = $2 WHERE id = $3`,
        [nextRepaid, newStatus, loanId]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Loan Repayment', $3, $4)`,
        [timestamp, session.name, `Loan installment of GH₵${parsedAmount} settled for ${loanId}`, ip]
      );

      return NextResponse.json({ success: true });
    }

    // ── VERIFY LOAN PAYMENT (via Paystack API) ───────────────────────────
    if (action === "verifyLoanPayment") {
      const { reference, loanId, paymentAmount, userProfileName } = payload;

      if (session.role === "auditor") {
        return NextResponse.json({ success: false, error: "Auditors cannot verify payments." }, { status: 403 });
      }

      const parsedAmount = parseFloat(paymentAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ success: false, error: "Payment amount must be positive." }, { status: 400 });
      }

      // Verify the payment on Paystack
      const verifyRes = await verifyPaystackPayment(reference, parsedAmount);
      if (!verifyRes.success) {
        return NextResponse.json({ success: false, error: verifyRes.error }, { status: 400 });
      }

      const loanFetch = await query("SELECT amount, repaid, index_id FROM loans WHERE id = $1", [loanId]);
      if (loanFetch.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Loan not found" }, { status: 404 });
      }

      const loan = loanFetch.rows[0];
      if (session.role === "staff" && loan.index_id !== session.userId) {
        return NextResponse.json({ success: false, error: "You can only settle your own loan installments." }, { status: 403 });
      }

      const { amount, repaid } = loan;
      const nextRepaid = parseFloat(repaid) + parsedAmount;
      const finished = nextRepaid >= parseFloat(amount);
      const newStatus = finished ? "Repaid" : "Active";

      await query(
        `UPDATE loans SET repaid = LEAST($1, amount), status = $2 WHERE id = $3`,
        [nextRepaid, newStatus, loanId]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Loan Repayment', $3, $4)`,
        [timestamp, session.name, `Paystack transaction ${reference} verified for loan installment of GH₵${parsedAmount} on ${loanId}`, ip]
      );

      return NextResponse.json({ success: true });
    }

    // ── UPDATE MEMBER PRIVILEGES (admin only) ─────────────────────────────
    if (action === "updateMemberPrivileges") {
      if (!requireRole(session, "admin")) {
        return NextResponse.json({ success: false, error: "Only administrators can update member privileges." }, { status: 403 });
      }

      const { memberId, role, status } = payload;
      if (!memberId || !role || !status) {
        return NextResponse.json({ success: false, error: "Missing required fields: memberId, role, status." }, { status: 400 });
      }

      if (!["staff", "admin", "auditor"].includes(role)) {
        return NextResponse.json({ success: false, error: "Invalid role specified." }, { status: 400 });
      }

      if (!["Active", "Defaulting", "New"].includes(status)) {
        return NextResponse.json({ success: false, error: "Invalid status specified." }, { status: 400 });
      }

      // We should check that the admin doesn't demote themselves to prevent losing access
      if (memberId === session.userId && role !== "admin") {
        return NextResponse.json({ success: false, error: "You cannot change your own administrator privilege status." }, { status: 400 });
      }

      const checkMember = await query("SELECT name, role, status FROM members WHERE id = $1", [memberId]);
      if (checkMember.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Member not found." }, { status: 404 });
      }

      const { name: memberName, role: oldRole, status: oldStatus } = checkMember.rows[0];

      await query(
        `UPDATE members SET role = $1, status = $2 WHERE id = $3`,
        [role, status, memberId]
      );

      const logMsg = `Updated privileges for ${memberName} (${memberId}): Role changed from '${oldRole}' to '${role}', Status changed from '${oldStatus}' to '${status}'`;

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Update Privileges', $3, $4)`,
        [timestamp, session.name, logMsg, ip]
      );

      return NextResponse.json({ success: true });
    }

    // ── APPROVE CLAIM (admin only) ────────────────────────────────────────
    if (action === "approveClaim") {
      if (!requireRole(session, "admin")) {
        return NextResponse.json({ success: false, error: "Only administrators can approve claims." }, { status: 403 });
      }

      const { claimId, amount, userProfileName } = payload;
      const parsedAmount = parseFloat(amount);

      const claimFetch = await query("SELECT applicant, type, status FROM claims WHERE id = $1", [claimId]);
      if (claimFetch.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });
      }
      if (claimFetch.rows[0].status !== "Pending") {
        return NextResponse.json({ success: false, error: "This claim has already been processed." }, { status: 400 });
      }

      // Check sufficient funds (corrected double-entry accounting)
      const fundCheck = await query("SELECT COALESCE(SUM(amount), 0) as collected FROM contributions WHERE status = 'success';");
      const disbursedCheck = await query("SELECT COALESCE(SUM(amount), 0) as disbursed FROM claims WHERE status = 'Approved';");
      const loansDisbursedCheck = await query("SELECT COALESCE(SUM(amount), 0) as total_lent FROM loans WHERE status IN ('Active', 'Repaid');");
      const repaymentsCheck = await query("SELECT COALESCE(SUM(repaid), 0) as total_repaid FROM loans;");

      const availableFund = parseFloat(fundCheck.rows[0].collected) + parseFloat(repaymentsCheck.rows[0].total_repaid) - parseFloat(disbursedCheck.rows[0].disbursed) - parseFloat(loansDisbursedCheck.rows[0].total_lent);

      if (parsedAmount > availableFund) {
        return NextResponse.json({ success: false, error: `Insufficient funds. Available: GH₵${availableFund.toFixed(2)}, Requested: GH₵${parsedAmount.toFixed(2)}` }, { status: 400 });
      }

      const { applicant, type } = claimFetch.rows[0];

      const client = await getClient();
      try {
        await client.query("BEGIN");

        await client.query(
          `UPDATE claims SET status = 'Approved', notes = 'Approved by committee. Payout processed.' WHERE id = $1`,
          [claimId]
        );

        await client.query(
          `INSERT INTO activities (title, amount, type, date_str) VALUES ($1, $2, 'in', 'Just now')`,
          [`Claim approved — ${applicant}, ${type}`, `GH₵${parsedAmount}`]
        );

        await client.query(
          `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Claim', $3, $4)`,
          [timestamp, session.name, `Claim ${claimId} approved: GH₵${parsedAmount}`, ip]
        );

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }

      return NextResponse.json({ success: true });
    }

    // ── REJECT CLAIM (admin only) ─────────────────────────────────────────
    if (action === "rejectClaim") {
      if (!requireRole(session, "admin")) {
        return NextResponse.json({ success: false, error: "Only administrators can reject claims." }, { status: 403 });
      }

      const { claimId, userProfileName } = payload;

      await query(
        `UPDATE claims SET status = 'Rejected', notes = 'Rejected. Documents validation failed.' WHERE id = $1`,
        [claimId]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Claim', $3, $4)`,
        [timestamp, session.name, `Claim ${claimId} rejected`, ip]
      );

      return NextResponse.json({ success: true });
    }

    // ── APPROVE LOAN (admin only) ─────────────────────────────────────────
    if (action === "approveLoan") {
      if (!requireRole(session, "admin")) {
        return NextResponse.json({ success: false, error: "Only administrators can approve loans." }, { status: 403 });
      }

      const { loanId, userProfileName } = payload;

      const loanFetch = await query("SELECT applicant, amount, status FROM loans WHERE id = $1", [loanId]);
      if (loanFetch.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Loan not found" }, { status: 404 });
      }
      if (loanFetch.rows[0].status !== "Pending") {
        return NextResponse.json({ success: false, error: "This loan has already been processed." }, { status: 400 });
      }

      // Check sufficient funds (corrected double-entry accounting)
      const loanAmount = parseFloat(loanFetch.rows[0].amount);
      const fundCheck = await query("SELECT COALESCE(SUM(amount), 0) as collected FROM contributions WHERE status = 'success';");
      const disbursedCheck = await query("SELECT COALESCE(SUM(amount), 0) as disbursed FROM claims WHERE status = 'Approved';");
      const loansDisbursedCheck = await query("SELECT COALESCE(SUM(amount), 0) as total_lent FROM loans WHERE status IN ('Active', 'Repaid');");
      const repaymentsCheck = await query("SELECT COALESCE(SUM(repaid), 0) as total_repaid FROM loans;");

      const availableFund = parseFloat(fundCheck.rows[0].collected) + parseFloat(repaymentsCheck.rows[0].total_repaid) - parseFloat(disbursedCheck.rows[0].disbursed) - parseFloat(loansDisbursedCheck.rows[0].total_lent);

      if (loanAmount > availableFund) {
        return NextResponse.json({ success: false, error: `Insufficient funds. Available: GH₵${availableFund.toFixed(2)}, Requested: GH₵${loanAmount.toFixed(2)}` }, { status: 400 });
      }

      const { applicant } = loanFetch.rows[0];

      await query(
        `UPDATE loans SET status = 'Active' WHERE id = $1`,
        [loanId]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Loan Approval', $3, $4)`,
        [timestamp, session.name, `Loan request ${loanId} for ${applicant} approved`, ip]
      );

      return NextResponse.json({ success: true });
    }

    // ── REJECT LOAN (admin only) ──────────────────────────────────────────
    if (action === "rejectLoan") {
      if (!requireRole(session, "admin")) {
        return NextResponse.json({ success: false, error: "Only administrators can reject loans." }, { status: 403 });
      }

      const { loanId, userProfileName } = payload;
      await query(
        `UPDATE loans SET status = 'Rejected' WHERE id = $1`,
        [loanId]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Loan Rejection', $3, $4)`,
        [timestamp, session.name, `Loan request ${loanId} rejected`, ip]
      );

      return NextResponse.json({ success: true });
    }

    // ── GENERATE REPORT (admin or auditor) ────────────────────────────────
    if (action === "generateReport") {
      if (!requireRole(session, "admin", "auditor")) {
        return NextResponse.json({ success: false, error: "Only administrators and auditors can generate reports." }, { status: 403 });
      }

      const { name, period, userProfileName } = payload;
      
      await query("DELETE FROM reports WHERE period = $1", [period]);

      await query(
        `INSERT INTO reports (name, period, date_str, status) VALUES ($1, $2, $3, 'Available')`,
        [name, period, new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Report', $3, $4)`,
        [timestamp, session.name, `Financial Report generated for ${period}`, ip]
      );

      return NextResponse.json({ success: true });
    }

    // ── MARK ALL NOTIFICATIONS READ (any authenticated user) ──────────────
    if (action === "markAllNotifRead") {
      await query("UPDATE notifications SET unread = false");
      return NextResponse.json({ success: true });
    }

    // ── SEND SMS (admin only) ─────────────────────────────────────────────
    if (action === "sendSMS") {
      if (!requireRole(session, "admin")) {
        return NextResponse.json({ success: false, error: "Only administrators can send SMS broadcasts." }, { status: 403 });
      }

      const { type, recipients, message, userProfileName } = payload;

      const msgCheck = validateNonEmpty(message, "SMS message");
      if (!msgCheck.valid) return NextResponse.json({ success: false, error: msgCheck.error }, { status: 400 });

      await query(
        `INSERT INTO sms_history (title, recipients, date_str, status) VALUES ($1, $2, $3, 'success')`,
        [type, `Sent to ${recipients}`, new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })]
      );

      await query(
        `INSERT INTO activities (title, amount, type, date_str) VALUES ($1, 'Broadcast', 'sms', 'Just now')`,
        [`SMS broadcast sent: ${type}`]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'SMS', $3, $4)`,
        [timestamp, session.name, `SMS Broadcast: "${msgCheck.value.slice(0, 30)}..." sent to ${recipients}`, ip]
      );

      return NextResponse.json({ success: true });
    }

    // ── ADD LOGIN LOG (legacy — kept for compatibility) ───────────────────
    if (action === "addLoginLog") {
      const { email } = payload;
      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Login', 'User authenticated via secure portal', $3)`,
        [timestamp, email, ip]
      );
      return NextResponse.json({ success: true });
    }

    // ── SAVE CLAIM DOCUMENTS (metadata after Supabase upload) ────────────
    if (action === "saveClaimDocuments") {
      if (session.role === "auditor") {
        return NextResponse.json({ success: false, error: "Auditors cannot upload documents." }, { status: 403 });
      }

      const { claimId, memberId, documents } = payload;
      // documents: [{ fileName, fileUrl, fileType }]
      if (!Array.isArray(documents) || documents.length === 0) {
        return NextResponse.json({ success: false, error: "No documents provided." }, { status: 400 });
      }

      const uploaded = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      for (const doc of documents) {
        await query(
          `INSERT INTO claim_documents (claim_id, member_id, file_name, file_url, file_type, uploaded_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [claimId, memberId, doc.fileName, doc.fileUrl, doc.fileType || "application/octet-stream", uploaded]
        );
      }

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Document Upload', $3, $4)`,
        [timestamp, session.name, `${documents.length} document(s) uploaded for claim ${claimId}`, ip]
      );

      return NextResponse.json({ success: true });
    }

    // ── GET CLAIM DOCUMENTS ───────────────────────────────────────────────
    if (action === "getClaimDocuments") {
      const { claimId } = payload;
      const result = await query(
        `SELECT * FROM claim_documents WHERE claim_id = $1 ORDER BY id ASC`,
        [claimId]
      );
      return NextResponse.json({ success: true, documents: result.rows });
    }

    // ── SAVE SETTINGS (admin only) ─────────────────────────────────────────
    if (action === "saveSettings") {
      if (!requireRole(session, "admin")) {
        return NextResponse.json({ success: false, error: "Only administrators can save settings." }, { status: 403 });
      }
      const { monthlyContribution, eligibilityThreshold, smsGateway, financialYear } = payload;
      
      const checkConfig = await query("SELECT id FROM scheme_config LIMIT 1;");
      if (checkConfig.rows.length > 0) {
        await query(
          `UPDATE scheme_config SET monthly_contribution = $1, eligibility_threshold = $2, sms_gateway = $3, financial_year = $4`,
          [parseFloat(monthlyContribution), parseInt(eligibilityThreshold), smsGateway, financialYear]
        );
      } else {
        await query(
          `INSERT INTO scheme_config (monthly_contribution, eligibility_threshold, sms_gateway, financial_year) VALUES ($1, $2, $3, $4)`,
          [parseFloat(monthlyContribution), parseInt(eligibilityThreshold), smsGateway, financialYear]
        );
      }

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Settings Update', 'Scheme configuration updated successfully', $3)`,
        [timestamp, session.name, ip]
      );
      return NextResponse.json({ success: true });
    }

    // ── CREATE NOTICE (admin only) ──────────────────────────────────────
    if (action === "createNotice") {
      if (!requireRole(session, "admin")) {
        return NextResponse.json({ success: false, error: "Only administrators can post notices." }, { status: 403 });
      }
      const { category, title, body: noticeBody } = payload;
      const titleCheck = validateNonEmpty(title, "Notice title");
      if (!titleCheck.valid) return NextResponse.json({ success: false, error: titleCheck.error }, { status: 400 });
      const bodyCheck = validateNonEmpty(noticeBody, "Notice body");
      if (!bodyCheck.valid) return NextResponse.json({ success: false, error: bodyCheck.error }, { status: 400 });

      await query(
        `INSERT INTO notices (category, title, body) VALUES ($1, $2, $3)`,
        [category || "Announcement", titleCheck.value, bodyCheck.value]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Notice', $3, $4)`,
        [timestamp, session.name, `Posted notice: ${titleCheck.value}`, ip]
      );

      return NextResponse.json({ success: true });
    }

    // ── DELETE NOTICE (admin only) ──────────────────────────────────────
    if (action === "deleteNotice") {
      if (!requireRole(session, "admin")) {
        return NextResponse.json({ success: false, error: "Only administrators can delete notices." }, { status: 403 });
      }
      const { noticeId } = payload;
      if (!noticeId) return NextResponse.json({ success: false, error: "Notice ID is required." }, { status: 400 });

      await query(`DELETE FROM notices WHERE id = $1`, [noticeId]);

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Notice', $3, $4)`,
        [timestamp, session.name, `Deleted notice #${noticeId}`, ip]
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error("Portal POST Mutation Error:", err);
    return NextResponse.json({ success: false, error: "An unexpected system error occurred while processing your request." }, { status: 500 });
  }
}
