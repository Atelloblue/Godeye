async function checkConfigs() {
  const domains = [
    'https://www.511virginia.org',
    'https://www.sd511.org',
    'https://www.511sc.org',
    'https://www.511mt.net',
    'https://511in.org',
    'https://travel.dot.nd.gov',
    'https://goky.ky.gov',
    'https://www.ohgo.com'
  ];

  for (const d of domains) {
    for (const path of ['/config/config.prod.json', '/config/config.json', '/assets/config.json', '/assets/config/config.json']) {
      try {
        const res = await fetch(d + path, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const json = await res.json();
          console.log(`[FOUND CONFIG] ${d}${path}:`, JSON.stringify(json).substring(0, 300));
        }
      } catch (e) {}
    }
  }
}
checkConfigs();
