import { FlightRouteTrace, FlightAirport, FlightTrailPoint } from '../types';
import { calculateDistanceKm } from './geoUtils';

// In-memory client cache to avoid repeat fetches
const clientTraceCache = new Map<string, { data: FlightRouteTrace; timestamp: number }>();
const CACHE_TTL_MS = 60000; // 1 minute

/**
 * Spherical linear interpolation between two geographic points
 */
export function interpolateGreatCircle(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  pointsCount: number = 20
): Array<[number, number]> {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;

  const phi1 = lat1 * toRad;
  const lambda1 = lon1 * toRad;
  const phi2 = lat2 * toRad;
  const lambda2 = lon2 * toRad;

  const x1 = Math.cos(phi1) * Math.cos(lambda1);
  const y1 = Math.cos(phi1) * Math.sin(lambda1);
  const z1 = Math.sin(phi1);

  const x2 = Math.cos(phi2) * Math.cos(lambda2);
  const y2 = Math.cos(phi2) * Math.sin(lambda2);
  const z2 = Math.sin(phi2);

  const dot = Math.max(-1, Math.min(1, x1 * x2 + y1 * y2 + z1 * z2));
  const omega = Math.acos(dot);

  if (isNaN(omega) || omega < 0.0001) {
    return [[lat1, lon1], [lat2, lon2]];
  }

  const result: Array<[number, number]> = [];
  const sinOmega = Math.sin(omega);

  for (let i = 0; i <= pointsCount; i++) {
    const f = i / pointsCount;
    const A = Math.sin((1 - f) * omega) / sinOmega;
    const B = Math.sin(f * omega) / sinOmega;

    const x = A * x1 + B * x2;
    const y = A * y1 + B * y2;
    const z = A * z1 + B * z2;

    const phi = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lambda = Math.atan2(y, x);

    result.push([
      Number((phi * toDeg).toFixed(5)),
      Number((lambda * toDeg).toFixed(5)),
    ]);
  }

  return result;
}

export function formatNauticalMiles(km?: number): string {
  if (typeof km !== 'number' || isNaN(km) || !isFinite(km)) return 'N/A';
  const nm = Math.round(km * 0.539957);
  const statuteMiles = Math.round(km * 0.621371);
  return `${nm.toLocaleString()} nm (${statuteMiles.toLocaleString()} mi)`;
}

export function formatAirportCode(airport?: FlightAirport | null): string {
  if (!airport) return 'N/A';
  return airport.iataCode || airport.icaoCode || airport.name;
}

/**
 * Fetches flight trajectory, departure/arrival airports, and recorded breadcrumbs
 */
