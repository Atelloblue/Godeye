import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { 
  FlightState, 
  MaritimeVessel, 
  CCTVCamera, 
  GodsEyeEvent,
  SelectedTarget, 
  LayerVisibility,
  AppSettings,
  GbfsStation,
  GtfsRtVehicle,
  MapHighlight,
  FlightRouteTrace
} from '../types';
import { fetchBuildingFootprint } from '../utils/geoBoundaries';
import { WalkingRoute } from '../utils/walkingRouteApi';
import { 
  isHelicopterFlight, 
  isMilitaryFlight, 
  getAircraftCountry, 
  getAircraftModelDisplay 
} from '../utils/flightClassification';
import { fetchFlightTrace, formatNauticalMiles, formatAirportCode } from '../utils/flightTraceApi';
import { GodsEyeGlobe3D } from './GodsEyeGlobe3D';

// Renders top-down aircraft or helicopter SVG marker with military orange / civilian styling
function renderFlightMarkerHtml(flight: FlightState, track: number, isSelected: boolean): string {
  const isHeli = isHelicopterFlight(flight);
  const isMil = isMilitaryFlight(flight);

  // Military: Pure orange (#f97316)
  // Civilian: Off-white (#f0f0f0, #ffffff when selected)
  const fillColor = isMil ? '#f97316' : (isSelected ? '#ffffff' : '#f0f0f0');

  const strokeColor = '#0a0a0a';

  // Crisp neutral dark silhouette shadow with NO orange color bleed
  const shadowClass = isSelected
    ? 'scale-125 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]'
    : 'drop-shadow-[0_1.5px_2.5px_rgba(0,0,0,0.85)]';

  const roundedTrack = Math.round(track);

  if (isHeli) {
    return `
      <div class="cursor-pointer select-none transition-transform hover:scale-125 flex items-center justify-center ${shadowClass}">
        <svg width="22" height="22" viewBox="0 0 24 24" style="transform: rotate(${roundedTrack}deg);" class="overflow-visible">
          <!-- Skids -->
          <line x1="6" y1="7.5" x2="6" y2="13.5" stroke="${fillColor}" stroke-width="0.9" stroke-linecap="round"/>
          <line x1="18" y1="7.5" x2="18" y2="13.5" stroke="${fillColor}" stroke-width="0.9" stroke-linecap="round"/>
          <line x1="6" y1="9.5" x2="9.5" y2="9.5" stroke="${fillColor}" stroke-width="0.8"/>
          <line x1="14.5" y1="9.5" x2="18" y2="9.5" stroke="${fillColor}" stroke-width="0.8"/>
          <!-- Fuselage & Tail Boom -->
          <path d="M12 3.5 C10.2 3.5 9 5.5 9 8.5 L9 11.5 C9 13 10.5 14 11 15 L11 20.5 L12 21.5 L13 20.5 L13 15 C13.5 14 15 13 15 11.5 L15 8.5 C15 5.5 13.8 3.5 12 3.5 Z" 
                fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.75"/>
          <!-- Tail Stabilizer Fin -->
          <line x1="9" y1="16.5" x2="15" y2="16.5" stroke="${fillColor}" stroke-width="1.2" stroke-linecap="round"/>
          <!-- Tail Rotor -->
          <path d="M8.5 20.2 H12 V21.7 H8.5 Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.5"/>
          <!-- Main Rotor Blades -->
          <rect x="2" y="8.7" width="20" height="1.6" rx="0.8" fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.5"/>
          <!-- Central Rotor Hub -->
          <circle cx="12" cy="9.5" r="1.8" fill="${strokeColor}"/>
          <circle cx="12" cy="9.5" r="1" fill="${fillColor}"/>
        </svg>
      </div>
    `;
  }

  return `
    <div class="cursor-pointer select-none transition-transform hover:scale-125 flex items-center justify-center ${shadowClass}">
      <svg width="22" height="22" viewBox="0 0 24 24" style="transform: rotate(${roundedTrack}deg);" class="overflow-visible">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" 
              fill="${fillColor}" stroke="${strokeColor}" stroke-width="0.75"/>
      </svg>
    </div>
  `;
}

interface GodsEyeMapProps {
  flights: FlightState[];
  vessels: MaritimeVessel[];
  cameras: CCTVCamera[];
  events?: GodsEyeEvent[];
  weather: GodsEyeEvent[];
  wildfires: GodsEyeEvent[];
  gbfsStations?: GbfsStation[];
  gtfsRtVehicles?: GtfsRtVehicle[];
  selectedTarget: SelectedTarget | null;
  onSelectTarget: (target: SelectedTarget) => void;
  layers: LayerVisibility;
  onToggleLayer?: (layer: keyof LayerVisibility) => void;
  centerCoordinates: { lat: number; lon: number; zoom: number } | null;
  settings?: AppSettings;
  userLocation?: { lat: number; lon: number; accuracy?: number; heading?: number; speed?: number } | null;
  radarSource?: 'nexrad' | 'global';
  activeRadarFrame?: { time: number; path: string; host: string } | null;
  radarOpacity?: number;
  activeHighlight?: MapHighlight | null;
  activeHighlights?: MapHighlight[];
  walkingRoute?: WalkingRoute | null;
  fitRouteTrigger?: number;
  onViewportChange?: (viewport: { lat: number; lon: number; zoom: number }) => void;
}

