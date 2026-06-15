import * as cheerio from 'cheerio';

function normalizeText(value: string) {
  return value.replace(/â€“/g, '-').replace(/â/g, "'").replace(/\s+/g, ' ').trim();
}

export async function scrapeLinkedInJobs(keyword: string, location: string, offset: number = 0) {
  try {
    const url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&start=${offset}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch LinkedIn jobs: ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs: any[] = [];

    $('.job-search-card').each((_, element) => {
      const titleEl = $(element).find('.base-search-card__title');
      const companyEl = $(element).find('.base-search-card__subtitle');
      const locationEl = $(element).find('.job-search-card__location');
      const linkEl = $(element).find('.base-card__full-link');

      const title = normalizeText(titleEl.text());
      const company = normalizeText(companyEl.text());
      const jobLocation = normalizeText(locationEl.text());
      const url = linkEl.attr('href') || '';

      if (title && url) {
        jobs.push({
          title,
          company,
          location: jobLocation,
          url,
          platform: 'LinkedIn'
        });
      }
    });

    return jobs.slice(0, 15);
  } catch (err) {
    console.error('LinkedIn Scraper Error:', err);
    return [];
  }
}
