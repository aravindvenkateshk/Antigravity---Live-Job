const cheerio = require('cheerio');

async function testDDG() {
  const keyword = 'cyber security';
  const location = 'india';
  const query = `site:naukri.com/job-listings OR site:bayt.com/en/jobs OR site:linkedin.com/jobs/view "${keyword}" "${location}"`;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    }
  });
  
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const jobs = [];
  $('.result').each((_, el) => {
    const title = $(el).find('.result__title a').text();
    const link = $(el).find('.result__title a').attr('href');
    if (title && link && !link.includes('duckduckgo')) {
      jobs.push({ title: title.trim(), link });
    }
  });
  
  console.log(jobs);
}

testDDG();
