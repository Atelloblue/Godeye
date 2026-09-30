async function inspectWebsites() {
  const sites = [
    { name: 'SD511', url: 'https://www.sd511.org' },
    { name: 'NDDOT', url: 'https://travel.dot.nd.gov' },
    { name: 'MDT Montana', url: 'https://www.511mt.net' },
    { name: 'WYDOT Wyoming', url: 'https://www.wyoroad.info' },
    { name: 'Virginia 511', url: 'https://www.511virginia.org' },
    { name: 'South Carolina 511', url: 'https://www.511sc.org' },
    { name: 'Kentucky GoKY', url: 'https://goky.ky.gov' },
    { name: 'Indiana 511IN', url: 'https://511in.org' },
    { name: 'Ohio OHGO', url: 'https://www.ohgo.com' },
    { name: 'Missouri MoDOT', url: 'https://traveler.modot.org' },
  ];

  for (const s of sites) {
    try {
      const res = await fetch(s.url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) });
      const html = await res.text();
      console.log(`[${s.name}] Status: ${res.status}, Length: ${html.length}`);
      // Look for js files or api paths in html
      const scripts = html.match(/src="([^"]+\.js[^"]*)"/g) || [];
      console.log(`  Scripts: ${scripts.slice(0, 3).join(', ')}`);
    } catch (e) {
      console.log(`[${s.name}] Error: ${e.message}`);
    }
  }
}
inspectWebsites();
