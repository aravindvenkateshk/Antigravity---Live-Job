export async function scrapeNaukriJobs(keyword: string, location: string) {
  try {
    const url = 'https://www.arbeitnow.com/api/job-board-api';
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch Arbeitnow jobs: ${res.status}`);
    }
    const json = await res.json();
    const jobs = json.data
      .filter((job: any) => {
        const query = keyword.toLowerCase();
        const titleMatch = job.title?.toLowerCase().includes(query);
        const descMatch = job.description?.toLowerCase().includes(query);
        const tagsMatch = job.tags?.some((t: string) => t.toLowerCase().includes(query));
        return titleMatch || descMatch || tagsMatch;
      })
      .map((job: any) => ({
        title: job.title || '',
        company: job.company_name || '',
        location: job.location || '',
        url: job.url || '',
        platform: 'Arbeitnow'
      }));

    return jobs.slice(0, 15);
  } catch (err) {
    console.error('Arbeitnow API Fetch Error:', err);
    return [];
  }
}

