import { NextRequest, NextResponse } from 'next/server';
import { fetchAndStoreJobs } from '@/lib/jobFetcher';
import { sendJobNotification } from '@/lib/email';

export const revalidate = 0;

export async function GET() {
  try {
    const newJobs = await fetchAndStoreJobs();
    const cronNotificationEmail = process.env.CRON_NOTIFICATION_EMAIL || '';
    if (newJobs.length && isValidEmail(cronNotificationEmail)) {
      await sendJobNotification(newJobs, cronNotificationEmail);
    }
    return NextResponse.json({ fetched: newJobs.length });
  } catch (err: any) {
    console.error('Job fetch error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const offset = Number(body.offset) || 0;
    const newJobs = await fetchAndStoreJobs(body.keyword, body.location, offset);
    let notificationWarning: string | undefined;

    const notificationEmail = typeof body.notificationEmail === 'string'
      ? body.notificationEmail.trim()
      : '';

    if (newJobs.length && isValidEmail(notificationEmail)) {
      try {
        await sendJobNotification(newJobs, notificationEmail);
      } catch (error: any) {
        console.error('Job notification error:', error);
        notificationWarning = error.message || 'Could not send job notification email.';
      }
    }

    return NextResponse.json({
      success: true,
      data: newJobs,
      fetched: newJobs.length,
      notificationSent: Boolean(newJobs.length && isValidEmail(notificationEmail) && !notificationWarning),
      notificationWarning,
    });
  } catch (err: any) {
    console.error('Job fetch error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

function isValidEmail(value: unknown) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
