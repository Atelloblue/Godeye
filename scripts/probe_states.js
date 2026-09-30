async function probeIterisAndOthers() {
  console.log('--- Checking Iteris Sites (SD, SC, MT) ---');
  // Iteris SafeTravel endpoints usually have /api/v2/get/cameras, /api/v1/cameras, /traffic/api/cameras, or GeoJSON layers
  const iterisTests = [
    'https://www.sd511.org/api/v2/get/cameras',
    'https://www.sd511.org/api/v1/cameras',
    'https://www.sd511.org/resources/cameras',
    'https://www.sd511.org/map/mapIcons/Cameras',
    'https://www.sd511.org/api/cameras',
    'https://www.511sc.org/api/v2/get/cameras',
    'https://www.511sc.org/api/v1/cameras',
    'https://www.511sc.org/resources/cameras',
    'https://www.511sc.org/map/mapIcons/Cameras',
    'https://www.511mt.net/api/v2/get/cameras',
    'https://www.511mt.net/map/mapIcons/Cameras',
    'https://www.511mt.net/resources/cameras',
  ];

  for (const u of iterisTests) {
    try {
      const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }, signal: AbortSignal.timeout(4000) });
      const t = await res.text();
      console.log(`[${res.status}] ${u} (len ${t.length}, starts: ${t.substring(0, 50).replace(/\n/g, ' ')})`);
    } catch (e) {
      console.log(`[ERR] ${u}: ${e.message}`);
    }
  }

  console.log('\n--- Checking Virginia 511 scripts & API ---');
  try {
    const vaHtml = await (await fetch('https://www.511virginia.org', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    const mainJsMatch = vaHtml.match(/[a-zA-Z0-9_\-]+\.js/g) || [];
    console.log('VA Scripts:', mainJsMatch);
    for (const js of mainJsMatch.slice(0, 5)) {
      if (js.startsWith('main') || js.startsWith('scripts')) {
        const jsText = await (await fetch('https://www.511virginia.org/' + js, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
        const apiMatches = jsText.match(/https?:\/\/[a-zA-Z0-9\.\-\_\/]+\b/g) || [];
        console.log(`VA ${js} API endpoints sample:`, apiMatches.filter(a => a.includes('virginia') || a.includes('vdot') || a.includes('api') || a.includes('camera')).slice(0, 8));
      }
    }
  } catch (e) {
    console.log('VA probe error:', e.message);
  }

  console.log('\n--- Checking Wyoming WYDOT Webcams ---');
  try {
    const wyHtml = await (await fetch('https://www.wyoroad.info/highway/webcams/Webcams.html', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    console.log('WY HTML len:', wyHtml.length);
    const wyImgMatches = wyHtml.match(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|gif)/gi) || [];
    console.log('WY webcam images sample:', wyImgMatches.slice(0, 10));
  } catch (e) {
    console.log('WY error:', e.message);
  }

  console.log('\n--- Checking North Dakota NDDOT chunks ---');
  try {
    const ndJs = await (await fetch('https://travel.dot.nd.gov/static/js/main.bb4da58d.chunk.js', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    console.log('ND JS len:', ndJs.length);
    const ndApis = ndJs.match(/\/api\/[a-zA-Z0-9_\-\/]+/g) || [];
    console.log('ND /api/ routes:', [...new Set(ndApis)]);
  } catch (e) {
    console.log('ND error:', e.message);
  }
}
probeIterisAndOthers();
