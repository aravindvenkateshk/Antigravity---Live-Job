require('dotenv').config({ path: '.env.local' });
const { scrapeAdzunaJobs } = require('./src/services/scraper/adzuna.js');

// mock fetch if it's node 18+ it has global fetch
async function test() {
  const jobs = await scrapeAdzunaJobs('cyber security', 'India');
  console.log(jobs);
}
test();
