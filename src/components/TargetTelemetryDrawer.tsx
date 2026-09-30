import React, { useState, useEffect } from 'react';
import { 
  X, 
  Video, 
  Plane, 
  Ship, 
  MapPin,
  RefreshCw, 
  AlertCircle,
  Zap,
  Bike,
  Bus,
  GripHorizontal,
  Pin,
  ExternalLink,
  Route,
  PlaneTakeoff,
  PlaneLanding,
  ShieldAlert
} from 'lucide-react';
import { useDraggable } from '../hooks/useDraggable';
import { CCTVImage } from './CCTVImage';
import { 
  isHelicopterFlight, 
  isMilitaryFlight, 
  HelicopterIcon,
  getAircraftCountry,
  getAircraftModelDisplay
} from '../utils/flightClassification';
import { 
  fetchFlightTrace, 
  formatAirportCode, 
  formatNauticalMiles, 
  getRouteProgressPercent 
} from '../utils/flightTraceApi';
import tzLookup from 'tz-lookup';
import { 
  SelectedTarget, 
  FlightState, 
  MaritimeVessel, 
  CCTVCamera, 
  AppSettings,
  GbfsStation,
  GtfsRtVehicle,
  FlightRouteTrace
} from '../types';

interface TargetTelemetryDrawerProps {
  target: SelectedTarget | null;
  onClose: () => void;
  allCameras: CCTVCamera[];
  onSelectCamera: (camera: CCTVCamera) => void;
  settings?: AppSettings;
  pinnedCamIds?: string[];
  onTogglePin?: (camId: string) => void;
  onFitRoute?: () => void;
}

// Convert cardinal degrees to directional string with heading angle
function getCardinalDirection(deg: number): string {
  if (typeof deg !== 'number' || isNaN(deg)) return '0° (N)';
  const normalized = ((deg % 360) + 360) % 360;
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(normalized / 22.5) % 16;
  return `${Math.round(normalized)}° (${directions[index]})`;
}

// Safely format GTFS-RT stop status (which can be a string, protobuf enum number, or undefined)
function formatVehicleStatus(status: unknown): string {
  if (status === null || status === undefined || status === '') return 'In transit';
  if (status === 0 || status === '0' || status === 'INCOMING_AT') return 'Incoming at station';
  if (status === 1 || status === '1' || status === 'STOPPED_AT') return 'Stopped at station';
  if (status === 2 || status === '2' || status === 'IN_TRANSIT_TO') return 'In transit';
  return String(status).replace(/_/g, ' ');
}

// Convert decimal coordinate to Degrees, Minutes, Seconds (DMS)
function toDMS(coordinate: number, isLatitude: boolean): string {
  if (typeof coordinate !== 'number' || isNaN(coordinate)) return 'N/A';
  const absolute = Math.abs(coordinate);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
  const direction = isLatitude ? (coordinate >= 0 ? 'N' : 'S') : (coordinate >= 0 ? 'E' : 'W');
  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

// Accurately resolve local civil time with standard timezone abbreviation and UTC offset
function getLocalCivilTime(lat?: number, lon?: number): string {
  if (typeof lon !== 'number' || isNaN(lon)) return 'UTC';
  const now = new Date();

  if (typeof lat === 'number' && !isNaN(lat)) {
    try {
      const tz = tzLookup(lat, lon);
      if (tz) {
        const timeStr = now.toLocaleTimeString('en-US', {
          timeZone: tz,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        });
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          timeZoneName: 'short',
        }).formatToParts(now);
        const tzAbbr = parts.find((p) => p.type === 'timeZoneName')?.value || '';

        const offsetParts = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          timeZoneName: 'shortOffset',
        }).formatToParts(now);
        let tzOffset = offsetParts.find((p) => p.type === 'timeZoneName')?.value || '';
        tzOffset = tzOffset.replace('GMT', 'UTC');

        if (tzAbbr && tzOffset && tzAbbr !== tzOffset) {
          return `${timeStr} (${tzAbbr} / ${tzOffset})`;
        } else if (tzAbbr || tzOffset) {
          return `${timeStr} (${tzAbbr || tzOffset})`;
        }
        return timeStr;
      }
    } catch {
      // Fall through to nautical civil offset
    }
  }

  // Standard nautical civil time offset in whole integer zones
  const zoneHours = Math.round(lon / 15);
  const offsetSign = zoneHours >= 0 ? '+' : '';
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const totalMinutes = ((utcHours * 60 + utcMinutes + zoneHours * 60) % 1440 + 1440) % 1440;
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const m = String(Math.floor(totalMinutes % 60)).padStart(2, '0');
  return `${h}:${m} (UTC${offsetSign}${zoneHours})`;
}

