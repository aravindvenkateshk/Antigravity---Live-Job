import { NextResponse } from 'next/server';
import { fetchAndStoreJobs } from '@/lib/jobFetcher';
import { sendJobNotification } from '@/lib/email';

// Vercel cron schedule – every 15 minutes
export const runtime = 'edge';
export const revalidate = 0;
export const schedule = '*/15 * * * *';

export async function GET() {
  try {
    const newJobs = await fetchAndStoreJobs();
    if (newJobs.length) {
      await sendJobNotification(newJobs);
    }
    return NextResponse.json({ fetched: newJobs.length });
  } catch (err: any) {
    console.error('Job fetch error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
