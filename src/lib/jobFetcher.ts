import { scrapeLinkedInJobs } from '@/services/scraper/linkedin';
import { scrapeAdzunaJobs } from '@/services/scraper/adzuna';

export interface Job {
  title: string;
  url: string;
  location?: string;
  company?: string;
  platform?: string;
}

/**
 * Fetch jobs from configured sources and return an array of Job objects.
 * In a full implementation this would also persist jobs to the Prisma DB.
 */
export async function fetchAndStoreJobs(keyword?: string, location?: string, offset: number = 0): Promise<Job[]> {
  // Default search parameters – can be overridden via env vars or a future UI.
  const searchKeyword = keyword || process.env.DEFAULT_JOB_KEYWORD || 'cybersecurity';
  const searchLocation = location || process.env.DEFAULT_JOB_LOCATION || 'India';

  const [linkedinJobs, adzunaJobs] = await Promise.all([
    scrapeLinkedInJobs(searchKeyword, searchLocation, offset),
    scrapeAdzunaJobs(searchKeyword, searchLocation, offset),
  ]);

  const allJobs: Job[] = [...linkedinJobs, ...adzunaJobs];
  // TODO: Persist to Prisma DB (e.g., await prisma.job.createMany({ data: allJobs }));
  return allJobs;
}
