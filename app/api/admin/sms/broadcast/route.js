import { NextResponse } from 'next/server';
import { sailup } from '@/lib/sailup';
import { getSession } from '@/lib/session';

export async function POST(req) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== 'admin' && session.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }


    const { recipients, customMessage, sender } = await req.json();

    if (!customMessage || !customMessage.trim()) {
      return NextResponse.json({ error: 'Message body cannot be empty.' }, { status: 400 });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipient phone numbers provided.' }, { status: 400 });
    }

    // Dispatch SMS via Sailup SDK
    const smsResponse = await sailup.sendSMS({
      to: recipients,
      body: customMessage.trim(),
      from: sender || process.env.SAILUP_DEFAULT_SENDER || 'HTUWelfare'
    });

    return NextResponse.json({
      success: true,
      message: `SMS broadcast sent successfully to ${recipients.length} recipient(s).`,
      recipientCount: recipients.length,
      smsData: smsResponse
    });
  } catch (error) {
    console.error('Error sending Welfare SMS broadcast:', error);
    return NextResponse.json({ error: error.message || 'Failed to send SMS broadcast.' }, { status: 500 });
  }
}
