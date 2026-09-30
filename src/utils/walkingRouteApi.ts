import { resolveHighlightWithShape } from './geoBoundaries';

export interface WalkingRoute {
  id: string;
  fromName: string;
  toName: string;
  fromCoords: { lat: number; lon: number };
  toCoords: { lat: number; lon: number };
  coordinates: [number, number][]; // [lat, lon][] array for Leaflet polyline
  distanceMeters: number;
  durationSeconds: number;
  steps?: { instruction: string; distance: number }[];
}

/**
 * Geocode a place name into lat/lon coordinates and cleaned display name
 */
export async function geocodePlace(placeName: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const query = placeName.trim();
  if (!query) return null;

  try {
    // 1. Try resolving using our existing shape solver (supports Nominatim + Overpass footprints + geo registry)
    const shape = await resolveHighlightWithShape(query);
    if (shape && !isNaN(shape.lat) && !isNaN(shape.lon) && (shape.lat !== 0 || shape.lon !== 0)) {
      return {
        lat: shape.lat,
        lon: shape.lon,
        name: shape.name || query,
      };
    }

    // 2. Fallback direct Nominatim query
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GodsEyeTactical/1.0',
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const top = data[0];
      const lat = parseFloat(top.lat);
      const lon = parseFloat(top.lon);
      const shortName = (top.display_name || query).split(',')[0];
      return { lat, lon, name: shortName };
    }
  } catch (err) {
    console.warn('Geocoding error for:', placeName, err);
  }

  return null;
}

/**
 * Fetch walking path between two place names using OpenStreetMap OSRM Foot API
 */
export async function fetchWalkingRoute(
  fromPlace: string,
  toPlace: string
): Promise<{ route: WalkingRoute | null; error?: string }> {
  try {
    const [fromGeo, toGeo] = await Promise.all([
      geocodePlace(fromPlace),
      geocodePlace(toPlace),
    ]);

    if (!fromGeo) {
      return { route: null, error: `Could not locate origin: "${fromPlace}"` };
    }
    if (!toGeo) {
      return { route: null, error: `Could not locate destination: "${toPlace}"` };
    }

    return await fetchWalkingRouteByCoords(
      fromGeo.lat,
      fromGeo.lon,
      toGeo.lat,
      toGeo.lon,
      fromGeo.name,
      toGeo.name
    );
  } catch (err: any) {
    return { route: null, error: err.message || 'Failed to calculate walking route' };
  }
}

/**
 * Fetch walking path given exact lat/lon coordinates for origin and destination
 */
export async function fetchWalkingRouteByCoords(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  fromName: string = 'Origin',
  toName: string = 'Destination'
): Promise<{ route: WalkingRoute | null; error?: string }> {
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson&steps=true`;
    const response = await fetch(osrmUrl);
    if (!response.ok) {
      throw new Error(`OSRM Routing service error (HTTP ${response.status})`);
    }

    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return { route: null, error: 'No pedestrian walking path found between locations.' };
    }

    const topRoute = data.routes[0];
    const geojsonCoords = topRoute.geometry?.coordinates || [];

    // OSRM GeoJSON geometry coordinates are [lon, lat], convert to Leaflet [lat, lon]
    const leafletCoords: [number, number][] = geojsonCoords.map(([lon, lat]: [number, number]) => [lat, lon]);

    // Ensure start and end points exist
    if (leafletCoords.length === 0) {
      leafletCoords.push([fromLat, fromLon], [toLat, toLon]);
    }

    const steps: { instruction: string; distance: number }[] = [];
    if (topRoute.legs && topRoute.legs[0] && topRoute.legs[0].steps) {
      topRoute.legs[0].steps.forEach((s: any) => {
        if (s.maneuver && s.name) {
          const type = s.maneuver.type || 'turn';
          const modifier = s.maneuver.modifier ? ` ${s.maneuver.modifier}` : '';
          const street = s.name || 'path';
          steps.push({
            instruction: `${type}${modifier} onto ${street}`,
            distance: Math.round(s.distance || 0),
          });
        }
      });
    }

    const walkingRoute: WalkingRoute = {
      id: `walk-${Date.now()}`,
      fromName,
      toName,
      fromCoords: { lat: fromLat, lon: fromLon },
      toCoords: { lat: toLat, lon: toLon },
      coordinates: leafletCoords,
      distanceMeters: topRoute.distance || 0,
      durationSeconds: topRoute.duration || 0,
      steps: steps.slice(0, 10),
    };

    return { route: walkingRoute };
  } catch (err: any) {
    console.warn('OSRM Walking route request error:', err);
    return { route: null, error: err.message || 'Routing network request failed' };
  }
}

/**
 * Format meters into human readable distance string (e.g. "2.4 km" or "1.5 mi")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = (meters / 1000).toFixed(1);
  const miles = (meters * 0.000621371).toFixed(1);
  return `${km} km (${miles} mi)`;
}

/**
 * Format duration in seconds into human readable walking time (e.g. "24 mins" or "1 hr 12 mins")
 */
export function formatWalkingTime(seconds: number): string {
  const totalMins = Math.round(seconds / 60);
  if (totalMins < 60) {
    return `${totalMins} min${totalMins === 1 ? '' : 's'} walk`;
  }
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min${mins === 1 ? '' : 's'} walk`;
}