export function isValidCoordinate(lat: unknown, lon: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    isFinite(lat) &&
    isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function formatVehicleStatus(status: unknown): string {
  if (status === null || status === undefined || status === '') return 'In transit';
  if (status === 0 || status === '0' || status === 'INCOMING_AT') return 'Incoming at station';
  if (status === 1 || status === '1' || status === 'STOPPED_AT') return 'Stopped at station';
  if (status === 2 || status === '2' || status === 'IN_TRANSIT_TO') return 'In transit';
  return String(status).replace(/_/g, ' ');
}

export interface AnimatedFlightItem {
  marker: L.Marker;
  flight: FlightState;
  currentLat: number;
  currentLon: number;
  currentTrack: number;
  currentSpeedMs: number;
  targetLat: number;
  targetLon: number;
  targetTrack: number;
  targetSpeedMs: number;
  lastTargetUpdateTime: number;
}

export interface AnimatedVesselItem {
  marker: L.Marker;
  vessel: MaritimeVessel;
  currentLat: number;
  currentLon: number;
  currentCog: number;
  currentSpeedMs: number;
  targetLat: number;
  targetLon: number;
  targetCog: number;
  targetSpeedMs: number;
  lastTargetUpdateTime: number;
}

export interface AnimatedTransitItem {
  marker: L.Marker;
  vehicle: GtfsRtVehicle;
  currentLat: number;
  currentLon: number;
  currentBearing?: number;
  currentSpeedMs: number;
  targetLat: number;
  targetLon: number;
  targetBearing?: number;
  targetSpeedMs: number;
  lastTargetUpdateTime: number;
}

export const GodsEyeMap: React.FC<GodsEyeMapProps> = ({
  flights,
  vessels,
  cameras,
  events = [],
  weather,
  wildfires,
  gbfsStations = [],
  gtfsRtVehicles = [],
  selectedTarget,
  onSelectTarget,
  layers,
  onToggleLayer,
  centerCoordinates,
  settings,
  userLocation,
  radarSource = 'global',
  activeRadarFrame = null,
  radarOpacity = 0.45,
  activeHighlight = null,
  activeHighlights = [],
  walkingRoute = null,
  fitRouteTrigger = 0,
  onViewportChange,
}) => {
  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [mapZoom, setMapZoom] = useState<number>(centerCoordinates?.zoom || 12);
  const [mapMoveCount, setMapMoveCount] = useState<number>(0);
  const [isTargetLocked, setIsTargetLocked] = useState<boolean>(true);
  const isTargetLockedRef = useRef<boolean>(true);
  const isFlyingToTargetRef = useRef<boolean>(false);

  const [activeFlightTrace, setActiveFlightTrace] = useState<FlightRouteTrace | null>(null);
  const [isTraceLoading, setIsTraceLoading] = useState<boolean>(false);

  const baseLayersRef = useRef<{ [key: string]: L.TileLayer | L.LayerGroup }>({});
  const activeBaseLayerRef = useRef<string>('satellite');
  
  const flightsGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const flightTraceGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const flightTraceLinesRef = useRef<{ outer: L.Polyline; inner: L.Polyline; planned?: L.Polyline } | null>(null);
  const vesselsGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const camerasGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const trafficFlowGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const trafficIncidentsGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const targetLockGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const userLocationGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const highlightGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const routeGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const selectionMarkerRef = useRef<L.Marker | null>(null);
  const eventsGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const weatherGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const wildfiresGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const gbfsGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const gtfsRtGroupRef = useRef<L.LayerGroup>(L.layerGroup());

  const selectedTargetRef = useRef<SelectedTarget | null>(selectedTarget);
  useEffect(() => {
    selectedTargetRef.current = selectedTarget;
    if (selectedTarget) {
      setIsTargetLocked(true);
      isTargetLockedRef.current = true;
    }
  }, [selectedTarget]);

  const flightMarkersMapRef = useRef<Map<string, AnimatedFlightItem>>(new Map());
  const vesselMarkersMapRef = useRef<Map<string, AnimatedVesselItem>>(new Map());
  const transitMarkersMapRef = useRef<Map<string, AnimatedTransitItem>>(new Map());

  // 60 FPS Continuous Kinematic Predictor-Corrector Animation Loop
  // Live aircraft, vessels, and transit vehicles glide continuously forward along their heading vector.
  // When telemetry packets arrive, an asymptotic correction drift gently pulls the position
  // towards the projected target fix without ever snapping backwards or jumping!
  useEffect(() => {
    let animationFrameId: number;
    let lastFrameTime = performance.now();

    const animate = (currentTime: number) => {
      const dtSec = Math.min(0.1, Math.max(0.001, (currentTime - lastFrameTime) / 1000));
      lastFrameTime = currentTime;

      // 1. Update Flights: Continuous forward flight with shortest-arc turning & asymptotic convergence
      flightMarkersMapRef.current.forEach((item) => {
        if (item.flight.onGround || item.targetSpeedMs < 2) {
          const blend = 1 - Math.exp(-dtSec * 3);
          item.currentLat += (item.targetLat - item.currentLat) * blend;
          item.currentLon += (item.targetLon - item.currentLon) * blend;
          item.currentTrack = item.targetTrack;
          item.currentSpeedMs = item.targetSpeedMs;
        } else {
          // Smooth heading rotation towards targetTrack using shortest circular arc
          let dTrack = item.targetTrack - item.currentTrack;
          while (dTrack > 180) dTrack -= 360;
          while (dTrack < -180) dTrack += 360;
          const maxTurn = 25 * dtSec;
          const turnStep = Math.sign(dTrack) * Math.min(Math.abs(dTrack), maxTurn);
          item.currentTrack = (item.currentTrack + turnStep + 360) % 360;

          // Smooth speed blend
          const speedBlend = 1 - Math.exp(-dtSec * 1.5);
          item.currentSpeedMs += (item.targetSpeedMs - item.currentSpeedMs) * speedBlend;

          // Forward kinematic displacement along currentTrack
          const trackRad = (item.currentTrack * Math.PI) / 180;
          const fwdDistM = item.currentSpeedMs * dtSec;
          const fwdLat = (fwdDistM * Math.cos(trackRad)) / 111320;
          const cosLat = Math.cos((item.currentLat * Math.PI) / 180);
          const fwdLon = (fwdDistM * Math.sin(trackRad)) / (111320 * (cosLat || 1));

          item.currentLat += fwdLat;
          item.currentLon += fwdLon;

          // Asymptotic position correction towards projected transponder position
          const ageSec = Math.max(0, (currentTime - item.lastTargetUpdateTime) / 1000);
          const projDistM = item.targetSpeedMs * ageSec;
          const targetTrackRad = (item.targetTrack * Math.PI) / 180;
          const projLat = item.targetLat + (projDistM * Math.cos(targetTrackRad)) / 111320;
          const targetCosLat = Math.cos((item.targetLat * Math.PI) / 180);
          const projLon = item.targetLon + (projDistM * Math.sin(targetTrackRad)) / (111320 * (targetCosLat || 1));

          const errLat = projLat - item.currentLat;
          const errLon = projLon - item.currentLon;
          const errM = Math.hypot(errLat * 111320, errLon * 111320 * cosLat);

          if (errM > 25000) {
            // Signal re-lock after long gap: snap to projected
            item.currentLat = projLat;
            item.currentLon = projLon;
          } else if (errM > 2) {
            // Gentle exponential convergence (time constant tau ~ 2.5s) - NO BACKWARDS SNAP
            const corrBlend = 1 - Math.exp(-dtSec * 0.4);
            item.currentLat += errLat * corrBlend;
            item.currentLon += errLon * corrBlend;
          }
        }

        if (isValidCoordinate(item.currentLat, item.currentLon)) {
          item.marker.setLatLng([item.currentLat, item.currentLon]);

          // Dynamically synchronize the live flight trail endpoint with the moving plane
          if (flightTraceLinesRef.current && selectedTargetRef.current?.id === item.flight.icao24) {
            const { outer, inner, planned } = flightTraceLinesRef.current;
            const currentPts = outer.getLatLngs() as L.LatLng[];
            if (currentPts && currentPts.length > 0) {
              currentPts[currentPts.length - 1] = L.latLng(item.currentLat, item.currentLon);
              outer.setLatLngs(currentPts);
              inner.setLatLngs(currentPts);
            }
            if (planned) {
              const plannedPts = planned.getLatLngs() as L.LatLng[];
              if (plannedPts && plannedPts.length > 0) {
                plannedPts[0] = L.latLng(item.currentLat, item.currentLon);
                planned.setLatLngs(plannedPts);
              }
            }
          }
        }

        const el = item.marker.getElement();
        if (el) {
          const svg = el.querySelector('svg');
          if (svg) {
            svg.style.transform = `rotate(${Math.round(item.currentTrack)}deg)`;
          }
        }
      });

      // 2. Update Vessels: Continuous maritime drift with turn rate damping
      vesselMarkersMapRef.current.forEach((item) => {
        if (item.targetSpeedMs < 0.3) {
          const blend = 1 - Math.exp(-dtSec * 2);
          item.currentLat += (item.targetLat - item.currentLat) * blend;
          item.currentLon += (item.targetLon - item.currentLon) * blend;
          item.currentCog = item.targetCog;
          item.currentSpeedMs = item.targetSpeedMs;
        } else {
          let dCog = item.targetCog - item.currentCog;
          while (dCog > 180) dCog -= 360;
          while (dCog < -180) dCog += 360;
          const maxTurn = 10 * dtSec;
          const turnStep = Math.sign(dCog) * Math.min(Math.abs(dCog), maxTurn);
          item.currentCog = (item.currentCog + turnStep + 360) % 360;

          const speedBlend = 1 - Math.exp(-dtSec * 1.5);
          item.currentSpeedMs += (item.targetSpeedMs - item.currentSpeedMs) * speedBlend;

          const cogRad = (item.currentCog * Math.PI) / 180;
          const fwdDistM = item.currentSpeedMs * dtSec;
          const fwdLat = (fwdDistM * Math.cos(cogRad)) / 111320;
          const cosLat = Math.cos((item.currentLat * Math.PI) / 180);
          const fwdLon = (fwdDistM * Math.sin(cogRad)) / (111320 * (cosLat || 1));

          item.currentLat += fwdLat;
          item.currentLon += fwdLon;

          const ageSec = Math.max(0, (currentTime - item.lastTargetUpdateTime) / 1000);
          const projDistM = item.targetSpeedMs * ageSec;
          const targetCogRad = (item.targetCog * Math.PI) / 180;
          const projLat = item.targetLat + (projDistM * Math.cos(targetCogRad)) / 111320;
          const targetCosLat = Math.cos((item.targetLat * Math.PI) / 180);
          const projLon = item.targetLon + (projDistM * Math.sin(targetCogRad)) / (111320 * (targetCosLat || 1));

          const errLat = projLat - item.currentLat;
          const errLon = projLon - item.currentLon;
          const errM = Math.hypot(errLat * 111320, errLon * 111320 * cosLat);

          if (errM > 15000) {
            item.currentLat = projLat;
            item.currentLon = projLon;
          } else if (errM > 1) {
            const corrBlend = 1 - Math.exp(-dtSec * 0.4);
            item.currentLat += errLat * corrBlend;
            item.currentLon += errLon * corrBlend;
          }
        }

        if (isValidCoordinate(item.currentLat, item.currentLon)) {
          item.marker.setLatLng([item.currentLat, item.currentLon]);
        }

        const el = item.marker.getElement();
        if (el) {
          const svg = el.querySelector('svg');
          if (svg) {
            svg.style.transform = `rotate(${Math.round(item.currentCog)}deg)`;
          }
        }
      });

      // 3. Update GTFS-RT Transit
      transitMarkersMapRef.current.forEach((item) => {
        if (item.targetSpeedMs < 0.5) {
          const blend = 1 - Math.exp(-dtSec * 3);
          item.currentLat += (item.targetLat - item.currentLat) * blend;
          item.currentLon += (item.targetLon - item.currentLon) * blend;
          if (item.targetBearing !== undefined) item.currentBearing = item.targetBearing;
        } else {
          const bearing = item.targetBearing ?? item.currentBearing ?? 0;
          const bearingRad = (bearing * Math.PI) / 180;
          const fwdDistM = item.currentSpeedMs * dtSec;
          const fwdLat = (fwdDistM * Math.cos(bearingRad)) / 111320;
          const cosLat = Math.cos((item.currentLat * Math.PI) / 180);
          const fwdLon = (fwdDistM * Math.sin(bearingRad)) / (111320 * (cosLat || 1));

          item.currentLat += fwdLat;
          item.currentLon += fwdLon;

          const errLat = item.targetLat - item.currentLat;
          const errLon = item.targetLon - item.currentLon;
          const errM = Math.hypot(errLat * 111320, errLon * 111320 * cosLat);

          if (errM > 5000) {
            item.currentLat = item.targetLat;
            item.currentLon = item.targetLon;
          } else if (errM > 2) {
            const corrBlend = 1 - Math.exp(-dtSec * 0.5);
            item.currentLat += errLat * corrBlend;
            item.currentLon += errLon * corrBlend;
          }
        }

        if (isValidCoordinate(item.currentLat, item.currentLon)) {
          item.marker.setLatLng([item.currentLat, item.currentLon]);
        }
      });

      // 4. Camera Tracking & Selection Ring lockstep follow
      const map = mapInstanceRef.current;
      const tracked = selectedTargetRef.current;

      if (tracked && (tracked.kind === 'FLIGHT' || tracked.kind === 'VESSEL' || tracked.kind === 'GTFS_RT')) {
        let currentPos: { lat: number; lon: number } | null = null;

        if (tracked.kind === 'FLIGHT') {
          const item = flightMarkersMapRef.current.get(tracked.id);
          if (item) currentPos = { lat: item.currentLat, lon: item.currentLon };
        } else if (tracked.kind === 'VESSEL') {
          const item = vesselMarkersMapRef.current.get(tracked.id);
          if (item) currentPos = { lat: item.currentLat, lon: item.currentLon };
        } else if (tracked.kind === 'GTFS_RT') {
          const item = transitMarkersMapRef.current.get(tracked.id);
          if (item) currentPos = { lat: item.currentLat, lon: item.currentLon };
        }

        if (currentPos && isValidCoordinate(currentPos.lat, currentPos.lon)) {
          // Move selection ring in 100% lockstep with animated target
          if (selectionMarkerRef.current) {
            selectionMarkerRef.current.setLatLng([currentPos.lat, currentPos.lon]);
          }

          // Camera smoothly follows target if lock is enabled and not in the middle of flyTo
          if (map && isTargetLockedRef.current && !isFlyingToTargetRef.current) {
            map.panTo([currentPos.lat, currentPos.lon], { animate: false });
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current, {
      center: [37.7749, -122.4194],
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
      maxZoom: 19,
      minZoom: 2,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const googleSatellite = L.tileLayer(
      'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps',
        maxZoom: 20,
        maxNativeZoom: 20,
      }
    );

    const darkTactical = L.layerGroup([
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          subdomains: ['a', 'b', 'c', 'd'],
          attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
          maxZoom: 20,
          maxNativeZoom: 19,
        }
      ),
    ]);

    const hybridGroup = L.tileLayer(
      'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps',
        maxZoom: 20,
        maxNativeZoom: 20,
      }
    );

    const topoMap = L.tileLayer(
      'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
      {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps',
        maxZoom: 20,
        maxNativeZoom: 20,
      }
    );

    baseLayersRef.current = {
      satellite: googleSatellite,
      dark_tactical: darkTactical,
      hybrid: hybridGroup,
      topographic: topoMap,
    };

    googleSatellite.addTo(map);
    activeBaseLayerRef.current = 'satellite';

    flightsGroupRef.current.addTo(map);
    flightTraceGroupRef.current.addTo(map);
    vesselsGroupRef.current.addTo(map);
    camerasGroupRef.current.addTo(map);
    eventsGroupRef.current.addTo(map);
    weatherGroupRef.current.addTo(map);
    wildfiresGroupRef.current.addTo(map);
    gbfsGroupRef.current.addTo(map);
    gtfsRtGroupRef.current.addTo(map);
    trafficFlowGroupRef.current.addTo(map);
    trafficIncidentsGroupRef.current.addTo(map);
    targetLockGroupRef.current.addTo(map);
    userLocationGroupRef.current.addTo(map);
    highlightGroupRef.current.addTo(map);
    routeGroupRef.current.addTo(map);

    map.on('click', async (e) => {
      if (!e || !e.latlng) return;
      const { lat: rawLat, lng: rawLng } = e.latlng;
      if (!isValidCoordinate(rawLat, rawLng)) return;
      const lat = Number(rawLat.toFixed(5));
      const lon = Number(rawLng.toFixed(5));

      const currentZoom = map.getZoom();
      let buildingData = null;
      if (currentZoom >= 15) {
        buildingData = await fetchBuildingFootprint(lat, lon);
      }

      if (buildingData) {
        const bldgName = buildingData.name || 'Structure Footprint';
        const bldgSubtitle = buildingData.height 
          ? `Building Height: ${buildingData.height}${buildingData.address ? ` • ${buildingData.address}` : ''}`
          : (buildingData.address ? `Address: ${buildingData.address}` : `OSM Building Structure Footprint`);

        if (highlightGroupRef.current && buildingData.geoJson) {
          const bldgLayer = L.geoJSON(buildingData.geoJson, {
            style: {
              color: '#f43f5e',
              weight: 3,
              dashArray: '3, 2',
              fillColor: '#f43f5e',
              fillOpacity: 0.3,
            },
            interactive: false,
          });
          highlightGroupRef.current.addLayer(bldgLayer);
        }

        onSelectTarget({
          kind: 'LOCATION',
          id: `BLDG-${lat}-${lon}`,
          title: `🏢 ${bldgName}`,
          subtitle: bldgSubtitle,
          lat: buildingData.lat || lat,
          lon: buildingData.lon || lon,
          data: {
            id: `BLDG-${lat}-${lon}`,
            label: bldgName,
            lat: buildingData.lat || lat,
            lon: buildingData.lon || lon,
            building: buildingData,
          },
        });
      } else {
        onSelectTarget({
          kind: 'LOCATION',
          id: `PIN-${lat}-${lon}`,
          title: `Location: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
          subtitle: `Coordinates: ${lat} N, ${lon} E`,
          lat,
          lon,
          data: {
            id: `PIN-${lat}-${lon}`,
            label: `Location Pin`,
            lat,
            lon,
          },
        });
      }
    });

    map.on('dragstart', () => {
      isTargetLockedRef.current = false;
      setIsTargetLocked(false);
    });

    // Track viewport zoom and bounds for dynamic level-of-detail culling
    const updateViewport = () => {
      const zoom = map.getZoom();
      const center = map.getCenter();
      setMapZoom(zoom);
      setMapMoveCount((c) => c + 1);
      onViewportChangeRef.current?.({ lat: center.lat, lon: center.lng, zoom });
    };

    map.on('zoomend', updateViewport);
    map.on('moveend', updateViewport);
    map.whenReady(updateViewport);

    mapInstanceRef.current = map;

    return () => {
      map.off('dragstart');
      map.off('zoomend', updateViewport);
      map.off('moveend', updateViewport);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeBaseLayerRef.current !== layers.satelliteLayer) {
      const oldLayer = baseLayersRef.current[activeBaseLayerRef.current];
      const newLayer = baseLayersRef.current[layers.satelliteLayer];

      if (oldLayer && map.hasLayer(oldLayer)) {
        map.removeLayer(oldLayer);
      }
      if (newLayer) {
        newLayer.addTo(map);
        if ('bringToBack' in newLayer && typeof (newLayer as any).bringToBack === 'function') {
          (newLayer as any).bringToBack();
        }
      }
      activeBaseLayerRef.current = layers.satelliteLayer;
    }
  }, [layers.satelliteLayer]);

  // Handle Center and Selected Target camera navigation
  const prevSelectedTargetIdRef = useRef<string | null>(null);
  const prevCenterCoordsRef = useRef<{ lat: number; lon: number; zoom: number } | null>(null);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedTarget) {
      // ONLY trigger flyTo when selecting a new target (ID changed), not on recurring position updates!
      if (selectedTarget.id !== prevSelectedTargetIdRef.current) {
        prevSelectedTargetIdRef.current = selectedTarget.id;
        const { lat, lon } = selectedTarget;
        if (isValidCoordinate(lat, lon)) {
          isFlyingToTargetRef.current = true;
          map.flyTo([lat, lon], 14, {
            duration: 0.8,
            easeLinearity: 0.25,
          });
          map.once('moveend', () => {
            isFlyingToTargetRef.current = false;
          });
        }
      }
    } else {
      prevSelectedTargetIdRef.current = null;
    }
  }, [selectedTarget?.id]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !centerCoordinates) return;

    const prev = prevCenterCoordsRef.current;
    if (
      !prev ||
      Math.abs(prev.lat - centerCoordinates.lat) > 1e-4 ||
      Math.abs(prev.lon - centerCoordinates.lon) > 1e-4 ||
      prev.zoom !== centerCoordinates.zoom
    ) {
      prevCenterCoordsRef.current = centerCoordinates;
      const { lat, lon, zoom } = centerCoordinates;
      if (isValidCoordinate(lat, lon)) {
        const targetZoom = typeof zoom === 'number' && !isNaN(zoom) && isFinite(zoom) ? zoom : 12;
        map.flyTo([lat, lon], targetZoom, {
          duration: 1.0,
          easeLinearity: 0.25,
        });
      }
    }
  }, [centerCoordinates]);

  // Render TomTom Street Traffic Flow & Incidents
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    trafficFlowGroupRef.current.clearLayers();
    trafficIncidentsGroupRef.current.clearLayers();

    if (layers.tomtomTraffic && settings?.tomTomApiKey?.trim()) {
      const apiKey = settings.tomTomApiKey.trim();
      const flowStyle = settings?.tomTomFlowStyle || 'relative';

      // TomTom Vehicle Traffic Tile Layer (proxied via server)
      const flowLayer = L.tileLayer(
        `/api/traffic/tile/flow/${flowStyle}/{z}/{x}/{y}.png?key=${encodeURIComponent(apiKey)}`,
        {
          maxZoom: 19,
          opacity: 0.85,
          attribution: '&copy; <a href="https://www.tomtom.com" target="_blank" rel="noreferrer">TomTom Traffic</a>',
        }
      );
      trafficFlowGroupRef.current.addLayer(flowLayer);

      // TomTom Incidents Tile Layer
      if (settings?.showTrafficIncidents !== false) {
        const incidentsLayer = L.tileLayer(
          `/api/traffic/tile/incidents/{z}/{x}/{y}.png?key=${encodeURIComponent(apiKey)}`,
          {
            maxZoom: 19,
            opacity: 0.85,
          }
        );
        trafficIncidentsGroupRef.current.addLayer(incidentsLayer);
      }
    }
  }, [layers.tomtomTraffic, settings?.tomTomApiKey, settings?.tomTomFlowStyle, settings?.showTrafficIncidents]);

  // Render Flights (with dynamic zoom-out thinning & persistent marker update)
  useEffect(() => {
    const group = flightsGroupRef.current;
    if (!layers.flights || !flights.length) {
      group.clearLayers();
      flightMarkersMapRef.current.clear();
      return;
    }

    const selectedId = selectedTarget?.kind === 'FLIGHT' ? selectedTarget.id : undefined;

    // Viewport bounds filtering (with 20% margin to prevent pop-in during panning)
    const bounds = mapInstanceRef.current ? mapInstanceRef.current.getBounds() : null;
    const paddedBounds = bounds ? bounds.pad(0.2) : null;
    const inViewport = paddedBounds
      ? flights.filter((flight) => {
          if (!isValidCoordinate(flight.latitude, flight.longitude)) return false;
          if (selectedId && flight.icao24 === selectedId) return true;
          return paddedBounds.contains([flight.latitude, flight.longitude]);
        })
      : flights.filter((flight) => isValidCoordinate(flight.latitude, flight.longitude));

    // When zoomed in close (zoom >= 6), show all planes in viewport
    let displayedFlights: FlightState[] = [];
    if (mapZoom >= 6) {
      displayedFlights = inViewport;
    } else {
      const cellSize = Math.max(0.2, 25 / Math.pow(1.8, mapZoom));
      const grid = new Map<string, FlightState>();

      const sorted = [...inViewport].sort((a, b) => {
        if (selectedId && a.icao24 === selectedId) return -1;
        if (selectedId && b.icao24 === selectedId) return 1;
        return (b.baroAltitude || 0) - (a.baroAltitude || 0);
      });

      for (const flight of sorted) {
        if (selectedId && flight.icao24 === selectedId) continue;
        const cellX = Math.floor(flight.longitude / cellSize);
        const cellY = Math.floor(flight.latitude / cellSize);
        const key = `${cellX}:${cellY}`;
        if (!grid.has(key)) {
          grid.set(key, flight);
        }
      }

      displayedFlights = Array.from(grid.values());

      if (selectedId) {
        const selFlight = flights.find((f) => f.icao24 === selectedId);
        if (selFlight && isValidCoordinate(selFlight.latitude, selFlight.longitude) && !displayedFlights.some((f) => f.icao24 === selectedId)) {
          displayedFlights.push(selFlight);
        }
      }
    }

    const displayedIds = new Set<string>();

    displayedFlights.forEach((flight) => {
      if (!isValidCoordinate(flight.latitude, flight.longitude)) return;
      displayedIds.add(flight.icao24);
      const isSelected = selectedTarget?.id === flight.icao24;
      const existing = flightMarkersMapRef.current.get(flight.icao24);

      if (existing) {
        existing.flight = flight;
        const reportedLat = flight.latitude;
        const reportedLon = flight.longitude;
        const reportedTrack = flight.trueTrack || 0;
        const reportedSpeedKnots = flight.velocity && !flight.onGround ? flight.velocity : 0;
        const reportedSpeedMs = reportedSpeedKnots * 0.514444;

        // Check if transponder has published an updated position fix (> 1m difference)
        const hasMoved = Math.hypot(
          (reportedLat - existing.targetLat) * 111320,
          (reportedLon - existing.targetLon) * 111320
        ) > 1.0;

        if (hasMoved) {
          existing.targetLat = reportedLat;
          existing.targetLon = reportedLon;
          existing.lastTargetUpdateTime = performance.now();
        }

        existing.targetTrack = reportedTrack;
        existing.targetSpeedMs = reportedSpeedMs;

        const isMil = isMilitaryFlight(flight);
        const html = renderFlightMarkerHtml(flight, existing.currentTrack, isSelected);
        const icon = L.divIcon({
          html,
          className: 'custom-flight-marker',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        existing.marker.setIcon(icon);
        existing.marker.setZIndexOffset(isSelected ? 1000 : (isMil ? 100 : 50));
      } else {
        const initialTrack = flight.trueTrack || 0;
        const initialSpeedMs = flight.velocity && !flight.onGround ? flight.velocity * 0.514444 : 0;
        const now = performance.now();
        const isMil = isMilitaryFlight(flight);

        const html = renderFlightMarkerHtml(flight, initialTrack, isSelected);

        const icon = L.divIcon({
          html,
          className: 'custom-flight-marker',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([flight.latitude, flight.longitude], { 
          icon, 
          zIndexOffset: isSelected ? 1000 : (isMil ? 100 : 50) 
        });
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          const currentFlight = flightMarkersMapRef.current.get(flight.icao24)?.flight || flight;
          const isHeli = isHelicopterFlight(currentFlight);
          const isCurrentMil = isMilitaryFlight(currentFlight);
          const categoryTitle = isCurrentMil 
            ? (isHeli ? 'Military Helicopter' : 'Military Aircraft')
            : (isHeli ? 'Helicopter' : 'Flight');
          onSelectTarget({
            kind: 'FLIGHT',
            id: currentFlight.icao24,
            title: `${categoryTitle} ${currentFlight.callsign || currentFlight.icao24}`,
            subtitle: `${getAircraftModelDisplay(currentFlight.aircraftModel)} • ${isCurrentMil ? 'Military' : getAircraftCountry(currentFlight)}`,
            lat: currentFlight.latitude,
            lon: currentFlight.longitude,
            data: currentFlight,
          });
        });

        flightMarkersMapRef.current.set(flight.icao24, {
          marker,
          flight,
          currentLat: flight.latitude,
          currentLon: flight.longitude,
          currentTrack: initialTrack,
          currentSpeedMs: initialSpeedMs,
          targetLat: flight.latitude,
          targetLon: flight.longitude,
          targetTrack: initialTrack,
          targetSpeedMs: initialSpeedMs,
          lastTargetUpdateTime: now,
        });
        group.addLayer(marker);
      }
    });

    flightMarkersMapRef.current.forEach((val, id) => {
      if (!displayedIds.has(id)) {
        group.removeLayer(val.marker);
        flightMarkersMapRef.current.delete(id);
      }
    });
  }, [flights, layers.flights, mapZoom, mapMoveCount, selectedTarget?.id]);

  // Build high-performance geospatial spatial index for CCTV cameras
  const superclusterIndex = useMemo(() => {
    const sc = new Supercluster<{
      cluster: boolean;
      camera: CCTVCamera;
      id: string;
    }>({
      radius: 65,
      maxZoom: 16,
      minPoints: 2,
    });

    const points = cameras
      .filter((cam) => isValidCoordinate(cam.lat, cam.lon))
      .map((cam) => ({
        type: 'Feature' as const,
        properties: {
          cluster: false,
          camera: cam,
          id: cam.id,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [cam.lon, cam.lat],
        },
      }));

    sc.load(points);
    return sc;
  }, [cameras]);

  // Render CCTV Cameras (Superclusters + Individual Feeds)
  useEffect(() => {
    const group = camerasGroupRef.current;
    group.clearLayers();
    if (!layers.cctv) return;

    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    const west = Math.max(-180, bounds.getWest());
    const south = Math.max(-85, bounds.getSouth());
    const east = Math.min(180, bounds.getEast());
    const north = Math.min(85, bounds.getNorth());

    const zoom = Math.floor(map.getZoom());
    const clusterFeatures = superclusterIndex.getClusters([west, south, east, north], zoom);

    // Track if currently selected camera is already rendered directly
    let selectedCameraRendered = false;

    // Separate clusters from individual cameras
    const clusterItems: any[] = [];
    const individualItems: Array<{ cam: CCTVCamera; lat: number; lon: number }> = [];

    clusterFeatures.forEach((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      if (!isValidCoordinate(lat, lon)) return;
      if (feature.properties.cluster) {
        clusterItems.push(feature);
      } else {
        const cam: CCTVCamera = (feature.properties as any).camera;
        if (cam && isValidCoordinate(cam.lat, cam.lon)) {
          individualItems.push({ cam, lat: cam.lat, lon: cam.lon });
        }
      }
    });

    // Render Clusters
    clusterItems.forEach((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      const clusterProps = feature.properties as { point_count: number; cluster_id: number };
      const pointCount = clusterProps.point_count;
      const clusterId = clusterProps.cluster_id;

      const formattedCount = pointCount >= 1000 ? `${(pointCount / 1000).toFixed(1)}k` : pointCount.toLocaleString();

      const html = `
        <div class="relative flex items-center justify-center select-none pointer-events-auto">
          <div class="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95" title="Cluster: ${pointCount.toLocaleString()} Cameras (Click to Zoom)">
            <div class="h-6 px-2.5 min-w-[32px] w-max whitespace-nowrap rounded-full bg-[#242424] hover:bg-[#2e2e2e] border border-[#3f3f46] hover:border-zinc-400 flex items-center justify-center gap-1.5 shadow-md">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-zinc-400 shrink-0 w-3 h-3 min-w-[12px] min-h-[12px]">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
              <span class="text-[11px] font-mono font-medium text-zinc-200 leading-none whitespace-nowrap shrink-0">${formattedCount}</span>
            </div>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: 'supercluster-cctv-marker',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lon], { icon, zIndexOffset: 200 + pointCount });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        const expansionZoom = Math.min(
          superclusterIndex.getClusterExpansionZoom(clusterId),
          18
        );
        if (isValidCoordinate(lat, lon)) {
          map.flyTo([lat, lon], expansionZoom, {
            animate: true,
            duration: 0.6,
            easeLinearity: 0.25,
          });
        }
      });

      group.addLayer(marker);
    });

    // Render Individual Cameras with Coordinate Collision Prevention
    const renderSingleCamera = (
      cam: CCTVCamera,
      renderLat: number,
      renderLon: number
    ) => {
      const isSelected = selectedTarget?.id === cam.id;
      if (isSelected) selectedCameraRendered = true;

      const hasViews = Boolean(cam.views && cam.views.length > 1);
      const viewCount = cam.views ? cam.views.length : 1;

      const html = `
        <div class="relative flex items-center justify-center select-none pointer-events-auto">
          <div class="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-115 flex items-center justify-center" title="${cam.name}${hasViews ? ` (${viewCount} camera angles)` : ''} • ${cam.city}">
            <div class="p-1 rounded-full shrink-0 relative ${
              isSelected 
                ? 'bg-white text-zinc-950 border border-white shadow-md' 
                : 'bg-[#242424] text-zinc-300 border border-[#383838] hover:border-zinc-400 hover:text-white shadow-sm'
            }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 w-3 h-3 min-w-[12px] min-h-[12px] block">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
              ${hasViews ? `
                <span class="absolute -top-1.5 -right-2 px-1 min-w-[13px] h-3.5 rounded-full bg-[#181818] border border-zinc-500 text-[8px] font-mono font-bold text-zinc-200 flex items-center justify-center leading-none shadow">
                  ${viewCount}
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: 'custom-cctv-marker',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([renderLat, renderLon], { icon, zIndexOffset: isSelected ? 1000 : 50 });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectTarget({
          kind: 'CCTV',
          id: cam.id,
          title: cam.name,
          subtitle: `${cam.agency} • ${cam.highway} • ${cam.city}`,
          lat: cam.lat,
          lon: cam.lon,
          data: cam,
        });
      });

      group.addLayer(marker);
    };

    // Group individual cameras that share the exact same coordinates (within ~2 meters)
    const coordBuckets = new Map<string, Array<{ cam: CCTVCamera; lat: number; lon: number }>>();
    individualItems.forEach((item) => {
      const key = `${item.lat.toFixed(5)},${item.lon.toFixed(5)}`;
      if (!coordBuckets.has(key)) coordBuckets.set(key, []);
      coordBuckets.get(key)!.push(item);
    });

    coordBuckets.forEach((bucket) => {
      if (bucket.length === 1) {
        renderSingleCamera(bucket[0].cam, bucket[0].lat, bucket[0].lon);
      } else {
        // Disperse overlapping cameras radially around the location so none are on top of each other!
        const centerPt = map.latLngToLayerPoint([bucket[0].lat, bucket[0].lon]);
        const radiusPx = bucket.length <= 3 ? 18 : bucket.length <= 6 ? 24 : 30;

        bucket.forEach((item, idx) => {
          const angle = (idx * 2 * Math.PI) / bucket.length - Math.PI / 2;
          const targetPt = L.point(
            centerPt.x + radiusPx * Math.cos(angle),
            centerPt.y + radiusPx * Math.sin(angle)
          );
          const displacedLatLng = map.layerPointToLatLng(targetPt);
          renderSingleCamera(item.cam, displacedLatLng.lat, displacedLatLng.lng);
        });
      }
    });

    // If currently selected target is a CCTV and not in direct features, render with high-priority lock
    if (selectedTarget && selectedTarget.kind === 'CCTV' && !selectedCameraRendered) {
      const selectedCam = cameras.find((c) => c.id === selectedTarget.id);
      if (selectedCam && isValidCoordinate(selectedCam.lat, selectedCam.lon)) {
        const html = `
          <div class="relative flex items-center justify-center select-none pointer-events-auto">
            <div class="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center">
              <div class="p-1.5 rounded-full bg-white text-zinc-950 border border-zinc-300 shadow-md shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="shrink-0 w-3.5 h-3.5 min-w-[14px] min-h-[14px] block">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
              </div>
            </div>
          </div>
        `;
        const icon = L.divIcon({
          html,
          className: 'custom-cctv-marker-selected',
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        const marker = L.marker([selectedCam.lat, selectedCam.lon], { icon, zIndexOffset: 1200 });
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectTarget({
            kind: 'CCTV',
            id: selectedCam.id,
            title: selectedCam.name,
            subtitle: `${selectedCam.agency} • ${selectedCam.highway} • ${selectedCam.city}`,
            lat: selectedCam.lat,
            lon: selectedCam.lon,
            data: selectedCam,
          });
        });
        group.addLayer(marker);
      }
    }
  }, [cameras, layers.cctv, selectedTarget, mapZoom, mapMoveCount, superclusterIndex]);

  // Render Maritime Vessels (with viewport bounds & spatial grid thinning & persistent marker update)
  useEffect(() => {
    const group = vesselsGroupRef.current;
    if (!layers.maritime || !vessels.length) {
      group.clearLayers();
      vesselMarkersMapRef.current.clear();
      return;
    }

    const selectedId = selectedTarget?.kind === 'VESSEL' ? selectedTarget.id : undefined;

    // Viewport bounds filtering (with 20% padding to prevent pop-in during panning)
    const bounds = mapInstanceRef.current ? mapInstanceRef.current.getBounds() : null;
    const paddedBounds = bounds ? bounds.pad(0.2) : null;
    const inViewport = paddedBounds
      ? vessels.filter((vessel) => {
          const lat = typeof vessel.currentLat === 'number' && !isNaN(vessel.currentLat) ? vessel.currentLat : vessel.lat;
          const lon = typeof vessel.currentLon === 'number' && !isNaN(vessel.currentLon) ? vessel.currentLon : vessel.lon;
          if (!isValidCoordinate(lat, lon)) return false;
          if (selectedId && String(vessel.mmsi) === selectedId) return true;
          return paddedBounds.contains([lat, lon]);
        })
      : vessels.filter((vessel) => {
          const lat = typeof vessel.currentLat === 'number' && !isNaN(vessel.currentLat) ? vessel.currentLat : vessel.lat;
          const lon = typeof vessel.currentLon === 'number' && !isNaN(vessel.currentLon) ? vessel.currentLon : vessel.lon;
          return isValidCoordinate(lat, lon);
        });

    // When zoomed in close (zoom >= 8), show all vessels in viewport
    let displayedVessels: MaritimeVessel[] = [];
    if (mapZoom >= 8) {
      displayedVessels = inViewport;
    } else {
      // Spatial grid thinning based on zoom level
      const cellSize = Math.max(0.4, 45 / Math.pow(1.85, mapZoom));
      const grid = new Map<string, MaritimeVessel>();

      // Sort prioritizing underway moving vessels (higher SOG) or selected target
      const sorted = [...inViewport].sort((a, b) => {
        if (selectedId && String(a.mmsi) === selectedId) return -1;
        if (selectedId && String(b.mmsi) === selectedId) return 1;
        return (b.sogKnots || 0) - (a.sogKnots || 0);
      });

      for (const vessel of sorted) {
        if (selectedId && String(vessel.mmsi) === selectedId) continue;
        const lat = typeof vessel.currentLat === 'number' && !isNaN(vessel.currentLat) ? vessel.currentLat : vessel.lat;
        const lon = typeof vessel.currentLon === 'number' && !isNaN(vessel.currentLon) ? vessel.currentLon : vessel.lon;
        const cellX = Math.floor(lon / cellSize);
        const cellY = Math.floor(lat / cellSize);
        const key = `${cellX}:${cellY}`;
        if (!grid.has(key)) {
          grid.set(key, vessel);
        }
      }

      displayedVessels = Array.from(grid.values());

      if (selectedId) {
        const selVessel = vessels.find((v) => String(v.mmsi) === selectedId);
        if (selVessel) {
          const lat = typeof selVessel.currentLat === 'number' && !isNaN(selVessel.currentLat) ? selVessel.currentLat : selVessel.lat;
          const lon = typeof selVessel.currentLon === 'number' && !isNaN(selVessel.currentLon) ? selVessel.currentLon : selVessel.lon;
          if (isValidCoordinate(lat, lon) && !displayedVessels.some((v) => String(v.mmsi) === selectedId)) {
            displayedVessels.push(selVessel);
          }
        }
      }
    }

    const displayedMmsi = new Set<string>();

    displayedVessels.forEach((vessel) => {
      const lat = typeof vessel.currentLat === 'number' && !isNaN(vessel.currentLat) ? vessel.currentLat : vessel.lat;
      const lon = typeof vessel.currentLon === 'number' && !isNaN(vessel.currentLon) ? vessel.currentLon : vessel.lon;
      if (!isValidCoordinate(lat, lon)) return;
      const mmsiStr = String(vessel.mmsi);
      displayedMmsi.add(mmsiStr);
      const isSelected = selectedTarget?.id === mmsiStr;
      const existing = vesselMarkersMapRef.current.get(mmsiStr);

      const sogKnots = typeof vessel.sogKnots === 'number' ? vessel.sogKnots : 0;
      const cogDeg = typeof vessel.cogDeg === 'number' ? vessel.cogDeg : 0;
      const speedMs = sogKnots * 0.51444;
      const now = performance.now();

      if (existing) {
        existing.vessel = vessel;
        const reportedCog = cogDeg;
        const reportedSpeedMs = speedMs;

        const hasMoved = Math.hypot(
          (lat - existing.targetLat) * 111320,
          (lon - existing.targetLon) * 111320
        ) > 1.0;

        if (hasMoved) {
          existing.targetLat = lat;
          existing.targetLon = lon;
          existing.lastTargetUpdateTime = performance.now();
        }

        existing.targetCog = reportedCog;
        existing.targetSpeedMs = reportedSpeedMs;

        const html = `
          <div class="cursor-pointer select-none transition-transform hover:scale-125 flex items-center justify-center ${
            isSelected ? 'scale-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]' : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]'
          }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#ffffff' : '#f0f0f0'}" stroke-width="2" style="transform: rotate(${Math.round(existing.currentCog)}deg);">
              <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
              <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
              <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
              <path d="M12 10v4"/>
              <path d="M12 2v3"/>
            </svg>
          </div>
        `;
        const icon = L.divIcon({
          html,
          className: 'custom-vessel-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        existing.marker.setIcon(icon);
        existing.marker.setZIndexOffset(isSelected ? 1000 : 50);
      } else {
        const now = performance.now();

        const html = `
          <div class="cursor-pointer select-none transition-transform hover:scale-125 flex items-center justify-center ${
            isSelected ? 'scale-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.95)]' : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]'
          }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#ffffff' : '#f0f0f0'}" stroke-width="2" style="transform: rotate(${Math.round(cogDeg)}deg);">
              <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
              <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
              <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/>
              <path d="M12 10v4"/>
              <path d="M12 2v3"/>
            </svg>
          </div>
        `;

        const icon = L.divIcon({
          html,
          className: 'custom-vessel-marker',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([lat, lon], { icon, zIndexOffset: isSelected ? 1000 : 50 });
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectTarget({
            kind: 'VESSEL',
            id: mmsiStr,
            title: `Vessel: ${vessel.name}`,
            subtitle: `${vessel.type} • MMSI ${vessel.mmsi} • ${vessel.destination}`,
            lat,
            lon,
            data: vessel,
          });
        });

        vesselMarkersMapRef.current.set(mmsiStr, {
          marker,
          vessel,
          currentLat: lat,
          currentLon: lon,
          currentCog: cogDeg,
          currentSpeedMs: speedMs,
          targetLat: lat,
          targetLon: lon,
          targetCog: cogDeg,
          targetSpeedMs: speedMs,
          lastTargetUpdateTime: now,
        });
        group.addLayer(marker);
      }
    });

    vesselMarkersMapRef.current.forEach((val, id) => {
      if (!displayedMmsi.has(id)) {
        group.removeLayer(val.marker);
        vesselMarkersMapRef.current.delete(id);
      }
    });
  }, [vessels, layers.maritime, selectedTarget?.id, mapZoom]);



  // Render Weather Events
  useEffect(() => {
    const group = weatherGroupRef.current;
    group.clearLayers();
    if (!layers.weather) return;

    let radarLayer;
    if (radarSource === 'nexrad') {
      radarLayer = L.tileLayer(
        'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
        {
          attribution: 'US NEXRAD Radar &copy; IEM',
          maxZoom: 19,
          opacity: radarOpacity,
          zIndex: 400,
        }
      );
    } else {
      const tileUrl = activeRadarFrame
        ? `${activeRadarFrame.host}${activeRadarFrame.path}/256/{z}/{x}/{y}/1/1_1.png`
        : 'https://api.librewxr.net/v2/radar/0/256/{z}/{x}/{y}/1/1_1.png';
      radarLayer = L.tileLayer(tileUrl, {
        attribution: 'Global Weather Radar &copy; LibreWXR / RainViewer',
        maxZoom: 19,
        opacity: radarOpacity,
        zIndex: 400,
      });
    }
    group.addLayer(radarLayer);

    if (weather && weather.length) {
      weather.forEach((event) => {
      if (!isValidCoordinate(event.lat, event.lon)) return;
      const isSelected = selectedTarget?.id === event.id;

      const html = `
        <div class="cursor-pointer select-none transition-transform hover:scale-110 flex items-center justify-center">
          <div class="p-1.5 rounded-full border shadow-md flex items-center justify-center ${
            isSelected
              ? 'bg-white text-zinc-950 border-white ring-2 ring-white scale-110'
              : 'bg-[#202020] border-[#383838] hover:border-zinc-400 text-zinc-300'
          }">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="${isSelected ? 'text-zinc-950' : 'text-zinc-400'}">
              <path d="M17.5 19c.7 0 1.2-.6 1.2-1.2c0-.9-1.2-1.8-1.2-1.8s-1.2.9-1.2 1.8c0 .6.5 1.2 1.2 1.2Z"/>
              <path d="M17.5 6V3"/>
              <path d="m20.6 8.1l2.1-1.2"/>
              <path d="m20.6 15.9l2.1 1.2"/>
              <path d="m14.4 8.1l-2.1-1.2"/>
              <path d="m14.4 15.9l-2.1 1.2"/>
              <path d="M12 12h.01"/>
              <path d="M16 12h.01"/>
              <path d="M20 12h.01"/>
              <path d="M12 16h.01"/>
              <path d="M16 16h.01"/>
              <path d="M20 16h.01"/>
            </svg>
          </div>
        </div>
      `;

      const icon = L.divIcon({ html, className: 'weather-marker', iconSize: [22, 22], iconAnchor: [11, 11] });
      const marker = L.marker([event.lat, event.lon], { icon, zIndexOffset: 1400 });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectTarget({ kind: 'EVENT', id: event.id, title: event.title, subtitle: `WEATHER EVENT`, lat: event.lat, lon: event.lon, data: event as any });
      });
      group.addLayer(marker);
    });
    }
  }, [weather, layers.weather, selectedTarget, onSelectTarget, radarSource, activeRadarFrame, radarOpacity]);

  // Build high-performance geospatial spatial index for wildfires
  const wildfireClusterIndex = useMemo(() => {
    const sc = new Supercluster<{
      cluster: boolean;
      event: GodsEyeEvent;
      id: string;
    }>({
      radius: 50,
      maxZoom: 16,
      minPoints: 2,
    });

    const points = wildfires
      .filter((event) => isValidCoordinate(event.lat, event.lon))
      .map((event) => ({
        type: 'Feature' as const,
        properties: {
          cluster: false,
          event: event,
          id: event.id,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [event.lon, event.lat],
        },
      }));

    sc.load(points);
    return sc;
  }, [wildfires]);

  // Render Wildfire Events (Superclusters + Individual Points)
  useEffect(() => {
    const group = wildfiresGroupRef.current;
    group.clearLayers();
    if (!layers.wildfires) return;

    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    const west = Math.max(-180, bounds.getWest());
    const south = Math.max(-85, bounds.getSouth());
    const east = Math.min(180, bounds.getEast());
    const north = Math.min(85, bounds.getNorth());

    const zoom = Math.floor(map.getZoom());
    const clusterFeatures = wildfireClusterIndex.getClusters([west, south, east, north], zoom);

    clusterFeatures.forEach((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      if (!isValidCoordinate(lat, lon)) return;
      const isCluster = Boolean(feature.properties.cluster);

      if (isCluster) {
        const clusterProps = feature.properties as { point_count: number; cluster_id: number };
        const pointCount = clusterProps.point_count;
        const clusterId = clusterProps.cluster_id;

        const html = `
          <div class="relative flex items-center justify-center select-none pointer-events-auto">
            <div class="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95" title="Cluster: ${pointCount.toLocaleString()} Wildfires">
              <div class="h-6 px-2.5 min-w-[32px] w-max whitespace-nowrap rounded-full bg-[#242424] hover:bg-[#2e2e2e] border border-[#3f3f46] hover:border-zinc-400 flex items-center justify-center gap-1.5 shadow-md">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-zinc-400 shrink-0">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/>
                </svg>
                <span class="text-[11px] font-mono font-medium text-zinc-200 leading-none">${pointCount}</span>
              </div>
            </div>
          </div>
        `;

        const icon = L.divIcon({ html, className: 'supercluster-wildfire-marker', iconSize: [0, 0], iconAnchor: [0, 0] });
        const marker = L.marker([lat, lon], { icon, zIndexOffset: 300 + pointCount });
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          const expansionZoom = Math.min(wildfireClusterIndex.getClusterExpansionZoom(clusterId), 18);
          map.flyTo([lat, lon], expansionZoom, { animate: true, duration: 0.6 });
        });
        group.addLayer(marker);
      } else {
        const event: GodsEyeEvent = (feature.properties as any).event;
        const isSelected = selectedTarget?.id === event.id;

        const html = `
          <div class="cursor-pointer select-none transition-transform hover:scale-110 flex items-center justify-center">
            <div class="p-1.5 rounded-full border shadow-md flex items-center justify-center ${
              isSelected
                ? 'bg-white text-zinc-950 border-white ring-2 ring-white scale-110'
                : 'bg-[#202020] border-[#383838] hover:border-zinc-400 text-zinc-300'
            }">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="${isSelected ? 'text-zinc-950' : 'text-zinc-400'}">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/>
              </svg>
            </div>
          </div>
        `;

        const icon = L.divIcon({ html, className: 'wildfire-marker', iconSize: [22, 22], iconAnchor: [11, 11] });
        const marker = L.marker([lat, lon], { icon, zIndexOffset: 1400 });
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectTarget({ kind: 'EVENT', id: event.id, title: event.title, subtitle: `WILDFIRE EVENT`, lat: event.lat, lon: event.lon, data: event as any });
        });
        group.addLayer(marker);
      }
    });
  }, [wildfires, layers.wildfires, selectedTarget, mapZoom, wildfireClusterIndex]);

  // GBFS Bikeshare Stations Supercluster Index
  const gbfsClusterIndex = useMemo(() => {
    const sc = new Supercluster<{
      cluster: boolean;
      station: GbfsStation;
      id: string;
    }>({
      radius: 45,
      maxZoom: 16,
      minPoints: 2,
    });

    const points = gbfsStations
      .filter((s) => isValidCoordinate(s.lat, s.lon) && (Math.abs(s.lat) >= 0.01 || Math.abs(s.lon) >= 0.01))
      .map((s) => ({
        type: 'Feature' as const,
        properties: {
          cluster: false,
          station: s,
          id: s.id,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [s.lon, s.lat],
        },
      }));

    sc.load(points);
    return sc;
  }, [gbfsStations]);

  // Render GBFS Bikeshare (Superclusters + Individual Stations)
  useEffect(() => {
    const group = gbfsGroupRef.current;
    group.clearLayers();
    if (!layers.gbfs || !gbfsStations.length) return;

    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    const west = Math.max(-180, bounds.getWest());
    const south = Math.max(-85, bounds.getSouth());
    const east = Math.min(180, bounds.getEast());
    const north = Math.min(85, bounds.getNorth());

    const zoom = Math.floor(map.getZoom());
    const clusterFeatures = gbfsClusterIndex.getClusters([west, south, east, north], zoom);

    clusterFeatures.forEach((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      if (!isValidCoordinate(lat, lon)) return;
      const isCluster = Boolean(feature.properties.cluster);

      if (isCluster) {
        const clusterProps = feature.properties as { point_count: number; cluster_id: number };
        const pointCount = clusterProps.point_count;
        const clusterId = clusterProps.cluster_id;

        const html = `
          <div class="relative flex items-center justify-center select-none pointer-events-auto">
            <div class="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95" title="Cluster: ${pointCount.toLocaleString()} Bikeshare Stations">
              <div class="h-6 px-2.5 min-w-[32px] w-max whitespace-nowrap rounded-full bg-[#242424] hover:bg-[#2e2e2e] border border-[#3f3f46] hover:border-zinc-400 flex items-center justify-center gap-1.5 shadow-md">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-zinc-400 shrink-0">
                  <circle cx="18.5" cy="17.5" r="3.5"/>
                  <circle cx="5.5" cy="17.5" r="3.5"/>
                  <circle cx="15" cy="5" r="1"/>
                  <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
                </svg>
                <span class="text-[11px] font-mono font-medium text-zinc-200 leading-none">${pointCount}</span>
              </div>
            </div>
          </div>
        `;

        const icon = L.divIcon({ html, className: 'supercluster-gbfs-marker', iconSize: [0, 0], iconAnchor: [0, 0] });
        const marker = L.marker([lat, lon], { icon, zIndexOffset: 300 + pointCount });
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          const expansionZoom = Math.min(gbfsClusterIndex.getClusterExpansionZoom(clusterId), 18);
          map.flyTo([lat, lon], expansionZoom, { animate: true, duration: 0.6 });
        });
        group.addLayer(marker);
      } else {
        const station: GbfsStation = (feature.properties as any).station;
        const isSelected = selectedTarget?.id === station.id;

        const html = `
          <div class="cursor-pointer select-none transition-transform hover:scale-110 flex items-center justify-center">
            <div class="px-2 py-0.5 rounded-full border shadow-md flex items-center gap-1.5 ${
              isSelected
                ? 'bg-white text-zinc-950 border-white ring-2 ring-white scale-110'
                : 'bg-[#202020] border-[#383838] hover:border-zinc-400 text-zinc-300'
            }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="${isSelected ? 'text-zinc-950' : 'text-zinc-400'} shrink-0">
                <circle cx="18.5" cy="17.5" r="3.5"/>
                <circle cx="5.5" cy="17.5" r="3.5"/>
                <circle cx="15" cy="5" r="1"/>
                <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
              </svg>
              <span class="text-[10px] font-mono font-medium ${isSelected ? 'text-zinc-950' : 'text-zinc-200'} leading-none">${station.numBikesAvailable}</span>
            </div>
          </div>
        `;

        const icon = L.divIcon({ html, className: 'gbfs-station-marker', iconSize: [0, 0], iconAnchor: [0, 0] });
        const marker = L.marker([lat, lon], { icon, zIndexOffset: 1250 });
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectTarget({
            kind: 'GBFS',
            id: station.id,
            title: station.name,
            subtitle: `${station.systemName} • ${station.numBikesAvailable} bikes / ${station.numDocksAvailable} docks`,
            lat: station.lat,
            lon: station.lon,
            data: station,
          });
        });
        group.addLayer(marker);
      }
    });
  }, [gbfsStations, layers.gbfs, selectedTarget, mapZoom, gbfsClusterIndex]);

  // Render GTFS-RT Realtime Vehicles (Buses, Subway, Trains, Trams) with 0.5s delayed live transition
  useEffect(() => {
    const group = gtfsRtGroupRef.current;
    if (!layers.gtfsRt || !gtfsRtVehicles.length) {
      group.clearLayers();
      transitMarkersMapRef.current.clear();
      return;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    const paddedBounds = bounds ? bounds.pad(0.2) : null;

    const displayedVehicles = gtfsRtVehicles.filter((v) => {
      if (!isValidCoordinate(v.lat, v.lon)) return false;
      if (selectedTarget?.kind === 'GTFS_RT' && selectedTarget.id === v.id) return true;
      return paddedBounds ? paddedBounds.contains([v.lat, v.lon]) : true;
    }).slice(0, 150);

    const displayedIds = new Set<string>();

    displayedVehicles.forEach((vehicle) => {
      displayedIds.add(vehicle.id);
      const isSelected = selectedTarget?.id === vehicle.id;
      const isTrain = vehicle.vehicleType === 'SUBWAY' || vehicle.vehicleType === 'TRAIN' || vehicle.vehicleType === 'TRAM';
      const existing = transitMarkersMapRef.current.get(vehicle.id);

      const html = `
        <div class="cursor-pointer select-none transition-transform hover:scale-110 flex items-center justify-center">
          <div class="px-2 py-0.5 rounded-md border shadow-md flex items-center gap-1.5 ${
            isSelected
              ? 'bg-white text-zinc-950 border-white ring-2 ring-white scale-110'
              : 'bg-[#1e1e1e] border-[#383838] hover:border-zinc-400 text-zinc-200'
          }">
            ${isTrain ? `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="${isSelected ? 'text-zinc-950' : 'text-zinc-400'} shrink-0">
                <rect width="16" height="16" x="4" y="3" rx="2"/>
                <path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>
              </svg>
            ` : `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="${isSelected ? 'text-zinc-950' : 'text-zinc-400'} shrink-0">
                <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
              </svg>
            `}
            <span class="text-[10px] font-medium font-mono ${isSelected ? 'text-zinc-950 font-bold' : 'text-zinc-200'} leading-none whitespace-nowrap">${vehicle.routeId}</span>
            ${typeof vehicle.bearing === 'number' ? `
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(${vehicle.bearing}deg);" class="${isSelected ? 'text-zinc-950' : 'text-zinc-400'} shrink-0">
                <polygon points="12 2 19 21 12 17 5 21 12 2"/>
              </svg>
            ` : ''}
          </div>
        </div>
      `;

      const icon = L.divIcon({ html, className: 'gtfs-rt-marker', iconSize: [0, 0], iconAnchor: [0, 0] });

      const now = performance.now();
      const bearing = vehicle.bearing || 0;
      const speedMs = vehicle.speed ? vehicle.speed : 0;

      if (existing) {
        existing.vehicle = vehicle;
        const hasMoved = Math.hypot(
          (vehicle.lat - existing.targetLat) * 111320,
          (vehicle.lon - existing.targetLon) * 111320
        ) > 1.0;

        if (hasMoved) {
          existing.targetLat = vehicle.lat;
          existing.targetLon = vehicle.lon;
          existing.lastTargetUpdateTime = performance.now();
        }

        existing.targetBearing = bearing;
        existing.targetSpeedMs = speedMs;

        existing.marker.setIcon(icon);
        existing.marker.setZIndexOffset(isSelected ? 1500 : 1350);
      } else {
        const marker = L.marker([vehicle.lat, vehicle.lon], { icon, zIndexOffset: isSelected ? 1500 : 1350 });
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectTarget({
            kind: 'GTFS_RT',
            id: vehicle.id,
            title: `${vehicle.agencyName} ${vehicle.routeId}`,
            subtitle: `${vehicle.vehicleType} • Unit: ${vehicle.label || vehicle.id} • ${formatVehicleStatus(vehicle.currentStatus)}`,
            lat: vehicle.lat,
            lon: vehicle.lon,
            data: vehicle,
          });
        });

        transitMarkersMapRef.current.set(vehicle.id, {
          marker,
          vehicle,
          currentLat: vehicle.lat,
          currentLon: vehicle.lon,
          currentBearing: vehicle.bearing,
          currentSpeedMs: speedMs,
          targetLat: vehicle.lat,
          targetLon: vehicle.lon,
          targetBearing: vehicle.bearing,
          targetSpeedMs: speedMs,
          lastTargetUpdateTime: now,
        });
        group.addLayer(marker);
      }
    });

    transitMarkersMapRef.current.forEach((val, id) => {
      if (!displayedIds.has(id)) {
        group.removeLayer(val.marker);
        transitMarkersMapRef.current.delete(id);
      }
    });
  }, [gtfsRtVehicles, layers.gtfsRt, selectedTarget?.id, mapZoom]);
  useEffect(() => {
    const group = targetLockGroupRef.current;
    group.clearLayers();
    selectionMarkerRef.current = null;
    if (!selectedTarget) return;

    const { lat, lon } = selectedTarget;
    if (!isValidCoordinate(lat, lon)) return;

    const html = `
      <div class="w-12 h-12 pointer-events-none select-none flex items-center justify-center">
        <div class="w-full h-full rounded-full border-2 border-white bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.4)] animate-pulse"></div>
      </div>
    `;

    const lockIcon = L.divIcon({
      html,
      className: 'selection-ring',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    const marker = L.marker([lat, lon], { icon: lockIcon, zIndexOffset: 2000 });
    selectionMarkerRef.current = marker;
    group.addLayer(marker);

    return () => {
      selectionMarkerRef.current = null;
    };
  }, [selectedTarget]);

  // Render Aircraft Flight Trace & Trajectory (Where it came from, airports & path taken)
  useEffect(() => {
    const group = flightTraceGroupRef.current;
    group.clearLayers();
    flightTraceLinesRef.current = null;

    if (!selectedTarget || selectedTarget.kind !== 'FLIGHT') {
      setActiveFlightTrace(null);
      setIsTraceLoading(false);
      return;
    }

    const flightData = selectedTarget.data as FlightState | undefined;
    const callsign = (flightData?.callsign || selectedTarget.title.replace(/^(Military\s+)?(Flight|Helicopter)\s+/i, '')).trim();
    const icao24 = selectedTarget.id;
    const currentLat = selectedTarget.lat;
    const currentLon = selectedTarget.lon;
    const track = flightData?.trueTrack;
    const alt = flightData?.baroAltitude;

    let isMounted = true;
    setIsTraceLoading(true);

    fetchFlightTrace(callsign, icao24, currentLat, currentLon, track, alt)
      .then((trace) => {
        if (!isMounted) return;
        setActiveFlightTrace(trace);
        setIsTraceLoading(false);

        // Clear previous trace layers
        group.clearLayers();
        flightTraceLinesRef.current = null;

        // 1. Build Flown Path Coordinates
        const flownLatLngs: Array<[number, number]> = [];
        if (trace.trail && trace.trail.length > 0) {
          trace.trail.forEach((pt) => {
            if (isValidCoordinate(pt.lat, pt.lon)) {
              flownLatLngs.push([pt.lat, pt.lon]);
            }
          });
        }

        // Ensure the current aircraft position is the endpoint
        if (isValidCoordinate(currentLat, currentLon)) {
          const last = flownLatLngs[flownLatLngs.length - 1];
          if (!last || Math.abs(last[0] - currentLat) > 0.0001 || Math.abs(last[1] - currentLon) > 0.0001) {
            flownLatLngs.push([currentLat, currentLon]);
          }
        }

        let outerLine: L.Polyline | null = null;
        let innerLine: L.Polyline | null = null;

        if (flownLatLngs.length >= 2) {
          // Tactical Trajectory Polyline (Clean, high-legibility zinc tone)
          outerLine = L.polyline(flownLatLngs, {
            color: '#a1a1aa',
            weight: 5,
            opacity: 0.25,
            lineCap: 'round',
            lineJoin: 'round',
          });
          group.addLayer(outerLine);

          // Tactical Inner Core Polyline
          innerLine = L.polyline(flownLatLngs, {
            color: '#d4d4d8',
            weight: 2,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          });
          group.addLayer(innerLine);
        }

        // 2. Origin Departure Marker
        if (trace.origin && isValidCoordinate(trace.origin.latitude, trace.origin.longitude)) {
          const originCode = formatAirportCode(trace.origin);
          const originCity = trace.origin.municipality || trace.origin.name;
          const originHtml = `
            <div class="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141414]/95 border border-[#383838] shadow-xl backdrop-blur-md cursor-pointer hover:border-zinc-400 hover:bg-[#1c1c1c] transition-all">
              <span class="w-2 h-2 rounded-full bg-zinc-300"></span>
              <span class="text-[10px] font-mono font-medium text-zinc-400">DEP</span>
              <span class="text-[11px] font-mono font-semibold text-zinc-100">${originCode}</span>
              <span class="text-[10px] text-zinc-400 max-w-[120px] truncate hidden sm:inline">${originCity}</span>
            </div>
          `;
          const originIcon = L.divIcon({
            html: originHtml,
            className: 'flight-origin-marker',
            iconSize: [0, 0],
            iconAnchor: [24, 16],
          });
          const originMarker = L.marker([trace.origin.latitude, trace.origin.longitude], {
            icon: originIcon,
            zIndexOffset: 1200,
          });
          originMarker.bindTooltip(
            `<div class="text-xs p-2 bg-[#141414] border border-[#2e2e2e] text-zinc-100 rounded-xl shadow-2xl space-y-1">
              <div class="text-zinc-300 font-semibold text-[11px]">DEPARTURE AIRPORT (ORIGIN)</div>
              <div class="font-medium text-zinc-100">${trace.origin.name} (${originCode})</div>
              <div class="text-zinc-400 text-[10px]">${trace.origin.municipality ? trace.origin.municipality + ', ' : ''}${trace.origin.countryName || ''}</div>
              ${typeof trace.distanceFlownKm === 'number' ? `<div class="text-zinc-300 text-[10px] pt-1 border-t border-zinc-800">Distance Flown: ${formatNauticalMiles(trace.distanceFlownKm)}</div>` : ''}
            </div>`,
            { direction: 'top', offset: [0, -14], className: 'tactical-map-tooltip' }
          );
          group.addLayer(originMarker);
        }

        // 3. Destination Arrival Marker & Planned Path
        let plannedLine: L.Polyline | undefined = undefined;
        if (trace.destination && isValidCoordinate(trace.destination.latitude, trace.destination.longitude)) {
          const destCode = formatAirportCode(trace.destination);
          const destCity = trace.destination.municipality || trace.destination.name;

          const plannedCoords = trace.plannedPath || (isValidCoordinate(currentLat, currentLon) 
            ? [[currentLat, currentLon], [trace.destination.latitude, trace.destination.longitude]] 
            : []);

          if (plannedCoords.length >= 2) {
            plannedLine = L.polyline(plannedCoords, {
              color: '#71717a',
              weight: 1.5,
              dashArray: '5, 7',
              opacity: 0.65,
              lineCap: 'round',
            });
            group.addLayer(plannedLine);
          }

          const destHtml = `
            <div class="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141414]/95 border border-[#383838] shadow-xl backdrop-blur-md cursor-pointer hover:border-zinc-400 hover:bg-[#1c1c1c] transition-all">
              <span class="w-2 h-2 rounded-full border border-zinc-400 bg-transparent"></span>
              <span class="text-[10px] font-mono font-medium text-zinc-400">ARR</span>
              <span class="text-[11px] font-mono font-semibold text-zinc-100">${destCode}</span>
              <span class="text-[10px] text-zinc-400 max-w-[120px] truncate hidden sm:inline">${destCity}</span>
            </div>
          `;
          const destIcon = L.divIcon({
            html: destHtml,
            className: 'flight-dest-marker',
            iconSize: [0, 0],
            iconAnchor: [24, 16],
          });
          const destMarker = L.marker([trace.destination.latitude, trace.destination.longitude], {
            icon: destIcon,
            zIndexOffset: 1200,
          });
          destMarker.bindTooltip(
            `<div class="text-xs p-2 bg-[#141414] border border-[#2e2e2e] text-zinc-100 rounded-xl shadow-2xl space-y-1">
              <div class="text-zinc-300 font-semibold text-[11px]">DESTINATION AIRPORT</div>
              <div class="font-medium text-zinc-100">${trace.destination.name} (${destCode})</div>
              <div class="text-zinc-400 text-[10px]">${trace.destination.municipality ? trace.destination.municipality + ', ' : ''}${trace.destination.countryName || ''}</div>
              ${typeof trace.distanceRemainingKm === 'number' ? `<div class="text-zinc-300 text-[10px] pt-1 border-t border-zinc-800">Remaining: ${formatNauticalMiles(trace.distanceRemainingKm)}</div>` : ''}
            </div>`,
            { direction: 'top', offset: [0, -14], className: 'tactical-map-tooltip' }
          );
          group.addLayer(destMarker);
        }

        if (outerLine && innerLine) {
          flightTraceLinesRef.current = {
            outer: outerLine,
            inner: innerLine,
            planned: plannedLine,
          };
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsTraceLoading(false);
        console.warn('Failed to load flight trace:', err);
      });

    return () => {
      isMounted = false;
      group.clearLayers();
      flightTraceLinesRef.current = null;
    };
  }, [selectedTarget?.id, selectedTarget?.kind]);

  const handleFitFlightRoute = () => {
    if (!mapInstanceRef.current || !activeFlightTrace) return;
    const coords: Array<[number, number]> = [];
    if (activeFlightTrace.origin && isValidCoordinate(activeFlightTrace.origin.latitude, activeFlightTrace.origin.longitude)) {
      coords.push([activeFlightTrace.origin.latitude, activeFlightTrace.origin.longitude]);
    }
    if (activeFlightTrace.destination && isValidCoordinate(activeFlightTrace.destination.latitude, activeFlightTrace.destination.longitude)) {
      coords.push([activeFlightTrace.destination.latitude, activeFlightTrace.destination.longitude]);
    }
    if (activeFlightTrace.trail) {
      activeFlightTrace.trail.forEach((pt) => {
        if (isValidCoordinate(pt.lat, pt.lon)) coords.push([pt.lat, pt.lon]);
      });
    }
    if (selectedTarget && isValidCoordinate(selectedTarget.lat, selectedTarget.lon)) {
      coords.push([selectedTarget.lat, selectedTarget.lon]);
    }
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: true });
    }
  };

  useEffect(() => {
    if (fitRouteTrigger && fitRouteTrigger > 0) {
      handleFitFlightRoute();
    }
  }, [fitRouteTrigger]);

  // Render User GPS Location Marker & Accuracy Circle
  useEffect(() => {
    const group = userLocationGroupRef.current;
    group.clearLayers();
    if (!userLocation || !isValidCoordinate(userLocation.lat, userLocation.lon)) return;

    // Accuracy Ring
    if (typeof userLocation.accuracy === 'number' && userLocation.accuracy > 0) {
      const circle = L.circle([userLocation.lat, userLocation.lon], {
        radius: userLocation.accuracy,
        color: '#71717a',
        fillColor: '#71717a',
        fillOpacity: 0.1,
        weight: 1,
        dashArray: '3,3',
      });
      group.addLayer(circle);
    }

    // Clean GPS Marker
    const html = `
      <div class="relative w-7 h-7 flex items-center justify-center select-none pointer-events-auto cursor-pointer" title="My Current Location">
        <div class="w-4 h-4 rounded-full bg-zinc-100 border-2 border-zinc-900 shadow-md z-10 flex items-center justify-center">
          <div class="w-1.5 h-1.5 rounded-full bg-zinc-900"></div>
        </div>
      </div>
    `;

    const icon = L.divIcon({ html, className: 'user-gps-location-marker', iconSize: [32, 32], iconAnchor: [16, 16] });
    const marker = L.marker([userLocation.lat, userLocation.lon], { icon, zIndexOffset: 3000 });
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      onSelectTarget({
        kind: 'LOCATION',
        id: 'USER_CURRENT_LOCATION',
        title: 'My Current Location',
        subtitle: `GPS Fix: ${userLocation.lat.toFixed(4)}°, ${userLocation.lon.toFixed(4)}° • Accuracy: ±${Math.round(userLocation.accuracy || 0)}m`,
        lat: userLocation.lat,
        lon: userLocation.lon,
        data: {
          id: 'USER_CURRENT_LOCATION',
          label: 'My Current GPS Location',
          lat: userLocation.lat,
          lon: userLocation.lon,
        },
      });
    });
    group.addLayer(marker);
  }, [userLocation]);

  // Render Tactical Highlights (Multiple persistent shapes, tracing exact GeoJSON/Polygons with no popups)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = highlightGroupRef.current;
    group.clearLayers();

    const highlightsToRender: MapHighlight[] = activeHighlights && activeHighlights.length > 0 
      ? activeHighlights 
      : (activeHighlight ? [activeHighlight] : []);

    if (highlightsToRender.length === 0) return;

    highlightsToRender.forEach((item, index) => {
      const accentColor = item.color || '#06b6d4';

      // 1. Draw Real GeoJSON Boundary (MultiPolygon / Polygon)
      if (item.geoJson) {
        const geoLayer = L.geoJSON(item.geoJson, {
          style: {
            color: accentColor,
            weight: 2.5,
            dashArray: '4, 2',
            fillColor: accentColor,
            fillOpacity: 0.18,
          },
          interactive: false,
        });
        group.addLayer(geoLayer);
      }
      // 2. Draw Boundary Polygon coordinates (if provided)
      else if (item.polygon && item.polygon.length > 2) {
        const poly = L.polygon(item.polygon, {
          color: accentColor,
          weight: 2.5,
          dashArray: '4, 2',
          fillColor: accentColor,
          fillOpacity: 0.18,
          interactive: false,
        });
        group.addLayer(poly);
      }
      // 3. Draw Bounding Box Rectangle (if provided)
      else if (item.bounds) {
        const boundsRect = L.rectangle(item.bounds, {
          color: accentColor,
          weight: 2,
          dashArray: '6, 4',
          fillColor: accentColor,
          fillOpacity: 0.14,
          interactive: false,
        });
        group.addLayer(boundsRect);
      }
      // 4. Draw Radius Circle (if provided and no explicit polygon)
      else if (item.radiusKm) {
        const circle = L.circle([item.lat, item.lon], {
          radius: item.radiusKm * 1000,
          color: accentColor,
          weight: 2,
          dashArray: '6, 4',
          fillColor: accentColor,
          fillOpacity: 0.1,
          interactive: false,
        });
        group.addLayer(circle);
      }

      // 5. Draw Building Badge Callout Pin if category is BUILDING or has height
      if (item.category === 'BUILDING' || item.stats?.height) {
        const html = `
          <div class="select-none pointer-events-none flex flex-col items-center -translate-x-1/2 -translate-y-full pb-1">
            <div class="px-2.5 py-1 rounded-md bg-[#18181b]/95 border border-[#f43f5e] shadow-[0_0_15px_rgba(244,63,94,0.5)] text-[#f43f5e] flex items-center gap-1.5 backdrop-blur-md">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="shrink-0">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                <path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/>
              </svg>
              <span class="text-[11px] font-mono font-bold tracking-wide text-white whitespace-nowrap">${item.name}</span>
            </div>
            ${item.stats?.height ? `<span class="text-[9px] font-mono font-medium text-rose-300 bg-zinc-950/90 px-1.5 py-0.5 rounded border border-rose-900/60 mt-1 shadow-sm">${item.stats.height}</span>` : ''}
          </div>
        `;
        const icon = L.divIcon({ html, className: 'building-pin-badge', iconSize: [0, 0], iconAnchor: [0, 0] });
        const bldgMarker = L.marker([item.lat, item.lon], { icon, zIndexOffset: 2500 });
        group.addLayer(bldgMarker);
      }
    });

    // Smoothly fly camera to latest highlighted sector
    const latest = highlightsToRender[highlightsToRender.length - 1];
    if (map && latest) {
      isFlyingToTargetRef.current = true;
      if (latest.bounds) {
        map.flyToBounds(latest.bounds, { padding: [50, 50], maxZoom: Math.max(latest.zoom, 4), duration: 1.5 });
      } else {
        map.flyTo([latest.lat, latest.lon], latest.zoom, { duration: 1.5 });
      }
      setTimeout(() => {
        isFlyingToTargetRef.current = false;
      }, 1600);
    }
  }, [activeHighlights, activeHighlight]);

  // Render active walking route path & endpoint markers
  useEffect(() => {
    const group = routeGroupRef.current;
    const map = mapInstanceRef.current;
    if (!group) return;

    group.clearLayers();

    if (!walkingRoute || !walkingRoute.coordinates || walkingRoute.coordinates.length === 0) {
      return;
    }

    // 1. Draw outer contrast casing line
    const casing = L.polyline(walkingRoute.coordinates, {
      color: '#121212',
      weight: 6,
      opacity: 0.8,
      interactive: false,
    });
    group.addLayer(casing);

    // 2. Draw main pedestrian route polyline in clean tactical zinc with dashed pattern
    const polyline = L.polyline(walkingRoute.coordinates, {
      color: '#e4e4e7',
      weight: 3.5,
      dashArray: '6, 6',
      opacity: 0.9,
      interactive: false,
    });
    group.addLayer(polyline);

    // 3. Start Endpoint Marker (Tactical Dark Badge)
    const startHtml = `
      <div class="select-none pointer-events-none flex flex-col items-center -translate-x-1/2 -translate-y-full pb-1">
        <div class="px-2.5 py-1 rounded-md bg-[#181818]/95 border border-[#383838] shadow-md text-zinc-100 flex items-center gap-1.5 backdrop-blur-md">
          <span class="w-2 h-2 rounded-full bg-zinc-100"></span>
          <span class="text-xs font-semibold text-zinc-100 whitespace-nowrap">START: ${walkingRoute.fromName}</span>
        </div>
      </div>
    `;
    const startIcon = L.divIcon({ html: startHtml, className: 'route-start-pin', iconSize: [0, 0], iconAnchor: [0, 0] });
    const startMarker = L.marker([walkingRoute.fromCoords.lat, walkingRoute.fromCoords.lon], { icon: startIcon, zIndexOffset: 3000 });
    group.addLayer(startMarker);

    // 4. Destination Endpoint Marker (Tactical Dark Badge)
    const endHtml = `
      <div class="select-none pointer-events-none flex flex-col items-center -translate-x-1/2 -translate-y-full pb-1">
        <div class="px-2.5 py-1 rounded-md bg-[#181818]/95 border border-[#383838] shadow-md text-zinc-300 flex items-center gap-1.5 backdrop-blur-md">
          <span class="w-2 h-2 rounded-full bg-zinc-400"></span>
          <span class="text-xs font-semibold text-zinc-300 whitespace-nowrap">DEST: ${walkingRoute.toName}</span>
        </div>
      </div>
    `;
    const endIcon = L.divIcon({ html: endHtml, className: 'route-end-pin', iconSize: [0, 0], iconAnchor: [0, 0] });
    const endMarker = L.marker([walkingRoute.toCoords.lat, walkingRoute.toCoords.lon], { icon: endIcon, zIndexOffset: 3000 });
    group.addLayer(endMarker);

    // 5. Fit map bounds to encompass walking route
    if (map) {
      isFlyingToTargetRef.current = true;
      const bounds = L.latLngBounds(walkingRoute.coordinates);
      map.flyToBounds(bounds, { padding: [70, 70], maxZoom: 16, duration: 1.5 });
      setTimeout(() => {
        isFlyingToTargetRef.current = false;
      }, 1600);
    }
  }, [walkingRoute]);

  if (layers.is3DGlobe) {
    return (
      <GodsEyeGlobe3D
        flights={flights}
        vessels={vessels}
        cameras={cameras}
        events={events}
        weather={weather}
        wildfires={wildfires}
        gbfsStations={gbfsStations}
        gtfsRtVehicles={gtfsRtVehicles}
        selectedTarget={selectedTarget}
        onSelectTarget={onSelectTarget}
        layers={layers}
        centerCoordinates={centerCoordinates}
        onClose3D={() => onToggleLayer?.('is3DGlobe')}
      />
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#121212]">
      {/* 2D Flat Map (Leaflet) */}
      <div 
        id="gods-eye-map" 
        ref={mapContainerRef} 
        className="w-full h-full z-0 opacity-100" 
      />

      {/* Target Tracking Lock HUD Badge */}
      {selectedTarget && (selectedTarget.kind === 'FLIGHT' || selectedTarget.kind === 'VESSEL' || selectedTarget.kind === 'GTFS_RT') && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-3.5 py-1.5 bg-[#181818]/95 border border-[#2e2e2e] rounded-full shadow-2xl backdrop-blur-md text-xs text-zinc-200">
          <span className="font-medium text-zinc-100">
            {isTargetLocked ? 'Locked On' : 'Tracking Off'}
          </span>
          <button
            onClick={() => {
              const nextState = !isTargetLocked;
              setIsTargetLocked(nextState);
              isTargetLockedRef.current = nextState;
              if (nextState && mapInstanceRef.current) {
                let targetCoord: [number, number] | null = null;
                if (selectedTarget.kind === 'FLIGHT') {
                  const item = flightMarkersMapRef.current.get(selectedTarget.id);
                  if (item) targetCoord = [item.currentLat, item.currentLon];
                } else if (selectedTarget.kind === 'VESSEL') {
                  const item = vesselMarkersMapRef.current.get(selectedTarget.id);
                  if (item) targetCoord = [item.currentLat, item.currentLon];
                } else if (selectedTarget.kind === 'GTFS_RT') {
                  const item = transitMarkersMapRef.current.get(selectedTarget.id);
                  if (item) {
                    targetCoord = [item.currentLat, item.currentLon];
                  } else {
                    const veh = gtfsRtVehicles.find((v) => v.id === selectedTarget.id);
                    if (veh) targetCoord = [veh.lat, veh.lon];
                  }
                }
                if (targetCoord && isValidCoordinate(targetCoord[0], targetCoord[1])) {
                  mapInstanceRef.current.panTo(targetCoord, { animate: true });
                }
              }
            }}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer border bg-[#282828] hover:bg-[#333333] text-zinc-200 border-[#383838]"
          >
            {isTargetLocked ? 'Release Lock' : 'Lock On'}
          </button>
        </div>
      )}
    </div>
  );
};
