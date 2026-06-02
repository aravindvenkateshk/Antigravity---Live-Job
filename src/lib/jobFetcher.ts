import { scrapeLinkedInJobs } from '@/services/scraper/linkedin';
import { scrapeNaukriJobs } from '@/services/scraper/naukri';

export interface Job {
  title: string;
  url: string;
  location?: string;
  company?: string;
}

/**
 * Fetch jobs from configured sources and return an array of Job objects.
 * In a full implementation this would also persist jobs to the Prisma DB.
 */
export async function fetchAndStoreJobs(): Promise<Job[]> {
  // Default search parameters – can be overridden via env vars or a future UI.
  const keyword = process.env.DEFAULT_JOB_KEYWORD || 'cybersecurity';
  const location = process.env.DEFAULT_JOB_LOCATION || 'India';

  const [linkedinJobs, naukriJobs] = await Promise.all([
    scrapeLinkedInJobs(keyword, location),
    scrapeNaukriJobs(keyword, location),
  ]);

  const allJobs: Job[] = [...linkedinJobs, ...naukriJobs];
  // TODO: Persist to Prisma DB (e.g., await prisma.job.createMany({ data: allJobs }));
  return allJobs;
}
