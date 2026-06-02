import { NextRequest, NextResponse } from 'next/server';
import { fetchAndStoreJobs } from '@/lib/jobFetcher';
import { sendJobNotification } from '@/lib/email';

export const revalidate = 0;

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const newJobs = await fetchAndStoreJobs(body.keyword, body.location);
    return NextResponse.json({ success: true, data: newJobs, fetched: newJobs.length });
  } catch (err: any) {
    console.error('Job fetch error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
