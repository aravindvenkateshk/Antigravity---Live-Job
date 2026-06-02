import { chromium } from 'playwright';

export async function scrapeNaukriJobs(keyword: string, location: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const formattedKeyword = keyword.replace(/\s+/g, '-').toLowerCase();
    const formattedLocation = location.replace(/\s+/g, '-').toLowerCase();
    const url = `https://www.naukri.com/${formattedKeyword}-jobs-in-${formattedLocation}`;
    
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    await page.waitForSelector('.srp-jobtuple-wrapper', { timeout: 10000 }).catch(() => null);

    const jobs = await page.$$eval('.srp-jobtuple-wrapper', cards => {
      return cards.slice(0, 15).map(card => {
        const titleEl = card.querySelector('.title');
        const companyEl = card.querySelector('.comp-dtls-wrap a');
        const locationEl = card.querySelector('.locWdth');
        const linkEl = titleEl as HTMLAnchorElement;

        return {
          title: titleEl?.textContent?.trim() || '',
          company: companyEl?.textContent?.trim() || '',
          location: locationEl?.textContent?.trim() || '',
          url: linkEl?.href || '',
          platform: 'Naukri'
        };
      });
    });

    await browser.close();
    return jobs.filter(j => j.title && j.url);
  } catch (err) {
    console.error('Naukri Scraper Error:', err);
    await browser.close();
    return [];
  }
}