export const TargetTelemetryDrawer: React.FC<TargetTelemetryDrawerProps> = ({
  target,
  onClose,
  allCameras,
  onSelectCamera,
  settings,
  pinnedCamIds = [],
  onTogglePin,
  onFitRoute,
}) => {
  const [cctvFrameKey, setCctvFrameKey] = useState<number>(Date.now());
  const [activeViewIndex, setActiveViewIndex] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flightTrace, setFlightTrace] = useState<FlightRouteTrace | null>(null);
  const [isTraceLoading, setIsTraceLoading] = useState<boolean>(false);
  const { style: dragStyle, dragProps } = useDraggable();

  useEffect(() => {
    const interval = setInterval(() => {
      setCctvFrameKey(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCameraError(null);
    setActiveViewIndex(0);
  }, [target?.id, target?.kind]);

  // Fetch full flight route & path trace when an aircraft is selected
  useEffect(() => {
    if (target?.kind !== 'FLIGHT') {
      setFlightTrace(null);
      setIsTraceLoading(false);
      return;
    }

    const flightData = target.data as FlightState | undefined;
    const callsign = (flightData?.callsign || target.title.replace(/^(Military\s+)?(Flight|Helicopter)\s+/i, '')).trim();
    const icao24 = target.id;
    const currentLat = target.lat;
    const currentLon = target.lon;
    const track = flightData?.trueTrack;
    const alt = flightData?.baroAltitude;

    let isMounted = true;
    setIsTraceLoading(true);

    fetchFlightTrace(callsign, icao24, currentLat, currentLon, track, alt)
      .then((trace) => {
        if (isMounted) {
          setFlightTrace(trace);
          setIsTraceLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setIsTraceLoading(false);
          console.warn('Trace load error:', err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [target?.id, target?.kind]);

  if (!target) return null;

  // Format flight distance helper (adapts to settings unit preference)
  const formatTraceDistance = (km?: number) => {
    if (typeof km !== 'number' || isNaN(km)) return 'N/A';
    if (settings?.speedUnit === 'kmh') {
      return `${Math.round(km).toLocaleString()} km`;
    }
    if (settings?.speedUnit === 'mph') {
      return `${Math.round(km * 0.621371).toLocaleString()} mi`;
    }
    return formatNauticalMiles(km);
  };

  // Format flight speed helper
  const formatFlightSpeed = (knots: number) => {
    if (settings?.speedUnit === 'kmh') {
      return `${Math.round(knots * 1.852)} km/h`;
    }
    if (settings?.speedUnit === 'mph') {
      return `${Math.round(knots * 1.15078)} mph`;
    }
    return `${knots} kts`;
  };

  // Format altitude helper
  const formatFlightAltitude = (feet: number) => {
    if (settings?.altitudeUnit === 'meters') {
      return `${Math.round(feet * 0.3048).toLocaleString()} m`;
    }
    return `${feet.toLocaleString()} ft`;
  };

  // Find nearest CCTV camera to target coordinates
  let foundCam: CCTVCamera | null = null;
  let nearestDistanceKm = Infinity;

  if (target.kind !== 'CCTV' && typeof target.lat === 'number' && typeof target.lon === 'number' && !isNaN(target.lat) && !isNaN(target.lon)) {
    allCameras.forEach((cam) => {
      if (typeof cam.lat !== 'number' || typeof cam.lon !== 'number' || isNaN(cam.lat) || isNaN(cam.lon)) return;
      const dLat = (cam.lat - target.lat) * 111;
      const dLon = (cam.lon - target.lon) * (111 * Math.cos((target.lat * Math.PI) / 180));
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);
      if (dist < nearestDistanceKm) {
        nearestDistanceKm = dist;
        foundCam = cam;
      }
    });
  }

  const isFlight = target.kind === 'FLIGHT';
  const flightData = isFlight ? (target.data as FlightState) : null;
  const isHeli = isHelicopterFlight(flightData);
  const isMil = isMilitaryFlight(flightData);

  const getCategoryLabel = () => {
    if (isFlight) return isHeli ? 'Helicopter' : 'Aircraft';
    switch (target.kind) {
      case 'VESSEL': return 'Vessel';
      case 'CCTV': return 'Camera';
      case 'EVENT': return 'Weather';
      case 'GBFS': return 'Bikeshare';
      case 'GTFS_RT': return 'Transit';
      case 'LOCATION': return 'Location';
      default:
        return target.kind.charAt(0).toUpperCase() + target.kind.slice(1).toLowerCase();
    }
  };

  const getTargetIcon = () => {
    switch (target.kind) {
      case 'FLIGHT': {
        if (isHeli) {
          return <HelicopterIcon className="w-4 h-4 text-white" />;
        }
        return <Plane className="w-4 h-4 text-white" />;
      }
      case 'VESSEL': return <Ship className="w-4 h-4 text-zinc-300" />;
      case 'CCTV': return <Video className="w-4 h-4 text-zinc-300" />;
      case 'EVENT': return <Zap className="w-4 h-4 text-zinc-300" />;
      case 'GBFS': return <Bike className="w-4 h-4 text-zinc-300" />;
      case 'GTFS_RT': return <Bus className="w-4 h-4 text-zinc-300" />;
      default: return <MapPin className="w-4 h-4 text-zinc-300" />;
    }
  };

  return (
    <div 
      style={dragStyle}
      {...dragProps}
      className="absolute top-14 sm:top-16 right-2 sm:right-4 z-30 w-80 max-w-[calc(100vw-1rem)] max-h-[calc(100vh-5rem)] flex flex-col bg-[#1c1c1c]/95 border border-[#2e2e2e] rounded-2xl shadow-xl backdrop-blur-md overflow-hidden text-zinc-200 select-none"
    >
      {/* Header Bar - Drag Handle (Only Top Bar is Draggable) */}
      <div 
        data-drag-handle
        className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#282828] bg-[#181818]/80 cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="w-4 h-4 text-zinc-500 shrink-0" />
          <div className="p-1.5 rounded-lg bg-[#282828] text-white shrink-0">
            {getTargetIcon()}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-zinc-400 font-medium tracking-wider block">
              {getCategoryLabel()}
            </span>
            <h2 className="text-xs font-semibold text-zinc-100 truncate">
              {target.title}
            </h2>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#282828] rounded-full transition-colors cursor-pointer shrink-0 ml-2"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
        {/* Coordinates Section */}
        <div className="space-y-2">
          <div className="text-[11px] font-medium text-zinc-400 border-b border-[#262626] pb-1">
            Location
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Coordinates</span>
              <span className="font-medium text-zinc-200">
                {typeof target.lat === 'number' && !isNaN(target.lat) ? `${target.lat.toFixed(4)}°, ${target.lon.toFixed(4)}°` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">DMS</span>
              <span className="text-zinc-300 text-[11px]">
                {toDMS(target.lat, true)}, {toDMS(target.lon, false)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Local Time</span>
              <span className="text-zinc-300">
                {getLocalCivilTime(target.lat, target.lon)}
              </span>
            </div>
          </div>
        </div>

        {/* FLIGHT ROUTE & PATH TRACE */}
        {target.kind === 'FLIGHT' && (
          <div className="space-y-2.5 bg-[#141414] border border-[#262626] rounded-xl p-3">
            <div className="flex items-center gap-1.5 border-b border-[#262626] pb-1.5 text-[11px] font-semibold text-zinc-200">
              <Route className="w-3.5 h-3.5 text-zinc-400" />
              <span>Flight Route & Path</span>
            </div>

            {isTraceLoading ? (
              <div className="flex items-center justify-center py-4 text-xs text-zinc-500 gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                <span>Resolving flight path & airports...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Origin & Destination Cards */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Origin Departure */}
                  <div className="bg-[#181818] border border-[#262626] rounded-lg p-2 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <PlaneTakeoff className="w-3 h-3 text-zinc-400" />
                      <span className="font-semibold tracking-wider">DEPARTURE</span>
                    </div>
                    {flightTrace?.origin ? (
                      <div>
                        <div className="text-sm font-mono font-bold text-zinc-100">
                          {formatAirportCode(flightTrace.origin)}
                        </div>
                        <div className="text-[11px] font-medium text-zinc-200 line-clamp-1" title={flightTrace.origin.name}>
                          {flightTrace.origin.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 line-clamp-1">
                          {flightTrace.origin.municipality ? `${flightTrace.origin.municipality}, ` : ''}{flightTrace.origin.countryName || ''}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-500 italic py-1">
                        Unfiled or In Transit
                      </div>
                    )}
                  </div>

                  {/* Destination Arrival */}
                  <div className="bg-[#181818] border border-[#262626] rounded-lg p-2 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <PlaneLanding className="w-3 h-3 text-zinc-400" />
                      <span className="font-semibold tracking-wider">ARRIVAL</span>
                    </div>
                    {flightTrace?.destination ? (
                      <div>
                        <div className="text-sm font-mono font-bold text-zinc-100">
                          {formatAirportCode(flightTrace.destination)}
                        </div>
                        <div className="text-[11px] font-medium text-zinc-200 line-clamp-1" title={flightTrace.destination.name}>
                          {flightTrace.destination.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 line-clamp-1">
                          {flightTrace.destination.municipality ? `${flightTrace.destination.municipality}, ` : ''}{flightTrace.destination.countryName || ''}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-500 italic py-1">
                        En Route / Unknown
                      </div>
                    )}
                  </div>
                </div>

                {/* Route Progress Bar (if destination known) */}
                {typeof flightTrace?.distanceFlownKm === 'number' && typeof flightTrace?.distanceRemainingKm === 'number' && (
                  <div className="space-y-1 bg-[#181818] border border-[#262626] rounded-lg p-2">
                    <div className="flex justify-between items-center text-[10px] text-zinc-400">
                      <span>Flown: {formatTraceDistance(flightTrace.distanceFlownKm)}</span>
                      <span className="font-mono text-zinc-200">{getRouteProgressPercent(flightTrace)}%</span>
                      <span>Remaining: {formatTraceDistance(flightTrace.distanceRemainingKm)}</span>
                    </div>
                    <div className="w-full bg-[#262626] rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-zinc-400 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${getRouteProgressPercent(flightTrace)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Distance Flown Metric if destination unknown but origin or trail known */}
                {typeof flightTrace?.distanceFlownKm === 'number' && typeof flightTrace?.distanceRemainingKm !== 'number' && (
                  <div className="flex justify-between items-center text-xs px-1">
                    <span className="text-zinc-400">Estimated Flown Distance</span>
                    <span className="font-mono font-medium text-zinc-200">{formatTraceDistance(flightTrace.distanceFlownKm)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* FLIGHT TELEMETRY */}
        {target.kind === 'FLIGHT' && (
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-zinc-400 border-b border-[#262626] pb-1">
              Flight Details
            </div>
            {(() => {
              const flight = target.data as FlightState;
              const feetPerMin = Math.round((flight.verticalRate || 0) * 196.85);
              return (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Callsign</span>
                    <span className="font-semibold text-zinc-100">{flight.callsign}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">ICAO Transponder</span>
                    <span className="text-zinc-200">{flight.icao24.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Aircraft Model</span>
                    <span className="text-zinc-200">{getAircraftModelDisplay(flight.aircraftModel)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Class</span>
                    <span className="text-zinc-200">{isHeli ? 'Helicopter / Rotorcraft' : 'Fixed-Wing Aircraft'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Mission</span>
                    <span className="font-medium text-zinc-200">
                      {isMil ? 'Military' : 'Civilian / Commercial'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Country</span>
                    <span className="text-zinc-300">{getAircraftCountry(flight)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Altitude</span>
                    <span className="font-medium text-zinc-100">{formatFlightAltitude(flight.baroAltitude || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Vertical Rate</span>
                    <span className="text-zinc-300">
                      {feetPerMin > 100 ? `Climbing (+${feetPerMin} ft/min)` : feetPerMin < -100 ? `Descending (${feetPerMin} ft/min)` : 'Level Cruise'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Ground Speed</span>
                    <span className="font-medium text-zinc-100">{formatFlightSpeed(flight.velocity || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Heading</span>
                    <span className="text-zinc-200">{getCardinalDirection(flight.trueTrack)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Squawk Code</span>
                    <span className="text-zinc-300">{flight.squawk || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Status</span>
                    <span className="text-zinc-200">
                      {flight.onGround ? 'On Ground' : 'Airborne'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Data Feed</span>
                    <span className="text-zinc-300 text-[11px] font-medium">{flight.source || 'Astraware Flights (api.astraware.xyz)'}</span>
                  </div>
                  <div className="pt-2">
                    <a
                      href={`https://api.astraware.xyz/flights`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-[#282828] hover:bg-[#333333] border border-[#383838] text-xs font-medium text-zinc-200 transition-colors"
                      title="Open Astraware Flights Tracker"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>View on Astraware Flights</span>
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* MARITIME TELEMETRY */}
        {target.kind === 'VESSEL' && (
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-zinc-400 border-b border-[#262626] pb-1">
              Vessel Details
            </div>
            {(() => {
              const vessel = target.data as MaritimeVessel;
              return (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Vessel Name</span>
                    <span className="font-semibold text-zinc-100">{vessel.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">MMSI</span>
                    <span className="text-zinc-200">{vessel.mmsi}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Type</span>
                    <span className="text-zinc-200">{vessel.type || 'Commercial Vessel'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Status</span>
                    <span className="text-zinc-200">{vessel.status || 'Underway'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Speed</span>
                    <span className="font-medium text-zinc-100">{vessel.sogKnots || 0} kts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Course</span>
                    <span className="text-zinc-200">{getCardinalDirection(vessel.cogDeg || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Destination</span>
                    <span className="text-zinc-200 truncate max-w-[160px]">{vessel.destination || 'In Transit'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Dimensions</span>
                    <span className="text-zinc-300">{vessel.length || 100}m × {vessel.width || 18}m</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* CCTV CAMERA TELEMETRY */}
        {target.kind === 'CCTV' && (
          <div className="space-y-2.5">
            {(() => {
              const cam = target.data as CCTVCamera;
              const hasViews = Boolean(cam.views && cam.views.length > 1);
              const activeView = hasViews && cam.views && cam.views[activeViewIndex] ? cam.views[activeViewIndex] : null;

              const activeSnapshot = activeView?.snapshotUrl || (activeView as any)?.url || cam.snapshotUrl;
              const activeStream = activeView ? (activeView.streamUrl || activeView.videoUrl) : (cam.streamUrl || cam.videoUrl);
              const isStreaming = Boolean(activeStream);

              const proxiedUrl = isStreaming
                ? `/api/cctv/proxy?url=${encodeURIComponent(activeSnapshot)}`
                : `/api/cctv/proxy?url=${encodeURIComponent(activeSnapshot)}&t=${cctvFrameKey}`;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400 border-b border-[#262626] pb-1">
                    <div className="flex items-center gap-2">
                      <span>{isStreaming ? 'Live Video Feed' : 'Camera Snapshot'}</span>
                      {isStreaming && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#1e1e1e] border border-[#2c2c2c] text-[9px] font-mono text-zinc-300">
                          LIVE
                        </span>
                      )}
                      {hasViews && cam.views && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#252525] border border-[#353535] text-[9px] font-mono text-zinc-300">
                          {cam.views.length} Angles
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {onTogglePin && (
                        <button
                          onClick={() => onTogglePin(cam.id)}
                          className={`p-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                            pinnedCamIds.includes(cam.id)
                              ? 'text-zinc-100 hover:text-white bg-[#2a2a2a] px-1.5 border border-[#3a3a3a]'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#202020] px-1.5 border border-transparent'
                          }`}
                          title={pinnedCamIds.includes(cam.id) ? 'Unpin camera from multigrid' : 'Pin camera to multigrid'}
                        >
                          <Pin className={`w-3 h-3 ${pinnedCamIds.includes(cam.id) ? 'fill-current text-white' : ''}`} />
                          <span className="text-[10px] font-medium">
                            {pinnedCamIds.includes(cam.id) ? 'Pinned' : 'Pin'}
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => setCctvFrameKey(Date.now())}
                        className="p-1 rounded-full hover:bg-[#282828] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                        title={isStreaming ? "Reload video stream" : "Refresh snapshot frame"}
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Multi-angle view selector */}
                  {hasViews && cam.views && (
                    <div className="p-2 rounded-xl bg-[#161616] border border-[#262626] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="font-medium text-zinc-300">Camera Angles / Views</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Angle {activeViewIndex + 1} of {cam.views.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cam.views.map((v, idx) => {
                          const isCurrent = idx === activeViewIndex;
                          return (
                            <button
                              key={v.id || idx}
                              onClick={() => {
                                setActiveViewIndex(idx);
                                setCameraError(null);
                              }}
                              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                isCurrent
                                  ? 'bg-zinc-200 text-zinc-950 font-semibold shadow-sm'
                                  : 'bg-[#222222] hover:bg-[#2c2c2c] text-zinc-400 hover:text-zinc-200 border border-[#303030]'
                              }`}
                              title={v.name}
                            >
                              {v.label && (
                                <span className={`px-1 py-0.2 rounded text-[10px] font-mono ${isCurrent ? 'bg-zinc-950 text-zinc-200' : 'bg-[#181818] text-zinc-400'}`}>
                                  {v.label}
                                </span>
                              )}
                              <span className="truncate max-w-[130px]">{v.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      {activeView && (
                        <div className="text-[11px] text-zinc-300 font-medium truncate pt-0.5">
                          {activeView.name}
                        </div>
                      )}
                    </div>
                  )}

                  {(() => {
                    const isMdotCam = cam.id.startsWith('mdot-') || cam.agency?.toLowerCase().includes('mdot') || cam.city?.includes(', MS');
                    return (
                      <>
                        {cameraError && isMdotCam && (
                          <div className="mb-2.5 px-3 py-2 rounded-xl bg-[#181818] border border-[#2e2e2e] flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-zinc-300">
                              <ShieldAlert className="w-4 h-4 text-zinc-400 shrink-0" />
                              <div>
                                <div className="font-medium text-[11px] text-zinc-200">MDOT Traffic Firewall Restricted</div>
                                <div className="text-[10px] text-zinc-400">Upstream HTTP 403 block on automated server streaming</div>
                              </div>
                            </div>
                            <a
                              href="https://www.mdottraffic.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-zinc-300 hover:text-white underline shrink-0 ml-2 flex items-center gap-1"
                            >
                              <span>Open MDOT</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}

                        <div className="relative rounded-xl overflow-hidden border border-[#2a2a2a] bg-black aspect-video flex items-center justify-center">
                          {cameraError && !isMdotCam ? (
                            <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-[#181818]">
                              <AlertCircle className="w-5 h-5 text-zinc-500 mb-1" />
                              <span className="text-zinc-300 text-xs">Feed Unavailable</span>
                            </div>
                          ) : (
                            <CCTVImage
                              key={`${cam.id}-${activeViewIndex}`}
                              src={proxiedUrl}
                              fallbackSrc={activeSnapshot}
                              streamUrl={activeStream}
                              alt={activeView?.name || cam.name}
                              className="w-full h-full object-cover"
                              onLoad={() => setCameraError(null)}
                              onError={() => setCameraError('Feed unavailable')}
                            />
                          )}
                        </div>
                      </>
                    );
                  })()}

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Agency</span>
                      <span className="font-medium text-zinc-200">{cam.agency}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Location</span>
                      <span className="text-zinc-300">{cam.highway}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">City</span>
                      <span className="text-zinc-300">{cam.city}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* EVENT TELEMETRY */}
        {target.kind === 'EVENT' && (
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-zinc-400 border-b border-[#262626] pb-1">
              Event Details
            </div>
            {(() => {
              const event = target.data as any;
              const severityColor = 
                event.severity === 'CRITICAL' ? 'text-red-400' : 
                event.severity === 'HIGH' ? 'text-orange-400' : 
                event.severity === 'MEDIUM' ? 'text-yellow-400' : 'text-blue-400';

              return (
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Severity</span>
                      <span className={`font-bold ${severityColor}`}>{event.severity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Type</span>
                      <span className="text-zinc-200">{event.type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Source</span>
                      <span className="text-zinc-300 font-mono text-[10px]">{event.source}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Detected</span>
                      <span className="text-zinc-300">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#242424] border border-[#303030] space-y-1.5">
                    <div className="font-semibold text-zinc-100">{event.title}</div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* GBFS BIKESHARE TELEMETRY */}
        {target.kind === 'GBFS' && (
          <div className="space-y-2.5">
            {(() => {
              const station = target.data as GbfsStation;
              return (
                <div className="space-y-2">
                  <div className="text-[11px] font-medium text-zinc-400 border-b border-[#262626] pb-1">
                    Bikeshare Station (GBFS)
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">System</span>
                      <span className="font-semibold text-zinc-100">{station.systemName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Station Name</span>
                      <span className="text-zinc-200 truncate max-w-[170px]" title={station.name}>
                        {station.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Bikes Available</span>
                      <span className="font-semibold text-zinc-100">{station.numBikesAvailable}</span>
                    </div>
                    {station.numEbikesAvailable > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">E-Bikes (Boost)</span>
                        <span className="font-medium text-zinc-200">{station.numEbikesAvailable}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Empty Docks</span>
                      <span className="text-zinc-200">{station.numDocksAvailable}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Total Capacity</span>
                      <span className="text-zinc-300">{station.capacity} docks</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Rental Status</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${station.isRenting ? 'bg-[#222222] text-zinc-200 border border-[#383838]' : 'bg-[#181818] text-zinc-500 border border-[#282828]'}`}>
                        {station.isRenting ? 'ONLINE / RENTING' : 'OFFLINE'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Returns</span>
                      <span className="text-zinc-300">
                        {station.isReturning ? 'Accepted' : 'Full / Closed'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* GTFS-RT PUBLIC TRANSIT TELEMETRY */}
        {target.kind === 'GTFS_RT' && (
          <div className="space-y-2.5">
            {(() => {
              const vehicle = target.data as GtfsRtVehicle;
              return (
                <div className="space-y-2">
                  <div className="text-[11px] font-medium text-zinc-400 border-b border-[#262626] pb-1">
                    Public Transit Fleet (GTFS-RT)
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Agency</span>
                      <span className="font-semibold text-zinc-100">{vehicle.agencyName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Route / Line</span>
                      <span className="px-2 py-0.5 rounded bg-[#242424] text-zinc-100 font-semibold border border-[#383838]">
                        {vehicle.routeId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Transit Mode</span>
                      <span className="text-zinc-200">{vehicle.vehicleType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Vehicle Unit</span>
                      <span className="text-zinc-200 font-mono text-[11px]">{vehicle.label || vehicle.id}</span>
                    </div>
                    {typeof vehicle.speed === 'number' && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Current Speed</span>
                        <span className="font-medium text-zinc-100">{vehicle.speed} km/h</span>
                      </div>
                    )}
                    {typeof vehicle.bearing === 'number' && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Heading</span>
                        <span className="text-zinc-200">{getCardinalDirection(vehicle.bearing)}</span>
                      </div>
                    )}
                    {vehicle.currentStatus !== undefined && vehicle.currentStatus !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Status</span>
                        <span className="text-zinc-300 text-[11px]">{formatVehicleStatus(vehicle.currentStatus)}</span>
                      </div>
                    )}
                    {vehicle.tripId && (
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Trip Reference</span>
                        <span className="text-zinc-400 font-mono text-[10px] truncate max-w-[150px]" title={vehicle.tripId}>
                          {vehicle.tripId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Nearby CCTV Camera Link */}
        {target.kind !== 'CCTV' && foundCam !== null && nearestDistanceKm < 50 && (
          <div className="space-y-2 pt-1 border-t border-[#262626]">
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
              <span>Nearest Traffic Camera</span>
              <span className="text-zinc-500">{nearestDistanceKm.toFixed(1)} km away</span>
            </div>

            {(() => {
              const cam = foundCam as CCTVCamera;
              return (
                <div 
                  onClick={() => onSelectCamera(cam)}
                  className="relative rounded-lg overflow-hidden border border-[#2a2a2a] bg-black aspect-video cursor-pointer hover:border-zinc-500 transition-colors group"
                >
                  <CCTVImage
                    src={`/api/cctv/proxy?url=${encodeURIComponent(cam.snapshotUrl)}&t=${cctvFrameKey}`}
                    alt={cam.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 flex items-end justify-between">
                    <span className="text-[11px] text-zinc-100 font-medium truncate max-w-[180px]">
                      {cam.name}
                    </span>
                    <span className="text-[10px] text-zinc-300 bg-black/60 px-1.5 py-0.5 rounded">
                      View
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
