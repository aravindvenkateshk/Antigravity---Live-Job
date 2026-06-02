import { chromium } from 'playwright';

export async function scrapeLinkedInJobs(keyword: string, location: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    await page.waitForSelector('.job-search-card', { timeout: 10000 }).catch(() => null);

    const jobs = await page.$$eval('.job-search-card', cards => {
      return cards.slice(0, 15).map(card => {
        const titleEl = card.querySelector('.base-search-card__title');
        const companyEl = card.querySelector('.base-search-card__subtitle');
        const locationEl = card.querySelector('.job-search-card__location');
        const linkEl = card.querySelector('.base-card__full-link') as HTMLAnchorElement;

        return {
          title: titleEl?.textContent?.trim() || '',
          company: companyEl?.textContent?.trim() || '',
          location: locationEl?.textContent?.trim() || '',
          url: linkEl?.href || '',
          platform: 'LinkedIn'
        };
      });
    });

    await browser.close();
    return jobs.filter(j => j.title && j.url);
  } catch (err) {
    console.error('LinkedIn Scraper Error:', err);
    await browser.close();
    return [];
  }
}
