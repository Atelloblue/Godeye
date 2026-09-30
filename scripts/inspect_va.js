async function inspectVirginiaJS() {
  const chunks = ['main-BH7AV5BL.js', 'scripts-75TZXZQF.js', 'chunk-75YKYZK6.js', 'chunk-G4HLX2J4.js', 'chunk-5F2GBR6C.js', 'chunk-QQUY5QSH.js', 'chunk-3KXDON7U.js', 'chunk-BM5ZDBOA.js', 'chunk-HBN4NZ6X.js', 'chunk-OEFSQD3N.js', 'chunk-HMEA46ZA.js', 'chunk-RUUNRNT5.js'];
  for (const c of chunks) {
    try {
      const text = await (await fetch('https://www.511virginia.org/' + c, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
      const urls = text.match(/(?:https?:)?\/\/[a-zA-Z0-9\.\-_/]+\b/g) || [];
      const interesting = urls.filter(u => u.includes('api') || u.includes('camera') || u.includes('cctv') || u.includes('vdot') || u.includes('511'));
      if (interesting.length > 0) {
        console.log(`[${c}] URLs:`, [...new Set(interesting)].slice(0, 10));
      }
    } catch (e) {
      console.log(`[${c}] Err:`, e.message);
    }
  }
}
inspectVirginiaJS();
