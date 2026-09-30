import { CCTVCamera, GbfsStation, GtfsRtVehicle, FlightState, MaritimeVessel } from '../types';

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') {
    return Infinity;
  }
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return Infinity;
  }
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number): string {
  if (!isFinite(km) || isNaN(km)) return 'N/A';
  if (km < 0.001) return 'Here';
  if (km < 1) {
    const meters = Math.round(km * 1000);
    const feet = Math.round(meters * 3.28084);
    return `${meters} m (${feet} ft)`;
  }
  const miles = km * 0.621371;
  if (km < 10) {
    return `${km.toFixed(1)} km (${miles.toFixed(1)} mi)`;
  }
  return `${Math.round(km)} km (${Math.round(miles)} mi)`;
}

export interface NearestIntel {
  camera: { cam: CCTVCamera; distKm: number } | null;
  bikeStation: { station: GbfsStation; distKm: number } | null;
  transitVehicle: { vehicle: GtfsRtVehicle; distKm: number } | null;
  flight: { flight: FlightState; distKm: number } | null;
  vessel: { vessel: MaritimeVessel; distKm: number } | null;
}

export function findNearestIntel(
  userLat: number,
  userLon: number,
  cameras: CCTVCamera[],
  gbfsStations: GbfsStation[],
  gtfsRtVehicles: GtfsRtVehicle[],
  flights: FlightState[],
  vessels: MaritimeVessel[]
): NearestIntel {
  let nearestCam: { cam: CCTVCamera; distKm: number } | null = null;
  let minCamDist = Infinity;
  for (const cam of cameras) {
    const d = calculateDistanceKm(userLat, userLon, cam.lat, cam.lon);
    if (d < minCamDist) {
      minCamDist = d;
      nearestCam = { cam, distKm: d };
    }
  }

  let nearestBike: { station: GbfsStation; distKm: number } | null = null;
  let minBikeDist = Infinity;
  for (const s of gbfsStations) {
    const d = calculateDistanceKm(userLat, userLon, s.lat, s.lon);
    if (d < minBikeDist) {
      minBikeDist = d;
      nearestBike = { station: s, distKm: d };
    }
  }

  let nearestTransit: { vehicle: GtfsRtVehicle; distKm: number } | null = null;
  let minTransitDist = Infinity;
  for (const v of gtfsRtVehicles) {
    const d = calculateDistanceKm(userLat, userLon, v.lat, v.lon);
    if (d < minTransitDist) {
      minTransitDist = d;
      nearestTransit = { vehicle: v, distKm: d };
    }
  }

  let nearestFlightItem: { flight: FlightState; distKm: number } | null = null;
  let minFlightDist = Infinity;
  for (const f of flights) {
    const d = calculateDistanceKm(userLat, userLon, f.latitude, f.longitude);
    if (d < minFlightDist) {
      minFlightDist = d;
      nearestFlightItem = { flight: f, distKm: d };
    }
  }

  let nearestVesselItem: { vessel: MaritimeVessel; distKm: number } | null = null;
  let minVesselDist = Infinity;
  for (const v of vessels) {
    const d = calculateDistanceKm(userLat, userLon, v.lat, v.lon);
    if (d < minVesselDist) {
      minVesselDist = d;
      nearestVesselItem = { vessel: v, distKm: d };
    }
  }

  return {
    camera: nearestCam,
    bikeStation: nearestBike,
    transitVehicle: nearestTransit,
    flight: nearestFlightItem,
    vessel: nearestVesselItem,
  };
}
