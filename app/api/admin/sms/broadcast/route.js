import { NextResponse } from 'next/server';
import { sailup } from '@/lib/sailup';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { processPhoneNumbers } from '@/lib/phone';

export async function POST(req) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { recipientGroup, recipients, customMessage, type, sender } = await req.json();

    const messageText = (customMessage || '').trim();
    if (!messageText) {
      return NextResponse.json({ error: 'Message body cannot be empty.' }, { status: 400 });
    }

    let rawPhoneList = [];
    let recipientLabel = 'Target Members';

    // 1. Resolve recipient phone numbers from Database if recipientGroup specified
    if (recipientGroup && typeof recipientGroup === 'string') {
      recipientLabel = recipientGroup;
      let dbQuery = 'SELECT phone, name, union_name, status FROM members;';
      let dbParams = [];

      if (recipientGroup.toLowerCase().includes('tutag')) {
        dbQuery = "SELECT phone, name FROM members WHERE union_name = 'TUTAG';";
      } else if (recipientGroup.toLowerCase().includes('defaulting')) {
        dbQuery = "SELECT phone, name FROM members WHERE status = 'Defaulting';";
      }

      const dbRes = await query(dbQuery, dbParams);
      rawPhoneList = dbRes.rows.map(m => m.phone).filter(Boolean);
    } else if (Array.isArray(recipients) && recipients.length > 0) {
      rawPhoneList = recipients;
      recipientLabel = `${recipients.length} Custom Recipient(s)`;
    } else {
      // Default fallback: query all members from DB
      const dbRes = await query('SELECT phone FROM members;');
      rawPhoneList = dbRes.rows.map(m => m.phone).filter(Boolean);
      recipientLabel = 'All Members';
    }

    // 2. Sanitize and validate all phone numbers
    const { validNumbers, invalidNumbers } = processPhoneNumbers(rawPhoneList);

    if (validNumbers.length === 0) {
      return NextResponse.json({
        error: 'No valid phone numbers found for the selected recipient group.',
        details: `Found ${rawPhoneList.length} total entry/entries, but all were invalid or placeholder phone numbers.`
      }, { status: 400 });
    }

    // 3. Dispatch SMS via SailUp API directly
    const sailupApiKey = process.env.SAILUP_API_KEY || 'sailup_v8xXqOHrgAEhUTVBkFXJ_9iTgtDDcGMWQKFl4v74mUQ';
    const defaultSender = process.env.SAILUP_DEFAULT_SENDER || 'HTUWELFARE';
    const senderName = sender || defaultSender;

    let smsResponse;
    try {
      const sailupRes = await fetch('https://api.sailup.io/v1/sms/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sailupApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ from: senderName, to: validNumbers, body: messageText })
      });
      if (!sailupRes.ok) {
        const errData = await sailupRes.json().catch(() => ({}));
        const err = new Error(errData?.detail || errData?.message || `SailUp error ${sailupRes.status}`);
        err.status = sailupRes.status;
        err.data = errData;
        throw err;
      }
      smsResponse = await sailupRes.json();
    } catch (sailupErr) {
      console.error('SailUp Broadcast Dispatch Error:', sailupErr);

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const broadcastTitle = type || (messageText.length > 40 ? `${messageText.substring(0, 37)}...` : messageText);

      await query(
        `INSERT INTO sms_history (title, recipients, date_str, status) VALUES ($1, $2, $3, 'failed')`,
        [broadcastTitle, `${validNumbers.length} Recipient(s) (${recipientLabel})`, dateStr]
      );

      let userErrMsg = sailupErr.message || 'Failed to dispatch SMS via SailUp Gateway.';
      if (sailupErr.data?.error === 'sender_not_approved') {
        userErrMsg = `SailUp Status Notice: Your Sender ID '${senderName}' is currently PENDING approval by network providers on your SailUp account. Messages will begin delivering automatically as soon as SailUp approves '${senderName}'.`;
      }

      return NextResponse.json({
        error: userErrMsg,
        details: sailupErr.data || null
      }, { status: 400 });
    }

    // 4. Log broadcast into database `sms_history`
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const broadcastTitle = type || (messageText.length > 40 ? `${messageText.substring(0, 37)}...` : messageText);

    await query(
      `INSERT INTO sms_history (title, recipients, date_str, status) VALUES ($1, $2, $3, 'success')`,
      [broadcastTitle, `${validNumbers.length} Recipient(s) (${recipientLabel})`, dateStr]
    );

    // 5. Log into activities table
    await query(
      `INSERT INTO activities (title, amount, type, date_str) VALUES ($1, $2, 'register', 'Just now')`,
      [`SMS Broadcast sent — ${broadcastTitle}`, `${validNumbers.length} Sent`]
    );

    // 6. Log into audit_logs table
    const auditDetail = `Sent SMS broadcast "${broadcastTitle}" to ${validNumbers.length} valid recipient(s). ${invalidNumbers.length} invalid/placeholder number(s) skipped.`;
    await query(
      `INSERT INTO audit_logs (timestamp_str, username, action, details, ip_address) VALUES ($1, $2, 'SMS Broadcast', $3, '127.0.0.1')`,
      [now.toISOString(), session.name || 'Admin', auditDetail]
    );

    return NextResponse.json({
      success: true,
      message: `SMS broadcast dispatched to ${validNumbers.length} member(s).${invalidNumbers.length > 0 ? ` (${invalidNumbers.length} invalid phone number(s) skipped)` : ''}`,
      sentCount: validNumbers.length,
      skippedCount: invalidNumbers.length,
      smsData: smsResponse
    });

  } catch (error) {
    console.error('Error sending Welfare SMS broadcast:', error);
    return NextResponse.json({ error: error.message || 'Failed to send SMS broadcast.' }, { status: 500 });
  }
}
