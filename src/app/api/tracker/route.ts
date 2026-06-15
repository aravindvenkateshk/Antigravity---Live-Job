import { NextRequest, NextResponse } from "next/server";
import { verifyToken, addAppliedJob, getAppliedJobs } from "@/lib/auth";

function getEmailFromRequest(req: NextRequest): string | null {
  const token = req.cookies.get("session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** GET /api/tracker – returns all applied jobs for the logged-in user */
export async function GET(req: NextRequest) {
  const email = getEmailFromRequest(req);
  if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const jobs = await getAppliedJobs(email);
  return NextResponse.json({ success: true, jobs });
}

/** POST /api/tracker – add an applied job */
export async function POST(req: NextRequest) {
  const email = getEmailFromRequest(req);
  if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const job = await req.json();
  if (!job.url || !job.title) {
    return NextResponse.json({ error: "Missing job url or title" }, { status: 400 });
  }

  await addAppliedJob(email, {
    url: job.url,
    title: job.title,
    company: job.company || "Unknown",
    location: job.location || "Unknown",
    platform: job.platform || "Job Board",
    appliedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
