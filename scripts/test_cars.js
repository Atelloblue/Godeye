async function testCARSProgramStates() {
  const states = [
    { code: 'ia', name: 'Iowa' },
    { code: 'mn', name: 'Minnesota' },
    { code: 'in', name: 'Indiana' },
    { code: 'ky', name: 'Kentucky' },
    { code: 'sc', name: 'South Carolina' },
    { code: 'sd', name: 'South Dakota' },
    { code: 'nd', name: 'North Dakota' },
    { code: 'mt', name: 'Montana' },
    { code: 'wy', name: 'Wyoming' },
    { code: 'va', name: 'Virginia' },
    { code: 'oh', name: 'Ohio' },
    { code: 'mo', name: 'Missouri' },
    { code: 'ne', name: 'Nebraska' },
  ];

  for (const s of states) {
    const urls = [
      `https://${s.code}cam.carsprogram.org/`,
      `https://511.${s.code}.gov/api/v2/get/cameras`,
      `https://511${s.code}.org/api/v2/get/cameras`,
      `https://www.511${s.code}.org/api/v2/get/cameras`,
      `https://www.511${s.code}.org/api/v1/cameras`,
      `https://511${s.code}.gov/List/GetData/Cameras`,
      `https://www.511${s.code}.org/List/GetData/Cameras`,
    ];

    for (const u of urls) {
      try {
        const res = await fetch(u, {
          method: u.includes('GetData') ? 'POST' : 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'application/json, text/javascript, */*',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: u.includes('GetData') ? JSON.stringify({ draw: 1, start: 0, length: 1, search: { value: '', regex: false }, order: [{ column: 0, dir: 'asc' }] }) : undefined,
          signal: AbortSignal.timeout(3000)
        });
        const text = await res.text();
        if (res.ok && !text.includes('<!DOCTYPE') && !text.includes('<html')) {
          console.log(`[SUCCESS] ${s.name} (${u}): Status ${res.status}, len ${text.length}, sample: ${text.substring(0, 100)}`);
        }
      } catch (e) {}
    }
  }
}
testCARSProgramStates();
