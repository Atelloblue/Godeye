async function printMain() {
  const text = await (await fetch('https://www.511virginia.org/main-BH7AV5BL.js', { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  console.log('main text length:', text.length);
  // Find where cameras are defined
  let idx = text.indexOf('camera');
  while (idx !== -1) {
    console.log('--- CAMERA CONTEXT ---');
    console.log(text.substring(Math.max(0, idx - 100), Math.min(text.length, idx + 200)));
    idx = text.indexOf('camera', idx + 300);
    if (idx > 20000) break;
  }
}
printMain();
