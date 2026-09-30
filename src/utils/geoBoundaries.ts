import { MapHighlight } from '../types';
import { GEO_HIGHLIGHT_REGISTRY, findGeoHighlight } from '../data/geoRegistry';
import { GLOBAL_LOCATIONS } from '../data/globalLocations';

// Cached in-memory GeoJSON feature collection for all world countries
let worldCountriesGeoJson: any = null;
let isFetchingWorldGeoJson = false;
const countryFeatureMap = new Map<string, any>();

/**
 * Tactical color rotation palette for multiple concurrent highlights
 */
export const HIGHLIGHT_COLORS = [
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#e11d48', // Rose
  '#6366f1', // Indigo
];

/**
 * Built-in simplified accurate boundary coordinates for instant offline fallback
 */
const CONTINENT_POLYGONS: Record<string, [number, number][]> = {
  africa: [
    [37.34, 9.87], [36.85, 10.74], [35.91, 14.50], [32.88, 13.18], [32.06, 23.95],
    [31.25, 32.30], [27.84, 34.30], [22.00, 36.88], [11.87, 43.15], [11.80, 51.27],
    [5.00, 48.00], [-0.50, 42.50], [-4.00, 39.50], [-10.50, 40.50], [-15.00, 40.50],
    [-24.00, 35.50], [-28.50, 32.50], [-34.83, 20.00], [-34.35, 18.48], [-30.00, 17.00],
    [-22.00, 14.00], [-16.00, 12.00], [-6.00, 12.00], [4.00, 9.00], [4.50, 5.00],
    [4.50, -7.50], [7.00, -11.50], [12.00, -16.50], [14.70, -17.50], [21.00, -17.00],
    [28.00, -12.50], [35.90, -5.60], [37.34, 9.87]
  ],
  south_america: [
    [12.45, -71.66], [10.50, -61.50], [5.00, -52.50], [-1.00, -48.00], [-5.00, -35.00],
    [-10.00, -36.00], [-22.00, -41.00], [-24.00, -46.00], [-34.00, -53.50], [-42.00, -63.00],
    [-52.00, -68.00], [-55.00, -66.50], [-54.00, -71.00], [-46.00, -75.50], [-38.00, -73.50],
    [-23.50, -70.50], [-15.00, -75.50], [-5.00, -81.00], [0.00, -80.00], [8.00, -77.50],
    [12.45, -71.66]
  ],
  australia: [
    [-10.68, 142.53], [-14.50, 144.50], [-20.00, 148.50], [-25.00, 153.00], [-28.50, 153.50],
    [-34.00, 151.20], [-37.50, 149.90], [-38.80, 146.50], [-38.00, 140.50], [-35.00, 136.00],
    [-32.00, 132.50], [-34.00, 123.00], [-35.00, 117.80], [-32.00, 115.50], [-26.00, 113.00],
    [-21.80, 114.10], [-19.50, 121.00], [-15.00, 124.50], [-14.00, 128.00], [-12.00, 131.00],
    [-12.00, 136.50], [-16.00, 139.00], [-10.68, 142.53]
  ]
};

/**
 * Pre-fetches the standard global country GeoJSON datasets in background
 */
export async function initWorldGeoJson(): Promise<void> {
  if (worldCountriesGeoJson || isFetchingWorldGeoJson) return;
  isFetchingWorldGeoJson = true;

  try {
    const urls = [
      'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
      'https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json',
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data && data.features && Array.isArray(data.features)) {
            worldCountriesGeoJson = data;
            data.features.forEach((feature: any) => {
              const props = feature.properties || {};
              const name = (props.ADMIN || props.name || props.NAME || '').toLowerCase();
              const iso2 = (props.ISO_A2 || props.iso_a2 || '').toLowerCase();
              const iso3 = (props.ISO_A3 || props.iso_a3 || '').toLowerCase();

              if (name) countryFeatureMap.set(name, feature);
              if (iso2 && iso2 !== '-99') countryFeatureMap.set(iso2, feature);
              if (iso3 && iso3 !== '-99') countryFeatureMap.set(iso3, feature);
            });
            break;
          }
        }
      } catch {
        // try next source
      }
    }
  } catch (err) {
    console.warn('Background GeoJSON loading:', err);
  } finally {
    isFetchingWorldGeoJson = false;
  }
}

// Auto-trigger background loading on startup
initWorldGeoJson();

/**
 * Queries Overpass API for exact building footprint geometry near lat/lon
 */
