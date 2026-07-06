import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
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

    // 2. Create Tables
    await query(`
      CREATE TABLE members (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        union_name VARCHAR(50) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
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

    // 3. Seed baseline datasets (All balances/ledger amounts set to zero)
    // Seed staff/admin user logins into the members table
    await query(`
      INSERT INTO members (id, name, union_name, phone, email, paid_months, total_months, status, dept) VALUES
      ('HTU/0042', 'Eugene Dushie', 'TUTAG', '0244 123 456', 'eugene.dushie@htu.edu.gh', 0, 6, 'New', 'Computer Science Department'),
      ('HTU/ADM-001', 'Scheme Manager', 'TUSAAG', '0302 000 000', 'manager@htu.edu.gh', 0, 6, 'Active', 'Administration Secretariat'),
      ('HTU/0031', 'Kwame Asante', 'TUSAAG', '0244 789 012', 'k.asante@htu.edu.gh', 0, 6, 'New', 'Business School'),
      ('HTU/0112', 'James Darko', 'TEWU', '0277 456 789', 'j.darko@htu.edu.gh', 0, 6, 'New', 'Engineering'),
      ('HTU/0087', 'Efua Forson', 'TUWAG', '0200 321 654', 'e.forson@htu.edu.gh', 0, 6, 'New', 'Art & Design'),
      ('HTU/0249', 'Daniel Agbozo', 'TEWU', '0244 654 321', 'd.agbozo@htu.edu.gh', 0, 6, 'New', 'Engineering');
    `);

    // Dues Ledger Seeding (All set to false, totals are 0)
    await query(`
      INSERT INTO dues_ledger (id, name, union_name, jan, feb, mar, apr, may, jun, total) VALUES
      ('HTU/0042', 'Eugene Dushie', 'TUTAG', false, false, false, false, false, false, 0),
      ('HTU/ADM-001', 'Scheme Manager', 'TUSAAG', false, false, false, false, false, false, 0),
      ('HTU/0031', 'Kwame Asante', 'TUSAAG', false, false, false, false, false, false, 0),
      ('HTU/0112', 'James Darko', 'TEWU', false, false, false, false, false, false, 0),
      ('HTU/0087', 'Efua Forson', 'TUWAG', false, false, false, false, false, false, 0),
      ('HTU/0249', 'Daniel Agbozo', 'TEWU', false, false, false, false, false, false, 0);
    `);

    // Seed a basic welcome notification
    await query(`
      INSERT INTO notifications (text, unread, time_str) VALUES
      ('HTU Welfare Scheme Database initialized successfully.', true, 'Just now');
    `);

    // Seed a basic welcome activity
    await query(`
      INSERT INTO activities (title, amount, type, date_str) VALUES
      ('Database Seeder executed - Clean ledger initialized.', 'GH₵0', 'register', 'Just now');
    `);

    return NextResponse.json({ success: true, message: "Neon PostgreSQL database reset and seeded with zeroed amounts successfully." });
  } catch (err) {
    console.error("DDL / Seeding Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