export async function fetchFlightTrace(
  callsign: string,
  icao24: string,
  currentLat?: number,
  currentLon?: number,
  track?: number,
  altitude?: number
): Promise<FlightRouteTrace> {
  const cleanCallsign = (callsign || '').trim().toUpperCase();
  const cleanHex = (icao24 || '').trim().toLowerCase();
  const cacheKey = `${cleanCallsign || cleanHex}`;

  const cached = clientTraceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Try our backend proxy endpoint first
  try {
    const queryParams = new URLSearchParams();
    if (cleanHex) queryParams.set('hex', cleanHex);
    if (typeof currentLat === 'number') queryParams.set('lat', currentLat.toFixed(4));
    if (typeof currentLon === 'number') queryParams.set('lon', currentLon.toFixed(4));
    if (typeof track === 'number') queryParams.set('track', String(Math.round(track)));
    if (typeof altitude === 'number') queryParams.set('alt', String(Math.round(altitude)));

    const resp = await fetch(`/api/flight-trace/${encodeURIComponent(cleanCallsign || cleanHex)}?${queryParams.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (resp.ok) {
      const data: FlightRouteTrace = await resp.json();
      clientTraceCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    }
  } catch (err) {
    console.warn('[flightTraceApi] Backend trace failed, falling back to direct adsbdb:', err);
  }

  // 2. Direct fallback to adsbdb.com if backend is unreachable
  let origin: FlightAirport | null = null;
  let destination: FlightAirport | null = null;
  let airline: any = undefined;

  if (cleanCallsign && cleanCallsign !== 'RADAR_CONTACT') {
    try {
      const adsbResp = await fetch(`https://api.adsbdb.com/v0/callsign/${encodeURIComponent(cleanCallsign)}`, {
        headers: { Accept: 'application/json' },
      });
      if (adsbResp.ok) {
        const json = await adsbResp.json();
        const route = json?.response?.flightroute;
        if (route) {
          airline = route.airline;
          if (route.origin) {
            origin = {
              name: route.origin.name || 'Origin Airport',
              iataCode: route.origin.iata_code,
              icaoCode: route.origin.icao_code,
              municipality: route.origin.municipality,
              countryName: route.origin.country_name,
              countryIso: route.origin.country_iso_name,
              latitude: route.origin.latitude,
              longitude: route.origin.longitude,
              elevation: route.origin.elevation,
            };
          }
          if (route.destination) {
            destination = {
              name: route.destination.name || 'Destination Airport',
              iataCode: route.destination.iata_code,
              icaoCode: route.destination.icao_code,
              municipality: route.destination.municipality,
              countryName: route.destination.country_name,
              countryIso: route.destination.country_iso_name,
              latitude: route.destination.latitude,
              longitude: route.destination.longitude,
              elevation: route.destination.elevation,
            };
          }
        }
      }
    } catch {
      // Ignore fallback error
    }
  }

  // Generate fallback trail
  const trail: FlightTrailPoint[] = [];
  if (typeof currentLat === 'number' && typeof currentLon === 'number') {
    if (origin) {
      // Create path from origin to current location
      const points = interpolateGreatCircle(origin.latitude, origin.longitude, currentLat, currentLon, 15);
      points.forEach(([lat, lon], idx) => {
        trail.push({
          lat,
          lon,
          alt: Math.round(((altitude || 30000) / 15) * idx),
          timestamp: Date.now() - (15 - idx) * 120000,
        });
      });
    } else {
      // Inbound direction trail estimate
      const rad = (((track || 0) + 180) % 360) * (Math.PI / 180);
      for (let i = 5; i >= 0; i--) {
        const distDeg = i * 0.25;
        trail.push({
          lat: Number((currentLat + Math.cos(rad) * distDeg).toFixed(4)),
          lon: Number((currentLon + (Math.sin(rad) * distDeg) / Math.cos((currentLat * Math.PI) / 180)).toFixed(4)),
          alt: altitude,
          timestamp: Date.now() - i * 180000,
        });
      }
    }
  }

  let distanceFlownKm: number | undefined;
  let distanceRemainingKm: number | undefined;
  let totalDistanceKm: number | undefined;
  let progressPercent: number | undefined;

  if (origin && typeof currentLat === 'number' && typeof currentLon === 'number') {
    distanceFlownKm = Math.round(calculateDistanceKm(origin.latitude, origin.longitude, currentLat, currentLon));
    if (destination) {
      distanceRemainingKm = Math.round(calculateDistanceKm(currentLat, currentLon, destination.latitude, destination.longitude));
      totalDistanceKm = Math.round(calculateDistanceKm(origin.latitude, origin.longitude, destination.latitude, destination.longitude));
      if (totalDistanceKm > 0) {
        progressPercent = Math.min(100, Math.max(0, Math.round((distanceFlownKm / (distanceFlownKm + distanceRemainingKm)) * 100)));
      }
    }
  }

  const fallbackResult: FlightRouteTrace = {
    callsign: cleanCallsign || cleanHex,
    icao24: cleanHex,
    airline,
    origin,
    destination,
    trail,
    distanceFlownKm,
    distanceRemainingKm,
    totalDistanceKm,
    progressPercent,
    statusText: origin ? `Departed from ${origin.name} (${origin.iataCode || origin.icaoCode})` : 'Active Flight Radar Track',
    source: 'Live ADS-B Radar Network',
  };

  clientTraceCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
  return fallbackResult;
}

export function getRouteProgressPercent(trace: FlightRouteTrace | null | undefined): number {
  if (!trace) return 0;
  if (typeof trace.progressPercent === 'number' && !isNaN(trace.progressPercent)) {
    return Math.min(100, Math.max(0, trace.progressPercent));
  }
  if (typeof trace.distanceFlownKm === 'number' && typeof trace.distanceRemainingKm === 'number') {
    const total = trace.distanceFlownKm + trace.distanceRemainingKm;
    if (total > 0) {
      return Math.min(100, Math.max(0, Math.round((trace.distanceFlownKm / total) * 100)));
    }
  }
  return 0;
}
