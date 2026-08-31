import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sms-dispatch
 * Sends SMS via SailUp. Resolves recipients from DB or custom phone list.
 * Body: { recipients, message, targetMemberId?, customPhones?, type? }
 */
export async function POST(req) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 });
    }

    const { recipients: recipientGroup, message, targetMemberId, customPhones, type } = await req.json();

    const messageText = (message || '').trim();
    if (!messageText) {
      return NextResponse.json({ success: false, error: 'Message cannot be empty.' }, { status: 400 });
    }

    // ── Resolve recipient phone numbers ──────────────────────────
    let rawPhoneList = [];
    let recipientLabel = 'All Members';

    if (customPhones && customPhones.trim() && recipientGroup && recipientGroup.toLowerCase().includes('custom')) {
      rawPhoneList = customPhones.split(',').map(p => p.trim()).filter(Boolean);
      recipientLabel = `Custom Numbers (${rawPhoneList.length})`;
    } else if (targetMemberId) {
      const res = await query('SELECT phone, name FROM members WHERE LOWER(id) = LOWER($1)', [targetMemberId]);
      if (!res.rows.length) {
        return NextResponse.json({ success: false, error: 'Member not found.' }, { status: 404 });
      }
      rawPhoneList = [res.rows[0].phone];
      recipientLabel = `Direct: ${res.rows[0].name}`;
    } else if (customPhones && customPhones.trim()) {
      rawPhoneList = customPhones.split(',').map(p => p.trim()).filter(Boolean);
      recipientLabel = `Custom Numbers (${rawPhoneList.length})`;
    } else if (recipientGroup) {
      const groupLower = recipientGroup.toLowerCase();
      let dbQuery = 'SELECT phone FROM members;';
      if (groupLower.includes('tutag')) { dbQuery = "SELECT phone FROM members WHERE union_name='TUTAG';"; recipientLabel = 'TUTAG Members'; }
      else if (groupLower.includes('tusag')) { dbQuery = "SELECT phone FROM members WHERE union_name='TUSAG';"; recipientLabel = 'TUSAG Members'; }
      else if (groupLower.includes('tewu')) { dbQuery = "SELECT phone FROM members WHERE union_name='TEWU';"; recipientLabel = 'TEWU Members'; }
      else if (groupLower.includes('gaua')) { dbQuery = "SELECT phone FROM members WHERE union_name='GAUA';"; recipientLabel = 'GAUA Members'; }
      else if (groupLower.includes('defaulting')) { dbQuery = "SELECT phone FROM members WHERE status='Defaulting';"; recipientLabel = 'Defaulting Members'; }
      const dbRes = await query(dbQuery);
      rawPhoneList = dbRes.rows.map(m => m.phone).filter(Boolean);
    } else {
      const dbRes = await query('SELECT phone FROM members;');
      rawPhoneList = dbRes.rows.map(m => m.phone).filter(Boolean);
    }

    // ── Sanitize & validate phone numbers ────────────────────────
    const validNumbers = [];
    const invalidNumbers = [];
    const seen = new Set();
    for (const raw of rawPhoneList) {
      if (!raw || typeof raw !== 'string') continue;
      let cleaned = raw.replace(/[\s\-\(\)\.]/g, '').trim();
      if (/^0[2356]\d{8}$/.test(cleaned)) cleaned = `+233${cleaned.substring(1)}`;
      else if (/^233[2356]\d{8}$/.test(cleaned)) cleaned = `+${cleaned}`;
      const ghanaOk = /^\+233[2356]\d{8}$/.test(cleaned);
      const genericOk = /^\+[1-9]\d{9,14}$/.test(cleaned);
      if ((ghanaOk || genericOk) && !seen.has(cleaned)) {
        seen.add(cleaned);
        validNumbers.push(cleaned);
      } else if (raw.trim()) {
        invalidNumbers.push(raw.trim());
      }
    }

    if (validNumbers.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid phone numbers found for the selected recipients.' }, { status: 400 });
    }

    // ── Call SailUp API directly ──────────────────────────────────
    const apiKey = process.env.SAILUP_API_KEY || 'sailup_v8xXqOHrgAEhUTVBkFXJ_9iTgtDDcGMWQKFl4v74mUQ';
    const from = process.env.SAILUP_DEFAULT_SENDER || 'HTUWELFARE';

    const sailupRes = await fetch('https://api.sailup.io/v1/sms/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: validNumbers, body: messageText }),
    });

    const sailupData = await sailupRes.json().catch(() => ({}));

    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const title = type || (messageText.length > 40 ? `${messageText.substring(0, 37)}...` : messageText);

    if (!sailupRes.ok) {
      const errMsg = sailupData?.detail || sailupData?.message || `SailUp error ${sailupRes.status}`;
      console.error('[sms-dispatch] SailUp rejected:', sailupRes.status, errMsg);
      await query(`INSERT INTO sms_history (title, recipients, date_str, status) VALUES ($1, $2, $3, 'failed')`,
        [title, `${validNumbers.length} Recipient(s) [${recipientLabel}]`, dateStr]).catch(() => {});
      return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
    }

    // Success
    await query(`INSERT INTO sms_history (title, recipients, date_str, status) VALUES ($1, $2, $3, 'success')`,
      [title, `${validNumbers.length} Recipient(s) [${recipientLabel}]`, dateStr]).catch(() => {});
    await query(`INSERT INTO activities (title, amount, type, date_str) VALUES ($1, $2, 'register', 'Just now')`,
      [`SMS sent — ${title}`, `${validNumbers.length} Sent`]).catch(() => {});

    console.log(`[sms-dispatch] ✓ Sent to ${validNumbers.length} recipient(s) [${recipientLabel}]. SailUp status: ${sailupRes.status}`);

    return NextResponse.json({
      success: true,
      sentCount: validNumbers.length,
      skippedCount: invalidNumbers.length,
      message: `SMS dispatched to ${validNumbers.length} recipient(s).${invalidNumbers.length > 0 ? ` (${invalidNumbers.length} invalid skipped)` : ''}`,
    });

  } catch (err) {
    console.error('[sms-dispatch] Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Unexpected error.' }, { status: 500 });
  }
}
