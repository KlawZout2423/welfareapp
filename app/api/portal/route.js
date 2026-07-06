import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const membersRes = await query("SELECT * FROM members ORDER BY name ASC;");
    const duesLedgerRes = await query("SELECT * FROM dues_ledger ORDER BY name ASC;");
    const contributionsRes = await query("SELECT * FROM contributions ORDER BY id DESC;");
    const claimsRes = await query("SELECT * FROM claims ORDER BY id DESC;");
    const loansRes = await query("SELECT * FROM loans ORDER BY id DESC;");
    const notificationsRes = await query("SELECT * FROM notifications ORDER BY id DESC;");
    const activitiesRes = await query("SELECT * FROM activities ORDER BY id DESC;");
    const smsHistoryRes = await query("SELECT * FROM sms_history ORDER BY id DESC;");
    const auditLogsRes = await query("SELECT * FROM audit_logs ORDER BY id DESC;");
    const reportsRes = await query("SELECT * FROM reports ORDER BY id DESC;");

    // Compute fund metrics
    const collectionsSum = await query("SELECT SUM(amount) as total FROM contributions;");
    const disbursedSum = await query("SELECT SUM(amount) as total FROM claims WHERE status = 'Approved';");
    const activeLoansSum = await query("SELECT SUM(amount - repaid) as total FROM loans WHERE status = 'Active';");
    const juneCollectionsSum = await query("SELECT SUM(amount) as total FROM contributions WHERE month = 'June 2026';");

    const totalCollected = parseFloat(collectionsSum.rows[0].total || 0);
    const totalDisbursed = parseFloat(disbursedSum.rows[0].total || 0);
    const activeLoans = parseFloat(activeLoansSum.rows[0].total || 0);
    const juneCollections = parseFloat(juneCollectionsSum.rows[0].total || 0);

    const baseFund = 0;
    const totalFund = baseFund + totalCollected - totalDisbursed;

    const fundStats = {
      totalFund: totalFund,
      totalDisbursed: totalDisbursed, 
      juneCollections: juneCollections || 0,
      activeLoans: activeLoans || 0
    };

    return NextResponse.json({
      members: membersRes.rows.map(m => ({
        ...m,
        union: m.union_name,
        paidMonths: m.paid_months,
        totalMonths: m.total_months
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
      fundStats
    });
  } catch (err) {
    console.error("Portal GET State Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, payload } = body;
    const timestamp = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const ip = "196.216.x.x";

    if (action === "registerMember") {
      const { firstName, lastName, staffId, union, phone, email, department, employmentDate } = payload;
      const fullName = `${firstName} ${lastName}`;
      
      const existing = await query("SELECT id FROM members WHERE id = $1", [staffId]);
      if (existing.rows.length > 0) {
        return NextResponse.json({ success: false, error: "Member with this Staff ID already exists." }, { status: 400 });
      }

      await query(
        `INSERT INTO members (id, name, union_name, phone, email, paid_months, total_months, status, dept) VALUES ($1, $2, $3, $4, $5, 1, 6, 'New', $6)`,
        [staffId, fullName, union, phone || "0240 000 000", email || "name@htu.edu.gh", department]
      );

      await query(
        `INSERT INTO dues_ledger (id, name, union_name, jan, feb, mar, apr, may, jun, total) VALUES ($1, $2, $3, false, false, false, false, false, true, 25)`,
        [staffId, fullName, union]
      );

      await query(
        `INSERT INTO activities (title, amount, type, date_str) VALUES ($1, 'New Member', 'register', 'Just now')`,
        [`New member registered — ${fullName} (${union})`]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Register', $3, $4)`,
        [timestamp, "Scheme Manager", `Registered new member ${fullName} (${staffId})`, ip]
      );

      return NextResponse.json({ success: true });
    }

    if (action === "recordPayment") {
      const { memberId, month, amount, method, memberName } = payload;
      const parsedAmount = parseFloat(amount);
      const ref = `TX-MOM-${Math.floor(1000 + Math.random() * 9000)}`;

      await query(
        `INSERT INTO contributions (member_id, reference, month, date_paid, amount, status) VALUES ($1, $2, $3, $4, $5, 'success')`,
        [memberId, ref, month, new Date().toISOString().split("T")[0], parsedAmount]
      );

      await query(
        `UPDATE members SET paid_months = LEAST(paid_months + 1, 6), status = 'Active' WHERE id = $1`,
        [memberId]
      );

      const checkLedger = await query(`SELECT id FROM dues_ledger WHERE id = $1`, [memberId]);
      if (checkLedger.rows.length > 0) {
        // Map contribution month name to the ledger column
        const monthColMap = {
          jan: ["jan", "january"],
          feb: ["feb", "february"],
          mar: ["mar", "march"],
          apr: ["apr", "april"],
          may: ["may"],
          jun: ["jun", "june"],
        };
        const monthLower = (month || "").toLowerCase();
        let column = null;
        for (const [col, aliases] of Object.entries(monthColMap)) {
          if (aliases.some(a => monthLower.includes(a))) {
            column = col;
            break;
          }
        }
        // Only update the ledger if the month maps to a tracked column
        if (column) {
          await query(
            `UPDATE dues_ledger SET ${column} = true, total = total + $1 WHERE id = $2`,
            [parsedAmount, memberId]
          );
        }
      }

      await query(
        `INSERT INTO activities (title, amount, type, date_str) VALUES ($1, $2, 'in', 'Just now')`,
        [`MoMo payment confirmed — ${memberName}`, `GH₵${amount}`]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Payment', $3, $4)`,
        [timestamp, "Scheme Manager", `Payment of GH₵${amount} recorded for ${memberName}`, ip]
      );

      return NextResponse.json({ success: true });
    }

    if (action === "submitClaim") {
      const { id, applicant, index, type, amount, notes, userProfileName } = payload;
      await query(
        `INSERT INTO claims (id, applicant, index_id, type, amount, date_filed, status, notes) VALUES ($1, $2, $3, $4, $5, $6, 'Pending', $7)`,
        [id, applicant, index, type, parseFloat(amount), new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), notes]
      );

      await query(
        `INSERT INTO activities (title, amount, type, date_str) VALUES ($1, $2, 'claim', 'Just now')`,
        [`Benefit claim submitted — ${applicant} (${type})`, `GH₵${amount}`]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Claim', $3, $4)`,
        [timestamp, userProfileName, `Claim ${id} submitted for GH₵${amount}`, ip]
      );

      return NextResponse.json({ success: true });
    }

    if (action === "submitLoan") {
      const { id, applicant, index, amount, term, reason, monthlyInstallment } = payload;
      await query(
        `INSERT INTO loans (id, applicant, index_id, amount, date_filed, term, repaid, status, reason, monthly_installment) VALUES ($1, $2, $3, $4, $5, $6, 0, 'Pending', $7, $8)`,
        [id, applicant, index, parseFloat(amount), new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), term, reason, parseFloat(monthlyInstallment)]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Loan', $3, $4)`,
        [timestamp, applicant, `Emergency loan application ${id} submitted for GH₵${amount}`, ip]
      );

      return NextResponse.json({ success: true });
    }

    if (action === "settleInstallment") {
      const { loanId, paymentAmount, userProfileName } = payload;
      const parsedAmount = parseFloat(paymentAmount);

      const loanFetch = await query("SELECT amount, repaid FROM loans WHERE id = $1", [loanId]);
      if (loanFetch.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Loan not found" }, { status: 404 });
      }

      const { amount, repaid } = loanFetch.rows[0];
      const nextRepaid = parseFloat(repaid) + parsedAmount;
      const finished = nextRepaid >= parseFloat(amount);
      const newStatus = finished ? "Repaid" : "Active";

      await query(
        `UPDATE loans SET repaid = LEAST($1, amount), status = $2 WHERE id = $3`,
        [nextRepaid, newStatus, loanId]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Loan Repayment', $3, $4)`,
        [timestamp, userProfileName, `Loan installment of GH₵${parsedAmount} settled for ${loanId}`, ip]
      );

      return NextResponse.json({ success: true });
    }

    if (action === "approveClaim") {
      const { claimId, amount, userProfileName } = payload;
      const parsedAmount = parseFloat(amount);

      const claimFetch = await query("SELECT applicant, type FROM claims WHERE id = $1", [claimId]);
      if (claimFetch.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });
      }

      const { applicant, type } = claimFetch.rows[0];

      await query(
        `UPDATE claims SET status = 'Approved', notes = 'Approved by committee. Payout processed.' WHERE id = $1`,
        [claimId]
      );

      await query(
        `INSERT INTO activities (title, amount, type, date_str) VALUES ($1, $2, 'in', 'Just now')`,
        [`Claim approved — ${applicant}, ${type}`, `GH₵${parsedAmount}`]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Claim', $3, $4)`,
        [timestamp, userProfileName, `Claim ${claimId} approved: GH₵${parsedAmount}`, ip]
      );

      return NextResponse.json({ success: true });
    }

    if (action === "rejectClaim") {
      const { claimId, userProfileName } = payload;
      await query(
        `UPDATE claims SET status = 'Rejected', notes = 'Rejected. Documents validation failed.' WHERE id = $1`,
        [claimId]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Claim', $3, $4)`,
        [timestamp, userProfileName, `Claim ${claimId} rejected`, ip]
      );

      return NextResponse.json({ success: true });
    }

    if (action === "approveLoan") {
      const { loanId, userProfileName } = payload;

      const loanFetch = await query("SELECT applicant, amount FROM loans WHERE id = $1", [loanId]);
      if (loanFetch.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Loan not found" }, { status: 404 });
      }

      const { applicant } = loanFetch.rows[0];

      await query(
        `UPDATE loans SET status = 'Active' WHERE id = $1`,
        [loanId]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Loan Approval', $3, $4)`,
        [timestamp, userProfileName, `Loan request ${loanId} for ${applicant} approved`, ip]
      );

      return NextResponse.json({ success: true });
    }

    if (action === "rejectLoan") {
      const { loanId, userProfileName } = payload;
      await query(
        `UPDATE loans SET status = 'Rejected' WHERE id = $1`,
        [loanId]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Loan Rejection', $3, $4)`,
        [timestamp, userProfileName, `Loan request ${loanId} rejected`, ip]
      );

      return NextResponse.json({ success: true });
    }

    if (action === "generateReport") {
      const { name, period, userProfileName } = payload;
      
      await query("DELETE FROM reports WHERE period = $1", [period]);

      await query(
        `INSERT INTO reports (name, period, date_str, status) VALUES ($1, $2, $3, 'Available')`,
        [name, period, new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })]
      );

      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Report', $3, $4)`,
        [timestamp, userProfileName, `Financial Report generated for ${period}`, ip]
      );

      return NextResponse.json({ success: true });
    }

    if (action === "markAllNotifRead") {
      await query("UPDATE notifications SET unread = false");
      return NextResponse.json({ success: true });
    }

    if (action === "sendSMS") {
      const { type, recipients, message, userProfileName } = payload;
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
        [timestamp, userProfileName, `SMS Broadcast: "${message.slice(0, 30)}..." sent to ${recipients}`, ip]
      );

      return NextResponse.json({ success: true });
    }

    if (action === "addLoginLog") {
      const { email } = payload;
      await query(
        `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'Login', 'User authenticated via secure portal', $3)`,
        [timestamp, email, ip]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error("Portal POST Mutation Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
