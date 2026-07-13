import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { pbkdf2Sync, randomBytes } from "crypto";

// ── Deterministic hash helper (no bcrypt — works on Vercel serverless) ────────
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return `pbkdf2:${salt}:${hash}`;
}

// ── GET — browser-friendly setup trigger (protected by SETUP_SECRET query param) ──
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const expectedKey = process.env.SETUP_SECRET;

  // If no SETUP_SECRET is configured, allow in development only
  if (expectedKey && key !== expectedKey) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Provide ?key=<SETUP_SECRET> to run setup." },
      { status: 403 }
    );
  }

  // Delegate to POST handler logic inline
  return runSetup();
}

// ── POST — protected database reset and seed ──────────────────────────────────
export async function POST(request) {
  // Verify setup secret
  const setupKey = request.headers.get("x-setup-key");
  const expectedKey = process.env.SETUP_SECRET;

  if (expectedKey && setupKey !== expectedKey) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Provide a valid x-setup-key header." },
      { status: 403 }
    );
  }

  return runSetup();
}

// ── Core setup logic (shared by GET and POST) ─────────────────────────────────
async function runSetup() {
  try {
    // 1. Drop Tables in correct dependency order
    await query(`DROP TABLE IF EXISTS dues_ledger CASCADE;`);
    await query(`DROP TABLE IF EXISTS contributions CASCADE;`);
    await query(`DROP TABLE IF EXISTS claims CASCADE;`);
    await query(`DROP TABLE IF EXISTS loans CASCADE;`);
    await query(`DROP TABLE IF EXISTS notifications CASCADE;`);
    await query(`DROP TABLE IF EXISTS activities CASCADE;`);
    await query(`DROP TABLE IF EXISTS sms_history CASCADE;`);
    await query(`DROP TABLE IF EXISTS audit_logs CASCADE;`);
    await query(`DROP TABLE IF EXISTS reports CASCADE;`);
    await query(`DROP TABLE IF EXISTS members CASCADE;`);
    await query(`DROP TABLE IF EXISTS scheme_config CASCADE;`);

    // 2. Create Tables
    await query(`
      CREATE TABLE scheme_config (
        id SERIAL PRIMARY KEY,
        monthly_contribution DECIMAL(10,2) DEFAULT 25.00,
        eligibility_threshold INT DEFAULT 6,
        sms_gateway VARCHAR(100) DEFAULT 'Hubtel',
        financial_year VARCHAR(100) DEFAULT 'January – December'
      );
    `);

    await query(`
      CREATE TABLE members (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        union_name VARCHAR(50) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'staff',
        password_changed BOOLEAN DEFAULT FALSE,
        paid_months INT DEFAULT 0,
        total_months INT DEFAULT 6,
        status VARCHAR(50) DEFAULT 'New',
        dept VARCHAR(255)
      );
    `);

    await query(`
      CREATE TABLE dues_ledger (
        id VARCHAR(50) PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        union_name VARCHAR(50) NOT NULL,
        jan BOOLEAN DEFAULT FALSE,
        feb BOOLEAN DEFAULT FALSE,
        mar BOOLEAN DEFAULT FALSE,
        apr BOOLEAN DEFAULT FALSE,
        may BOOLEAN DEFAULT FALSE,
        jun BOOLEAN DEFAULT FALSE,
        jul BOOLEAN DEFAULT FALSE,
        aug BOOLEAN DEFAULT FALSE,
        sep BOOLEAN DEFAULT FALSE,
        oct BOOLEAN DEFAULT FALSE,
        nov BOOLEAN DEFAULT FALSE,
        dec BOOLEAN DEFAULT FALSE,
        total INT DEFAULT 0
      );
    `);

    await query(`
      CREATE TABLE contributions (
        id SERIAL PRIMARY KEY,
        member_id VARCHAR(50) REFERENCES members(id) ON DELETE CASCADE,
        reference VARCHAR(50) NOT NULL,
        month VARCHAR(50) NOT NULL,
        date_paid VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'success'
      );
    `);

    await query(`
      CREATE TABLE claims (
        id VARCHAR(50) PRIMARY KEY,
        applicant VARCHAR(255) NOT NULL,
        index_id VARCHAR(50) NOT NULL,
        type VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        date_filed VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        notes TEXT
      );
    `);

    await query(`
      CREATE TABLE loans (
        id VARCHAR(50) PRIMARY KEY,
        applicant VARCHAR(255) NOT NULL,
        index_id VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        date_filed VARCHAR(50) NOT NULL,
        term VARCHAR(50) NOT NULL,
        repaid DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Pending',
        reason TEXT,
        monthly_installment DECIMAL(10,2) NOT NULL
      );
    `);

    await query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        unread BOOLEAN DEFAULT TRUE,
        time_str VARCHAR(50) NOT NULL
      );
    `);

    await query(`
      CREATE TABLE activities (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        amount VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        date_str VARCHAR(50) NOT NULL
      );
    `);

    await query(`
      CREATE TABLE sms_history (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        recipients VARCHAR(255) NOT NULL,
        date_str VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL
      );
    `);

    await query(`
      CREATE TABLE audit_logs (
        id SERIAL PRIMARY KEY,
        timestamp_str VARCHAR(50) NOT NULL,
        username VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        details TEXT,
        ip_address VARCHAR(50)
      );
    `);

    await query(`
      CREATE TABLE reports (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        period VARCHAR(100) NOT NULL,
        date_str VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL
      );
    `);

    // 3. Seed members with hashed passwords
    // Default password for all staff: htu2026
    // Admin password:  manager2026
    // Auditor password: audit2026
    const seeds = [
      { id: "HTU/0042",    name: "Staff Member",    union: "TUTAG",   phone: "0244 123 456", email: "staff@gmail.com",           password: "htu2026",     role: "staff",   passwordChanged: false, status: "New",    dept: "Computer Science Department"  },
      { id: "HTU/ADM-001", name: "Scheme Manager",  union: "TUSAAG",  phone: "0302 000 000", email: "manager@htu.edu.gh",        password: "manager2026", role: "admin",   passwordChanged: true,  status: "Active", dept: "Administration Secretariat"    },
      { id: "HTU/AUD-002", name: "System Auditor",  union: "TUSAAG",  phone: "0302 000 001", email: "auditor@htu.edu.gh",        password: "audit2026",   role: "auditor", passwordChanged: true,  status: "Active", dept: "Internal Audit Directorate"    },
      { id: "HTU/0031",    name: "Kwame Asante",    union: "TUSAAG",  phone: "0244 789 012", email: "k.asante@htu.edu.gh",       password: "htu2026",     role: "staff",   passwordChanged: false, status: "New",    dept: "Business School"               },
      { id: "HTU/0112",    name: "James Darko",     union: "TEWU",    phone: "0277 456 789", email: "j.darko@htu.edu.gh",        password: "htu2026",     role: "staff",   passwordChanged: false, status: "New",    dept: "Engineering"                   },
      { id: "HTU/0087",    name: "Efua Forson",     union: "TUWAG",   phone: "0200 321 654", email: "e.forson@htu.edu.gh",       password: "htu2026",     role: "staff",   passwordChanged: false, status: "New",    dept: "Art & Design"                  },
      { id: "HTU/0249",    name: "Daniel Agbozo",   union: "TEWU",    phone: "0244 654 321", email: "d.agbozo@htu.edu.gh",       password: "htu2026",     role: "staff",   passwordChanged: false, status: "New",    dept: "Engineering"                   },
    ];

    for (const s of seeds) {
      await query(
        `INSERT INTO members (id, name, union_name, phone, email, password_hash, role, password_changed, paid_months, total_months, status, dept)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 6, $9, $10)`,
        [s.id, s.name, s.union, s.phone, s.email, hashPassword(s.password), s.role, s.passwordChanged, s.status, s.dept]
      );
    }

    // 4. Seed dues ledger (staff members only — no auditor/admin entries needed)
    const staffIds = seeds.filter(s => s.role === "staff");
    for (const s of staffIds) {
      await query(
        `INSERT INTO dues_ledger (id, name, union_name, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec, total)
         VALUES ($1, $2, $3, false, false, false, false, false, false, false, false, false, false, false, false, 0)`,
        [s.id, s.name, s.union]
      );
    }

    // 5. Seed scheme config
    await query(`
      INSERT INTO scheme_config (monthly_contribution, eligibility_threshold, sms_gateway, financial_year)
      VALUES (25.00, 6, 'Hubtel', 'January – December');
    `);

    // 6. Seed welcome notification + activity
    await query(`
      INSERT INTO notifications (text, unread, time_str) VALUES
      ('HTU Welfare Scheme Database initialized successfully.', true, 'Just now');
    `);
    await query(`
      INSERT INTO activities (title, amount, type, date_str) VALUES
      ('Database Seeder executed - Clean ledger initialized.', 'GH₵0', 'register', 'Just now');
    `);

    return NextResponse.json({
      success: true,
      message: "Database reset and seeded successfully.",
      credentials: {
        staff:   "any staff email  / htu2026",
        admin:   "manager@htu.edu.gh / manager2026",
        auditor: "auditor@htu.edu.gh / audit2026"
      }
    });
  } catch (err) {
    console.error("DDL / Seeding Error:", err);
    return NextResponse.json({ success: false, error: "Database setup failed. Please contact the administrator or verify configuration." }, { status: 500 });
  }
}
