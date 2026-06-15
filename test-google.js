const cheerio = require('cheerio');

async function testScrape() {
  const keyword = 'product manager';
  const location = 'dubai';
  const query = `site:bayt.com/en/jobs OR site:naukrigulf.com/jobs OR site:naukri.com/job-listings "${keyword}" "${location}"`;
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });
  
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const jobs = [];
  $('div.g').each((_, el) => {
    const title = $(el).find('h3').text();
    const link = $(el).find('a').attr('href');
    const snippet = $(el).find('.VwiC3b').text();
    if (title && link) {
      jobs.push({ title, link, snippet });
    }
  });
  
  console.log(jobs);
}

testScrape();
