import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/sms — Send SMS directly via SailUp REST API
export async function POST(request) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { to, message, sender } = body;

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: "to" and "message".' },
        { status: 400 }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];
    const apiKey = process.env.SAILUP_API_KEY || 'sailup_v8xXqOHrgAEhUTVBkFXJ_9iTgtDDcGMWQKFl4v74mUQ';
    const from = sender || process.env.SAILUP_DEFAULT_SENDER || 'HTUWELFARE';

    const sailupRes = await fetch('https://api.sailup.io/v1/sms/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: recipients, body: message.trim() }),
    });

    const sailupData = await sailupRes.json().catch(() => ({}));

    if (!sailupRes.ok) {
      const errMsg = sailupData?.detail || sailupData?.message || `SailUp error ${sailupRes.status}`;
      console.error('[/api/sms] SailUp rejected:', sailupRes.status, errMsg);
      return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
    }

    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const title = message.trim().length > 60 ? message.trim().substring(0, 57) + '...' : message.trim();
    await query(
      `INSERT INTO sms_history (title, recipients, date_str, status) VALUES ($1, $2, $3, 'success')`,
      [title, `${recipients.length} Recipient(s)`, dateStr]
    ).catch(() => {});

    console.log(`[/api/sms] Dispatched to ${recipients.length} recipient(s). SailUp ID: ${sailupData?.messages?.[0]?.id}`);

    return NextResponse.json({
      success: true,
      sentCount: recipients.length,
      message: `SMS sent to ${recipients.length} recipient(s).`,
      data: sailupData,
    });

  } catch (error) {
    console.error('[/api/sms] Unexpected error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to send SMS.' }, { status: 500 });
  }
}

// GET /api/sms — List sent SMS messages from SailUp
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const apiKey = process.env.SAILUP_API_KEY || 'sailup_v8xXqOHrgAEhUTVBkFXJ_9iTgtDDcGMWQKFl4v74mUQ';
    const res = await fetch(`https://api.sailup.io/v1/sms/?limit=${limit}&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const data = await res.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('[/api/sms] GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch SMS history.' }, { status: 500 });
  }
}
