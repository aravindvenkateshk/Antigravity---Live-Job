export async function scrapeAdzunaJobs(keyword: string, location: string, offset: number = 0) {
  try {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    if (!appId || !appKey) {
      console.warn('Adzuna credentials missing. Skipping Adzuna fetch.');
      return [];
    }

    // Determine country code from location (basic mapping)
    const locLower = location.toLowerCase();
    let country = 'in'; // default India
    if (locLower.includes('us') || locLower.includes('united states')) country = 'us';
    if (locLower.includes('uk') || locLower.includes('london')) country = 'gb';
    if (locLower.includes('uae') || locLower.includes('dubai') || locLower.includes('emirates')) country = 'ae';
    if (locLower.includes('canada')) country = 'ca';
    if (locLower.includes('singapore')) country = 'sg';
    if (locLower.includes('australia')) country = 'au';

    // Adzuna uses 1-based pagination. Offset is 0, 15, 30.
    const page = Math.floor(offset / 15) + 1;
    const resultsPerPage = 15;

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${appId}&app_key=${appKey}&results_per_page=${resultsPerPage}&what=${encodeURIComponent(keyword)}&where=${encodeURIComponent(location)}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch Adzuna jobs: ${res.status}`);
    }

    const data = await res.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((job: any) => ({
      title: job.title || '',
      company: job.company?.display_name || '',
      location: job.location?.display_name || location,
      url: job.redirect_url || '',
      platform: 'Adzuna' // Adzuna aggregates many boards
    }));

  } catch (err) {
    console.error('Adzuna API Error:', err);
    return [];
  }
}
