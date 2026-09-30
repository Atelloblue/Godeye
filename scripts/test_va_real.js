async function testVirginiaGeoJSON() {
  const url = 'https://www.511virginia.org/data/geojson/icons.cameras.geojson';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  console.log('Virginia GeoJSON status:', res.status);
  const json = await res.json();
  console.log('Feature count:', json.features?.length);
  if (json.features?.length) {
    console.log('Sample VA feature properties:', JSON.stringify(json.features[0].properties, null, 2));
    console.log('Sample geometry:', json.features[0].geometry);
    // Test sample image
    const imgUrl = json.features[0].properties.image_url || json.features[0].properties.url;
    console.log('Testing image URL:', imgUrl);
    const imgRes = await fetch(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log('Image status:', imgRes.status, 'type:', imgRes.headers.get('content-type'));
  }
}
testVirginiaGeoJSON();