export async function fetchBuildingFootprint(
  lat: number,
  lon: number,
  buildingName?: string
): Promise<{ geoJson: any; lat: number; lon: number; name: string; height?: string; address?: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const overpassQuery = `[out:json][timeout:3];(way(around:50,${lat},${lon})[building];relation(around:50,${lat},${lon})[building];);out body geom;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.elements || data.elements.length === 0) return null;

    const element = data.elements.find((el: any) => el.type === 'way' && el.geometry && el.geometry.length >= 3) || data.elements[0];

    if (element && element.geometry && element.geometry.length >= 3) {
      const coords = element.geometry.map((pt: any) => [pt.lon, pt.lat]);
      if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
        coords.push([coords[0][0], coords[0][1]]);
      }

      const tags = element.tags || {};
      const name = tags.name || tags['building:name'] || buildingName || 'Structure Footprint';
      const height = tags.height || (tags['building:levels'] ? `${parseInt(tags['building:levels']) * 3.5}m (${tags['building:levels']} levels)` : undefined);
      const street = tags['addr:street'] ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`.trim() : undefined;

      let avgLat = 0;
      let avgLon = 0;
      element.geometry.forEach((pt: any) => {
        avgLat += pt.lat;
        avgLon += pt.lon;
      });
      avgLat /= element.geometry.length;
      avgLon /= element.geometry.length;

      return {
        geoJson: {
          type: 'Feature',
          properties: {
            name,
            building: tags.building || 'yes',
            height,
            address: street,
            levels: tags['building:levels'],
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coords],
          },
        },
        lat: avgLat || lat,
        lon: avgLon || lon,
        name,
        height,
        address: street,
      };
    }
  } catch {
    // Fail silently
  }
  return null;
}

/**
 * Queries OSM / Nominatim for live GeoJSON boundary for countries, states, cities, or buildings
 */
