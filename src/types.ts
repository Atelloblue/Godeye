export type LayerType = 'satellite' | 'hybrid' | 'dark_tactical' | 'topographic';

export interface FlightState {
  icao24: string;
  callsign: string;
  originCountry: string;
  timePosition: number;
  lastContact: number;
  longitude: number;
  latitude: number;
  baroAltitude: number;
  onGround: boolean;
  velocity: number;
  trueTrack: number;
  verticalRate: number;
  squawk: string;
  aircraftModel?: string;
  route?: string;
  source?: string;
  seenPos?: number;
  isMilitary?: boolean;
  isHelicopter?: boolean;
}

export interface FlightAirport {
  name: string;
  iataCode?: string;
  icaoCode?: string;
  municipality?: string;
  countryName?: string;
  countryIso?: string;
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface FlightTrailPoint {
  lat: number;
  lon: number;
  alt?: number;
  speed?: number;
  track?: number;
  timestamp?: number;
}

export interface FlightRouteTrace {
  callsign: string;
  icao24: string;
  airline?: {
    name?: string;
    icao?: string;
    iata?: string;
    country?: string;
    callsign?: string;
  };
  origin?: FlightAirport | null;
  destination?: FlightAirport | null;
  trail: FlightTrailPoint[];
  distanceFlownKm?: number;
  distanceRemainingKm?: number;
  totalDistanceKm?: number;
  progressPercent?: number;
  plannedPath?: Array<[number, number]>;
  statusText?: string;
  aircraftDetails?: {
    manufacturer?: string;
    model?: string;
    type?: string;
    registration?: string;
    registeredOwner?: string;
    photoUrl?: string;
    photographer?: string;
  };
  source: string;
}

export interface MaritimeVessel {
  mmsi: number;
  name: string;
  type: string;
  status: string;
  lat: number;
  lon: number;
  sogKnots: number;
  cogDeg: number;
  destination: string;
  draughtM: number;
  length: number;
  width: number;
  currentLat?: number;
  currentLon?: number;
}

export interface CCTVCameraView {
  id: string;
  name: string;
  label?: string;
  snapshotUrl: string;
  videoUrl?: string;
  streamUrl?: string;
  heading?: number;
}

export interface CCTVCamera {
  id: string;
  name: string;
  city: string;
  agency: string;
  lat: number;
  lon: number;
  heading: number;
  highway: string;
  snapshotUrl: string;
  videoUrl?: string;
  streamUrl?: string;
  status: string;
  feedType: string;
  embedUrl?: string;
  sourceUrl?: string;
  isNew?: boolean;
  views?: CCTVCameraView[];
  activeViewIndex?: number;
}

export interface GbfsStation {
  id: string;
  systemId: string; // 'citibike_nyc' | 'baywheels_sf' | 'divvy_chi' | 'capital_dc' | 'tfl_london' | 'velib_paris' | 'bixi_mtl'
  systemName: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number;
  numBikesAvailable: number;
  numEbikesAvailable: number;
  numDocksAvailable: number;
  isRenting: boolean;
  isReturning: boolean;
  lastReported?: number;
}

export interface GtfsRtVehicle {
  id: string;
  agencyId: string; // 'mta_ny' | 'mbta_boston' | 'septa_philly' | 'rtd_denver' | 'fintraffic_rail'
  agencyName: string;
  vehicleType: 'BUS' | 'SUBWAY' | 'TRAIN' | 'TRAM';
  routeId: string;
  tripId?: string;
  label: string;
  lat: number;
  lon: number;
  bearing?: number;
  speed?: number; // km/h or mph
  currentStatus?: string | number; // 'IN_TRANSIT_TO' | 'STOPPED_AT' | 'INCOMING_AT'
  currentStopSequence?: number;
  stopId?: string;
  timestamp?: number;
  currentLat?: number;
  currentLon?: number;
}

export type TargetKind = 'FLIGHT' | 'VESSEL' | 'CCTV' | 'LOCATION' | 'EVENT' | 'GBFS' | 'GTFS_RT';

export interface SelectedTarget {
  kind: TargetKind;
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lon: number;
  data: FlightState | MaritimeVessel | CCTVCamera | GbfsStation | GtfsRtVehicle | GodsEyeEvent | { id: string; label: string; lat: number; lon: number; highlight?: MapHighlight; [key: string]: any };
}

export interface FeedStatusInfo {
  id: string;
  name: string;
  isLive: boolean;
  provider: string;
  description: string;
  statusText: string;
}

export interface ReconReport {
  targetId: string;
  targetType: string;
  name: string;
  coordinates: { lat: number; lon: number };
  surveillanceStatus: string;
  threatAssessment: string;
  opticalResolution: string;
  spectralBand: string;
  transponderIntegrity: string;
  estimatedInterceptionTime: string;
  analysisTimestamp: string;
  sigintNotes: string;
}

export interface LayerVisibility {
  satelliteLayer: LayerType;
  flights: boolean;
  maritime: boolean;
  cctv: boolean;
  events?: boolean;
  weather: boolean;
  wildfires: boolean;
  gbfs: boolean;
  gtfsRt: boolean;
  targetLabels: boolean;
  tomtomTraffic: boolean;
  is3DGlobe?: boolean;
}

export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EventType = 'AIRCRAFT_ANOMALY' | 'MARITIME_ANOMALY' | 'GEOPOLITICAL' | 'SECURITY' | 'INFRASTRUCTURE' | 'WEATHER' | 'WILDFIRE';

export interface GodsEyeEvent {
  id: string;
  type: EventType;
  severity: EventSeverity;
  title: string;
  description: string;
  lat: number;
  lon: number;
  timestamp: string;
  source: string;
  relatedTargetId?: string;
}

export interface AppSettings {
  flightRangeKm: number; // 0 for global, or 100, 250, 500, 1000

