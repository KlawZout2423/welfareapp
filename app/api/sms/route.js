import { NextResponse } from 'next/server';
import { sailup } from '@/lib/sailup';

// POST /api/sms - Send SMS
export async function POST(request) {
  try {
    const body = await request.json();
    const { to, message, sender } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters: "to" (phone number or array) and "message"' },
        { status: 400 }
      );
    }

    const response = await sailup.sendSMS({
      to: Array.isArray(to) ? to : [to],
      body: message,
      from: sender
    });

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error sending SMS via Sailup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: error.status || 500 }
    );
  }
}

// GET /api/sms - List sent SMS messages
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const data = await sailup.listSMS({ limit, offset });
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Error fetching SMS history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch SMS history' },
      { status: error.status || 500 }
    );
  }
}