export async function fetchLiveGeoJsonBoundary(query: string): Promise<{ 
  geoJson: any; 
  bounds?: [[number, number], [number, number]]; 
  lat: number; 
  lon: number; 
  name?: string;
  category?: 'COUNTRY' | 'STATE' | 'CITY' | 'BUILDING' | 'REGION';
  height?: string;
  address?: string;
} | null> {
  try {
    const cleanQuery = query.trim();
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&polygon_geojson=1&format=json&limit=5`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!res.ok) return null;
    const items = await res.json();
    if (!items || items.length === 0) return null;

    // 1. First look for direct Polygon or MultiPolygon
    const polyItem = items.find((it: any) => it.geojson && (it.geojson.type === 'Polygon' || it.geojson.type === 'MultiPolygon'));

    if (polyItem) {
      const lat = parseFloat(polyItem.lat);
      const lon = parseFloat(polyItem.lon);
      let bounds: [[number, number], [number, number]] | undefined = undefined;

      if (polyItem.boundingbox && polyItem.boundingbox.length === 4) {
        bounds = [
          [parseFloat(polyItem.boundingbox[0]), parseFloat(polyItem.boundingbox[2])],
          [parseFloat(polyItem.boundingbox[1]), parseFloat(polyItem.boundingbox[3])]
        ];
      }

      let category: 'COUNTRY' | 'STATE' | 'CITY' | 'BUILDING' | 'REGION' = 'CITY';
      if (polyItem.type === 'country' || polyItem.class === 'boundary' && polyItem.type === 'administrative') {
        category = 'COUNTRY';
      } else if (polyItem.type === 'state') {
        category = 'STATE';
      } else if (polyItem.type === 'building' || polyItem.class === 'building' || polyItem.type === 'attraction' || polyItem.type === 'monument') {
        category = 'BUILDING';
      }

      const shortName = polyItem.display_name.split(',')[0];

      return {
        geoJson: {
          type: 'Feature',
          properties: { name: polyItem.display_name, type: polyItem.type },
          geometry: polyItem.geojson
        },
        bounds,
        lat,
        lon,
        name: shortName,
        category,
      };
    }

    // 2. If no Polygon directly returned, query Overpass building footprint around top match
    const top = items[0];
    const topLat = parseFloat(top.lat);
    const topLon = parseFloat(top.lon);

    if (!isNaN(topLat) && !isNaN(topLon)) {
      const shortName = top.display_name.split(',')[0];
      const bldg = await fetchBuildingFootprint(topLat, topLon, shortName);

      if (bldg) {
        return {
          geoJson: bldg.geoJson,
          lat: bldg.lat,
          lon: bldg.lon,
          name: bldg.name,
          category: 'BUILDING',
          height: bldg.height,
          address: bldg.address,
        };
      }

      // 3. Rectangular building/property bounding box footprint fallback
      if (top.boundingbox && top.boundingbox.length === 4) {
        const s = parseFloat(top.boundingbox[0]);
        const n = parseFloat(top.boundingbox[1]);
        const w = parseFloat(top.boundingbox[2]);
        const e = parseFloat(top.boundingbox[3]);

        if (!isNaN(s) && !isNaN(n) && !isNaN(w) && !isNaN(e)) {
          return {
            geoJson: {
              type: 'Feature',
              properties: { name: shortName },
              geometry: {
                type: 'Polygon',
                coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]]
              }
            },
            bounds: [[s, w], [n, e]],
            lat: topLat,
            lon: topLon,
            name: shortName,
            category: (top.class === 'building' || top.type === 'building' || top.type === 'attraction') ? 'BUILDING' : 'CITY',
          };
        }
      }
    }
  } catch {
    // Fail silently
  }
  return null;
}

/**
 * Resolves a MapHighlight object with full GeoJSON / polygon boundary shape
 */
export async function resolveHighlightWithShape(
  targetQuery: string,
  existingHighlight?: MapHighlight | null
): Promise<MapHighlight | null> {
  const norm = targetQuery.toLowerCase().trim();

  // 1. Check if we already have a registry highlight
  const base = existingHighlight || findGeoHighlight(norm) || findGeoHighlight(targetQuery);

  let result: MapHighlight;

  if (base) {
    result = { ...base };
  } else {
    result = {
      id: `custom-geo-${norm.replace(/[^a-z0-9]/g, '-')}`,
      name: targetQuery.charAt(0).toUpperCase() + targetQuery.slice(1),
      category: 'CITY',
      lat: 0,
      lon: 0,
      zoom: 12,
    };
  }

  // 2. Check in-memory World GeoJSON dataset for countries
  if (!result.geoJson) {
    const cachedFeature = countryFeatureMap.get(norm) || 
      countryFeatureMap.get(norm.replace(/^(the\s+|united\s+)/, '')) ||
      (result.name ? countryFeatureMap.get(result.name.toLowerCase()) : null);

    if (cachedFeature) {
      result.geoJson = cachedFeature;
      result.category = 'COUNTRY';
    }
  }

  // 3. Fallback to continent polygon if available
  if (!result.geoJson && !result.polygon) {
    if (norm.includes('africa') && CONTINENT_POLYGONS.africa) {
      result.polygon = CONTINENT_POLYGONS.africa;
      result.category = 'CONTINENT';
    } else if (norm.includes('south america') && CONTINENT_POLYGONS.south_america) {
      result.polygon = CONTINENT_POLYGONS.south_america;
      result.category = 'CONTINENT';
    } else if ((norm.includes('australia') || norm.includes('oceania')) && CONTINENT_POLYGONS.australia) {
      result.polygon = CONTINENT_POLYGONS.australia;
      result.category = 'CONTINENT';
    }
  }

  // 4. Always query live GeoJSON / Overpass building footprint for accurate boundaries
  if (!result.geoJson && (!result.polygon || result.polygon.length < 5)) {
    const live = await fetchLiveGeoJsonBoundary(result.name || targetQuery);
    if (live) {
      result.geoJson = live.geoJson;
      if (live.bounds) result.bounds = live.bounds;
      if (live.category) result.category = live.category as any;
      if (live.name && !result.name) result.name = live.name;
      if (result.lat === 0 && result.lon === 0) {
        result.lat = live.lat;
        result.lon = live.lon;
      }
      if (live.category === 'BUILDING') {
        result.zoom = 17;
        result.color = '#f43f5e'; // Rose/Neon accent for buildings
        if (live.height) {
          result.stats = {
            height: live.height,
            info: live.address ? `Address: ${live.address}` : 'Building Structure Footprint'
          };
        }
      }
    }
  }

  return result;
}

/**
 * Resolves coordinates and zoom for ANY city, state, country, landmark or place
 * Checks local high-speed static registries first, then falls back to live OSM geocoding
 */
export async function resolveLocationCoordinates(query: string): Promise<{ lat: number; lon: number; zoom: number; name: string } | null> {
  const norm = query.toLowerCase().trim();
  if (!norm) return null;

  // 1. Check Global static registry
  if (GLOBAL_LOCATIONS[norm]) {
    return GLOBAL_LOCATIONS[norm];
  }

  // 2. Substring match in global locations
  const sortedKeys = Object.keys(GLOBAL_LOCATIONS).sort((a, b) => b.length - a.length);
  for (const k of sortedKeys) {
    if (norm === k || norm.startsWith(`${k} `) || norm.endsWith(` ${k}`) || norm.includes(` ${k} `)) {
      return GLOBAL_LOCATIONS[k];
    }
  }

  // 3. Check Geo highlight registry
  const geo = findGeoHighlight(norm) || findGeoHighlight(norm.replace(/\s+(city|country|state|continent|region)$/i, ''));
  if (geo) {
    return {
      lat: geo.lat,
      lon: geo.lon,
      zoom: geo.zoom,
      name: geo.name
    };
  }

  // 4. Dynamic OpenStreetMap Nominatim Live Geocoder for any world location
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        let zoom = 12;

        if (item.type === 'country' || item.class === 'boundary') {
          zoom = 5;
        } else if (item.type === 'state' || item.type === 'administrative') {
          zoom = 7;
        } else if (item.type === 'city' || item.type === 'town') {
          zoom = 12;
        } else if (item.type === 'attraction' || item.type === 'building' || item.type === 'monument' || item.type === 'tourism') {
          zoom = 15;
        }

        const nameParts = (item.display_name || query).split(',').map((s: string) => s.trim());
        const shortName = nameParts.length > 2 
          ? `${nameParts[0]}, ${nameParts[nameParts.length - 1]}` 
          : item.display_name;

        return {
          lat,
          lon,
          zoom,
          name: shortName || (query.charAt(0).toUpperCase() + query.slice(1))
        };
      }
    }
  } catch {
    // ignore
  }

  return null;
}