  // Maritime configuration
  aisStreamApiKey: string;

  // TomTom Street Traffic
  tomTomApiKey: string;
  tomTomFlowStyle: 'relative' | 'absolute' | 'relative-delay';
  showTrafficIncidents: boolean;

  // Telemetry refresh & visual settings
  pollIntervalSec: number; // 2, 3, 5, 10
  altitudeUnit: 'feet' | 'meters';
  speedUnit: 'knots' | 'kmh' | 'mph';
  maxPlanesOnMap: number; // e.g. 50, 150, 300, 600
}

export type HighlightCategory = 'CITY' | 'COUNTRY' | 'STATE' | 'CONTINENT' | 'OCEAN' | 'WATERWAY' | 'TACTICAL_ZONE' | 'LANDMARK' | 'BUILDING' | 'REGION';

export interface MapHighlight {
  id: string;
  name: string;
  category: HighlightCategory;
  lat: number;
  lon: number;
  zoom: number;
  radiusKm?: number;
  bounds?: [[number, number], [number, number]]; // [[south, west], [north, east]]
  polygon?: [number, number][] | [number, number][][]; // optional [lat, lon][] boundary
  geoJson?: any; // Real GeoJSON Feature or Geometry object (Polygon / MultiPolygon)
  description?: string;
  flagOrIcon?: string;
  country?: string;
  continent?: string;
  color?: string; // tactical accent color e.g. #06b6d4, #10b981, #f59e0b
  stats?: {
    population?: string;
    area?: string;
    info?: string;
    [key: string]: string | undefined;
  };
}

export interface AssistantCommandResult {
  action: 'TELEPORT' | 'HIGHLIGHT' | 'SELECT_TARGET' | 'TOGGLE_LAYER' | 'SEARCH' | 'INFO' | 'CLEAR_HIGHLIGHT' | 'ERROR';
  target?: {
    lat: number;
    lon: number;
    zoom?: number;
    name?: string;
    kind?: TargetKind;
    id?: string;
  };
  highlight?: MapHighlight;
  enableLayers?: Array<keyof LayerVisibility>;
  spokenResponse: string;
  displayText: string;
  confidence?: number;
}

