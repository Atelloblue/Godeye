import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TacticalHeader } from './components/TacticalHeader';
import { GodsEyeMap } from './components/GodsEyeMap';
import { LayerControlPanel } from './components/LayerControlPanel';
import { TargetTelemetryDrawer } from './components/TargetTelemetryDrawer';
import { CCTVStreamViewer } from './components/CCTVStreamViewer';
import { SettingsModal } from './components/SettingsModal';
import { VoiceCommandSpark } from './components/VoiceCommandSpark';
import { LocationIntelCard, UserLocation } from './components/LocationIntelCard';
import { RadarTimelineHUD, RadarFrame } from './components/RadarTimelineHUD';
import { WikipediaIntelCard } from './components/WikipediaIntelCard';
import { WalkingRouteHUD } from './components/WalkingRouteHUD';
import { findNearestIntel, calculateDistanceKm } from './utils/geoUtils';
import { HIGHLIGHT_COLORS, resolveHighlightWithShape } from './utils/geoBoundaries';
import { fetchWikipediaSummary, WikiSummaryResult } from './utils/wikiApi';
import { fetchWalkingRoute, WalkingRoute } from './utils/walkingRouteApi';
import { 
  FlightState, 
  MaritimeVessel, 
  CCTVCamera, 
  GodsEyeEvent,
  SelectedTarget, 
  LayerVisibility, 
  LayerType, 
  FeedStatusInfo,
  AppSettings,
  GbfsStation,
  GtfsRtVehicle,
  MapHighlight
} from './types';


const DEFAULT_SETTINGS: AppSettings = {
  flightRangeKm: 0,
  aisStreamApiKey: '',
  tomTomApiKey: '',
  tomTomFlowStyle: 'relative',
  showTrafficIncidents: true,
  pollIntervalSec: 1.5,
  altitudeUnit: 'feet',
  speedUnit: 'knots',
  maxPlanesOnMap: 5000,
};

function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem('godseye_app_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
      };
    }
  } catch {
    // Ignore error
  }
  return DEFAULT_SETTINGS;
}

export default function App() {
  // Application Settings with LocalStorage persistence
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Live Feed Data State
  const [flights, setFlights] = useState<FlightState[]>([]);
  const [vessels, setVessels] = useState<MaritimeVessel[]>([]);
  const [cameras, setCameras] = useState<CCTVCamera[]>([]);
  const [weather, setWeather] = useState<GodsEyeEvent[]>([]);
  const [wildfires, setWildfires] = useState<GodsEyeEvent[]>([]);
  const [gbfsStations, setGbfsStations] = useState<GbfsStation[]>([]);
  const [gtfsRtVehicles, setGtfsRtVehicles] = useState<GtfsRtVehicle[]>([]);
  const [feedStatuses, setFeedStatuses] = useState<FeedStatusInfo[]>([]);

  // Interactive Target / UI State
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>(null);
  const [activeHighlights, setActiveHighlights] = useState<MapHighlight[]>([]);
  const [centerCoordinates, setCenterCoordinates] = useState<{ lat: number; lon: number; zoom: number }>({
    lat: 37.7749,
    lon: -122.4194,
    zoom: 12,
  });
  const [currentViewport, setCurrentViewport] = useState<{ lat: number; lon: number; zoom: number }>({
    lat: 37.7749,
    lon: -122.4194,
    zoom: 12,
  });
  const debounceFlightFetchRef = useRef<any>(null);
  // Client-side aircraft static metadata cache (preserves callsign, model, country, reg)
  const planeStaticCacheRef = useRef<Map<string, { callsign?: string; aircraftModel?: string; originCountry?: string; reg?: string; isMilitary?: boolean; isHelicopter?: boolean }>>(new Map());
  const [fitRouteTrigger, setFitRouteTrigger] = useState<number>(0);

  const handleAddHighlight = useCallback((newHighlight: MapHighlight) => {
    setActiveHighlights((prev) => {
      const color = newHighlight.color || HIGHLIGHT_COLORS[prev.length % HIGHLIGHT_COLORS.length];
      const withColor = { ...newHighlight, color };
      const filtered = prev.filter((h) => h.id !== newHighlight.id && h.name.toLowerCase() !== newHighlight.name.toLowerCase());
      return [...filtered, withColor];
    });
  }, []);

  const handleClearHighlights = useCallback((targetIdOrName?: string) => {
    if (!targetIdOrName) {
      setActiveHighlights([]);
    } else {
      const q = targetIdOrName.trim().toLowerCase();
      setActiveHighlights((prev) =>
        prev.filter((h) => {
          const hName = h.name.toLowerCase();
          const hId = h.id.toLowerCase();
          const matches = hName.includes(q) || q.includes(hName) || hId.includes(q) || q.includes(hId);
          return !matches;
        })
      );
    }
  }, []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [wikiIntelData, setWikiIntelData] = useState<WikiSummaryResult | null>(null);
  const [walkingRoute, setWalkingRoute] = useState<WalkingRoute | null>(null);
  const [isCctvWallOpen, setIsCctvWallOpen] = useState<boolean>(false);
  const [locationPopoverPos, setLocationPopoverPos] = useState<{ top: number; right: number } | null>(null);

  const handleWikiSearch = useCallback(async (query: string) => {
    if (!query || !query.trim()) return;

    // Check if query is a walking path request e.g. "walk from Times Square to Central Park"
    const matchRoute = query.match(/(?:walk|walking|route|path|walking path|walking route|footpath)\s*(?:from|between)?\s+(.+?)\s+(?:to|and)\s+(.+)/i);
    if (matchRoute) {
      const fromP = matchRoute[1].replace(/^(from|the|a|an)\s+/gi, '').trim();
      const toP = matchRoute[2].replace(/^(to|the|a|an)\s+/gi, '').trim();
      if (fromP && toP) {
        const { route } = await fetchWalkingRoute(fromP, toP);
        if (route) {
          setWalkingRoute(route);
          return;
        }
      }
    }

    const data = await fetchWikipediaSummary(query);
    if (data) {
      setWikiIntelData(data);
      const shape = await resolveHighlightWithShape(data.title) || await resolveHighlightWithShape(query);
      if (shape && (shape.lat !== 0 || shape.lon !== 0)) {
        handleAddHighlight(shape);
        setCenterCoordinates({ lat: shape.lat, lon: shape.lon, zoom: shape.zoom || 12 });
      } else if (data.coordinates) {
        setCenterCoordinates({ lat: data.coordinates.lat, lon: data.coordinates.lon, zoom: 12 });
      }
    }
  }, [handleAddHighlight]);

  // Custom Pinned CCTV cameras state
  const [pinnedCamIds, setPinnedCamIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('godseye_pinned_cctvs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const handleTogglePin = useCallback((camId: string) => {
    setPinnedCamIds((prev) => {
      const updated = prev.includes(camId) ? prev.filter((id) => id !== camId) : [...prev, camId];
      try {
        localStorage.setItem('godseye_pinned_cctvs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // User Geolocation & Auto-Connect State
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState<boolean>(false);
  const [isAutoLockNearest, setIsAutoLockNearest] = useState<boolean>(true);
  const watchIdRef = useRef<number | null>(null);
  const locationPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCenteredInitialLocationRef = useRef<boolean>(false);

  // Layer switches state
  const [layers, setLayers] = useState<LayerVisibility>({
    satelliteLayer: 'satellite',
    flights: true,
    maritime: false,
    cctv: true,
    weather: false,
    wildfires: false,
    gbfs: false,
    gtfsRt: false,
    targetLabels: false,
    tomtomTraffic: false,
    is3DGlobe: false,
  });

  // Radar timeline & composite states
  const [radarSource, setRadarSource] = useState<'nexrad' | 'global'>('global');
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(false);
  const [radarOpacity, setRadarOpacity] = useState<number>(0.5);
  const [isRadarLoading, setIsRadarLoading] = useState<boolean>(false);

  // Sync / Loop radar frames playback
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRadarPlaying && radarFrames.length > 0) {
      interval = setInterval(() => {
        setCurrentFrameIndex((prev) => {
          if (prev >= radarFrames.length - 1) {
            return 0; // wrap around
          }
          return prev + 1;
        });
      }, 1500); // 1.5s is standard weather looping speed
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRadarPlaying, radarFrames]);

  // Fetch radar timeline metadata when weather is activated
  useEffect(() => {
    if (!layers.weather) {
      setIsRadarPlaying(false);
      return;
    }

    let isMounted = true;
    const fetchTimeline = async () => {
      setIsRadarLoading(true);
      try {
        const res = await fetch('https://api.librewxr.net/public/weather-maps.json');
        if (!res.ok) throw new Error('Failed to fetch LibreWXR metadata');
        const data = await res.json();
        const host = data.host || 'https://api.librewxr.net';
        
        const pastFrames = (data.radar?.past || []).map((frame: any, idx: number, arr: any[]) => {
          const minutesAgo = (arr.length - 1 - idx) * 10;
          return {
            time: frame.time,
            path: frame.path,
            isForecast: false,
            label: minutesAgo === 0 ? 'LIVE' : `-${minutesAgo}m`,
            host,
          };
        });
        
        let nowcastFrames = (data.radar?.nowcast || []).slice(0, 6).map((frame: any, idx: number) => {
          const minutesForward = (idx + 1) * 10;
          return {
            time: frame.time,
            path: frame.path,
            isForecast: true,
            label: `+${minutesForward}m (F)`,
            host,
          };
        });

        // Ensure we have up to 6 frames (60 minutes / 1 hour) of genuine active future coverage
        if (nowcastFrames.length < 6) {
          const lastValidFrame = nowcastFrames.length > 0 ? nowcastFrames[nowcastFrames.length - 1] : null;
          const lastTime = lastValidFrame ? lastValidFrame.time : Math.floor(Date.now() / 1000);
          const lastPath = lastValidFrame ? lastValidFrame.path : '/v2/radar/0';

          const startIdx = nowcastFrames.length;
          for (let i = startIdx + 1; i <= 6; i++) {
            const minutesForward = i * 10;
            const extrapolatedTime = lastTime + (i - startIdx) * 600;
            nowcastFrames.push({
              time: extrapolatedTime,
              path: lastPath,
              isForecast: true,
              label: `+${minutesForward}m (F)`,
              host,
            });
          }
        }
        
        const combined = [...pastFrames, ...nowcastFrames];
        if (isMounted) {
          setRadarFrames(combined);
          // Default to latest past ('LIVE') frame
          const liveIndex = pastFrames.length > 0 ? pastFrames.length - 1 : 0;
          setCurrentFrameIndex(liveIndex);
        }
      } catch (error) {
        console.error('Error fetching radar timeline:', error);
        // Fallback: Create mock frames matching UTC timestamps
        const mockHost = 'https://api.librewxr.net';
        const now = Math.floor(Date.now() / 1000);
        const frames: RadarFrame[] = [];
        for (let i = 6; i >= 0; i--) {
          const t = now - (i * 600);
          frames.push({
            time: t,
            path: `/v2/radar/0`, // Safe fallback path that always resolves to latest on server
            isForecast: false,
            label: i === 0 ? 'LIVE' : `-${i * 10}m`,
            host: mockHost,
          });
        }
        for (let i = 1; i <= 6; i++) {
          const t = now + (i * 600);
          frames.push({
            time: t,
            path: `/v2/radar/0`, // Safe fallback path to prevent 404
            isForecast: true,
            label: `+${i * 10}m (F)`,
            host: mockHost,
          });
        }
        if (isMounted) {
          setRadarFrames(frames);
          setCurrentFrameIndex(6); // index of LIVE frame
        }
      } finally {
        if (isMounted) setIsRadarLoading(false);
      }
    };

    fetchTimeline();

    return () => {
      isMounted = false;
    };
  }, [layers.weather]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('godseye_app_settings', JSON.stringify(newSettings));
    } catch {
      // Ignore
    }
  };

  // Enriches flights with cached static data (callsign, model, country, reg) and unloads planes outside the viewport when zoomed in
  const enrichAndFilterFlights = useCallback((rawStates: FlightState[], vpLat: number, vpLon: number, zoom: number): FlightState[] => {
    const cache = planeStaticCacheRef.current;
    const enriched = rawStates.map((f) => {
      const hex = (f.icao24 || '').toLowerCase().trim();
      if (!hex) return f;
      let meta = cache.get(hex);
      if (!meta) {
        meta = {};
        cache.set(hex, meta);
      }

      // Preserve callsign if not a generic placeholder
      if (f.callsign && f.callsign !== 'RADAR_CONTACT') {
        meta.callsign = f.callsign;
      } else if (meta.callsign) {
        f.callsign = meta.callsign;
      }

      // Preserve aircraft model
      if (f.aircraftModel && f.aircraftModel !== 'Commercial / Transport' && f.aircraftModel !== 'Rotorcraft') {
        meta.aircraftModel = f.aircraftModel;
      } else if (meta.aircraftModel) {
        f.aircraftModel = meta.aircraftModel;
      }

      // Preserve origin country
      if (f.originCountry) {
        meta.originCountry = f.originCountry;
      } else if (meta.originCountry) {
        f.originCountry = meta.originCountry;
      }

      if (f.isMilitary !== undefined) meta.isMilitary = f.isMilitary;
      if (f.isHelicopter !== undefined) meta.isHelicopter = f.isHelicopter;

      return f;
    });

    // Viewport Culling Optimization: When zoomed in (zoom >= 6), prune planes outside visible boundary + 40% margin
    if (zoom >= 6) {
      const maxDistanceKm = Math.max(25, (40000 / Math.pow(2, zoom)) * 1.4);
      const selectedId = selectedTarget?.kind === 'FLIGHT' ? selectedTarget.id : undefined;

      return enriched.filter((flight) => {
        if (selectedId && flight.icao24 === selectedId) return true;
        if (typeof flight.latitude !== 'number' || typeof flight.longitude !== 'number') return false;
        const d = calculateDistanceKm(vpLat, vpLon, flight.latitude, flight.longitude);
        return d <= maxDistanceKm;
      });
    }

    return enriched;
  }, [selectedTarget?.id, selectedTarget?.kind]);

  // Fetch worldwide flight telemetry for a given coordinate or current active viewport
  const fetchFlights = useCallback(async (lat?: number, lon?: number) => {
    try {
      const targetLat = lat ?? (isTrackingLocation && userLocation ? userLocation.lat : currentViewport.lat);
      const targetLon = lon ?? (isTrackingLocation && userLocation ? userLocation.lon : currentViewport.lon);
      const zoom = currentViewport.zoom;

      const params = new URLSearchParams();
      params.append('lat', targetLat.toFixed(2));
      params.append('lon', targetLon.toFixed(2));
      params.append('dist', '250');
      params.append('zoom', zoom.toFixed(1));
      if (selectedTarget?.kind === 'FLIGHT' && selectedTarget.id) {
        params.append('selectedHex', selectedTarget.id);
      }

      const url = `/api/flights?${params.toString()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.states)) {
          const finalFlights = enrichAndFilterFlights(data.states, targetLat, targetLon, zoom);
          setFlights(finalFlights);
        }
      }
    } catch (e) {
      console.warn('Flight feed sync issue', e);
    }
  }, [currentViewport.lat, currentViewport.lon, currentViewport.zoom, enrichAndFilterFlights, isTrackingLocation, selectedTarget?.id, selectedTarget?.kind, userLocation]);

  const handleViewportChange = useCallback((vp: { lat: number; lon: number; zoom: number }) => {
    setCurrentViewport(vp);
    clearTimeout(debounceFlightFetchRef.current);
    debounceFlightFetchRef.current = setTimeout(() => {
      fetchFlights(vp.lat, vp.lon);
    }, 400);
  }, [fetchFlights]);

  // Fetch high-frequency live tracking feeds (Flights, GTFS-RT Transit, Maritime)
  const fetchLiveFeeds = useCallback(async () => {
    const lat = (isTrackingLocation && userLocation) ? userLocation.lat : currentViewport.lat;
    const lon = (isTrackingLocation && userLocation) ? userLocation.lon : currentViewport.lon;
    const zoom = currentViewport.zoom;

    const flightParams = new URLSearchParams();
    flightParams.append('lat', lat.toFixed(2));
    flightParams.append('lon', lon.toFixed(2));
    flightParams.append('dist', '250');
    flightParams.append('zoom', zoom.toFixed(1));
    if (selectedTarget?.kind === 'FLIGHT' && selectedTarget.id) {
      flightParams.append('selectedHex', selectedTarget.id);
    }

    const maritimeUrl = settings.aisStreamApiKey ? `/api/maritime?apiKey=${encodeURIComponent(settings.aisStreamApiKey)}` : '/api/maritime';

    try {
      const [flightsRes, vesselsRes, gtfsRtRes] = await Promise.allSettled([
        fetch(`/api/flights?${flightParams.toString()}`).then((r) => r.json()),
        fetch(maritimeUrl).then((r) => r.json()),
        fetch('/api/gtfs-rt').then((r) => r.json()),
      ]);

      if (flightsRes.status === 'fulfilled' && Array.isArray(flightsRes.value?.states)) {
        const finalFlights = enrichAndFilterFlights(flightsRes.value.states, lat, lon, zoom);
        setFlights(finalFlights);
      }
      if (vesselsRes.status === 'fulfilled' && Array.isArray(vesselsRes.value?.vessels)) {
        setVessels(vesselsRes.value.vessels);
      }
      if (gtfsRtRes.status === 'fulfilled' && Array.isArray(gtfsRtRes.value?.vehicles)) {
        setGtfsRtVehicles(gtfsRtRes.value.vehicles);
      }
    } catch (e) {
      console.warn('Live feed synchronization issue', e);
    }
  }, [currentViewport.lat, currentViewport.lon, currentViewport.zoom, enrichAndFilterFlights, isTrackingLocation, selectedTarget?.id, selectedTarget?.kind, settings.aisStreamApiKey, userLocation]);

  // Fetch low-frequency static/environmental feeds (CCTV, Weather, Wildfires, GBFS, System Status)
  const fetchEnvironmentalFeeds = useCallback(async () => {
    try {
      const [cctvRes, weatherRes, wildfireRes, gbfsRes, statusRes] = await Promise.allSettled([
        fetch('/api/cctv').then((r) => r.json()),
        fetch('/api/weather').then((r) => r.json()),
        fetch('/api/wildfires').then((r) => r.json()),
        fetch('/api/gbfs').then((r) => r.json()),
        fetch('/api/feed-status').then((r) => r.json()),
      ]);

      if (cctvRes.status === 'fulfilled' && Array.isArray(cctvRes.value?.cameras)) {
        setCameras(cctvRes.value.cameras);
      }
      if (weatherRes.status === 'fulfilled' && Array.isArray(weatherRes.value?.events)) {
        setWeather(weatherRes.value.events);
      }
      if (wildfireRes.status === 'fulfilled' && Array.isArray(wildfireRes.value?.events)) {
        setWildfires(wildfireRes.value.events);
      }
      if (gbfsRes.status === 'fulfilled' && Array.isArray(gbfsRes.value?.stations)) {
        setGbfsStations(gbfsRes.value.stations);
      }
      if (statusRes.status === 'fulfilled' && Array.isArray(statusRes.value?.feeds)) {
        setFeedStatuses(statusRes.value.feeds);
      }
    } catch (e) {
      console.warn('Environmental feed sync issue', e);
    }
  }, []);

  const fetchAllFeeds = useCallback(async () => {
    await Promise.allSettled([fetchLiveFeeds(), fetchEnvironmentalFeeds()]);
  }, [fetchLiveFeeds, fetchEnvironmentalFeeds]);

  // Polling Lifecycles: Rapid live tracking loop + standard environmental loop
  useEffect(() => {
    fetchLiveFeeds();
    fetchEnvironmentalFeeds();

    // Fast live telemetry polling (1.5s - 2s by default)
    const liveIntervalMs = Math.max(1000, (settings.pollIntervalSec || 2) * 1000);
    const liveInterval = setInterval(() => {
      fetchLiveFeeds();
    }, liveIntervalMs);

    // Slower environmental feeds polling (every 30 seconds)
    const envInterval = setInterval(() => {
      fetchEnvironmentalFeeds();
    }, 30000);

    return () => {
      clearInterval(liveInterval);
      clearInterval(envInterval);
    };
  }, [fetchEnvironmentalFeeds, fetchLiveFeeds, settings.pollIntervalSec]);

  // Synchronize selected target position with fresh API data
  useEffect(() => {
    if (!selectedTarget) return;
    if (selectedTarget.kind === 'FLIGHT') {
      const match = flights.find((f) => f.icao24 === selectedTarget.id);
      if (match && (match.latitude !== selectedTarget.lat || match.longitude !== selectedTarget.lon)) {
        setSelectedTarget((prev) => (prev ? { ...prev, lat: match.latitude, lon: match.longitude, data: match } : null));
      }
    } else if (selectedTarget.kind === 'GTFS_RT') {
      const match = gtfsRtVehicles.find((v) => v.id === selectedTarget.id);
      if (match && (match.lat !== selectedTarget.lat || match.lon !== selectedTarget.lon)) {
        setSelectedTarget((prev) => (prev ? { ...prev, lat: match.lat, lon: match.lon, data: match } : null));
      }
    }
  }, [flights, gtfsRtVehicles, selectedTarget?.id, selectedTarget?.kind]);

  // Filtered targets based on search query
  const filteredFlights = useMemo(() => {
    if (!searchQuery) return flights;
    const q = searchQuery.toLowerCase().trim();
    const matched = flights.filter(
      (f) =>
        f.callsign.toLowerCase().includes(q) ||
        f.icao24.toLowerCase().includes(q) ||
        f.originCountry.toLowerCase().includes(q) ||
        (f.aircraftModel && f.aircraftModel.toLowerCase().includes(q))
    );
    // If user searched for a geographic place/city (e.g. "Denver", "Texas") where no callsign matches,
    // do not clear out all planes so the zoomed-in region continues to show its active air traffic!
    return matched.length > 0 ? matched : flights;
  }, [flights, searchQuery]);

  const filteredCameras = useMemo(() => {
    if (!searchQuery) return cameras;
    const q = searchQuery.toLowerCase();
    return cameras.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.highway.toLowerCase().includes(q) ||
        (c.agency && c.agency.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q)
    );
  }, [cameras, searchQuery]);

  const filteredVessels = useMemo(() => {
    if (!searchQuery) return vessels;
    const q = searchQuery.toLowerCase();
    return vessels.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        String(v.mmsi).includes(q) ||
        v.destination.toLowerCase().includes(q)
    );
  }, [vessels, searchQuery]);

  const filteredGbfs = useMemo(() => {
    if (!searchQuery) return gbfsStations;
    const q = searchQuery.toLowerCase();
    return gbfsStations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.systemName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [gbfsStations, searchQuery]);

  const filteredGtfsRt = useMemo(() => {
    if (!searchQuery) return gtfsRtVehicles;
    const q = searchQuery.toLowerCase();
    return gtfsRtVehicles.filter(
      (v) =>
        v.routeId.toLowerCase().includes(q) ||
        v.agencyName.toLowerCase().includes(q) ||
        (v.label && v.label.toLowerCase().includes(q)) ||
        v.id.toLowerCase().includes(q)
    );
  }, [gtfsRtVehicles, searchQuery]);

  // Handlers
  const handleToggleLayer = (layer: keyof LayerVisibility) => {
    setLayers((prev) => {
      return { ...prev, [layer]: !prev[layer] };
    });
  };

  const handleChangeBaseLayer = (layer: LayerType) => {
    setLayers((prev) => ({ ...prev, satelliteLayer: layer }));
  };

  const handleTeleport = (lat: number, lon: number, zoom: number) => {
    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) return;
    const targetZoom = typeof zoom === 'number' && !isNaN(zoom) ? zoom : 12;
    setCenterCoordinates({ lat, lon, zoom: targetZoom });
    fetchFlights(lat, lon);
  };

  const handleSelectTarget = (target: SelectedTarget | null) => {
    if (!target) {
      setSelectedTarget(null);
      return;
    }
    if (typeof target.lat !== 'number' || typeof target.lon !== 'number' || isNaN(target.lat) || isNaN(target.lon)) {
      return;
    }
    setSelectedTarget(target);
    setCenterCoordinates({
      lat: target.lat,
      lon: target.lon,
      zoom: 14,
    });
  };

  const handleSelectCameraFromList = (cam: CCTVCamera) => {
    if (typeof cam.lat !== 'number' || typeof cam.lon !== 'number' || isNaN(cam.lat) || isNaN(cam.lon)) return;
    setCenterCoordinates({ lat: cam.lat, lon: cam.lon, zoom: 16 });
    setSelectedTarget({
      kind: 'CCTV',
      id: cam.id,
      title: cam.name,
      subtitle: `${cam.agency} • ${cam.highway} • ${cam.city}`,
      lat: cam.lat,
      lon: cam.lon,
      data: cam,
    });
  };

  // Start/Stop Geolocation Tracking with continuous polling
  const startLocationTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation is not supported by your browser.');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (locationPollIntervalRef.current !== null) {
      clearInterval(locationPollIntervalRef.current);
      locationPollIntervalRef.current = null;
    }

    setIsTrackingLocation(true);

    const handlePos = (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lon, accuracy, heading, speed } = pos.coords;
      setUserLocation({
        lat,
        lon,
        accuracy: accuracy || 0,
        heading: heading || undefined,
        speed: speed || undefined,
        timestamp: pos.timestamp,
      });

      // Recenter to user's real location on the very first fix
      if (!hasCenteredInitialLocationRef.current) {
        hasCenteredInitialLocationRef.current = true;
        setCenterCoordinates((prev) => ({ ...prev, lat, lon }));
      }
    };

    // Watch position with highest accuracy and zero caching
    const watchId = navigator.geolocation.watchPosition(
      handlePos,
      (err) => {
        console.warn('Geolocation watch notice:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
    watchIdRef.current = watchId;

    // Continuous active polling: ask location recurringly so coordinates update all the time
    navigator.geolocation.getCurrentPosition(
      handlePos,
      (err) => console.debug('Initial location poll notice:', err.message),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 8000,
      }
    );

    locationPollIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        handlePos,
        (err) => console.debug('Continuous location poll notice:', err.message),
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 8000,
        }
      );
    }, 1500);
  }, []);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (locationPollIntervalRef.current !== null) {
      clearInterval(locationPollIntervalRef.current);
      locationPollIntervalRef.current = null;
    }
    setIsTrackingLocation(false);
    setUserLocation(null);
  }, []);

  // Clean up location tracking on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, [stopLocationTracking]);

  const handleToggleTrackLocation = useCallback(() => {
    if (isTrackingLocation) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  }, [isTrackingLocation, startLocationTracking, stopLocationTracking]);

  const handleRecenterUser = useCallback(() => {
    if (userLocation) {
      setCenterCoordinates({ lat: userLocation.lat, lon: userLocation.lon, zoom: 15 });
    }
  }, [userLocation]);

  // Compute Nearest Infrastructure Intel based on User Location
  const nearestIntel = useMemo(() => {
    if (!userLocation) {
      return { camera: null, bikeStation: null, transitVehicle: null, flight: null, vessel: null, event: null };
    }
    return findNearestIntel(
      userLocation.lat,
      userLocation.lon,
      cameras,
      gbfsStations,
      gtfsRtVehicles,
      flights,
      vessels
    );
  }, [userLocation, cameras, gbfsStations, gtfsRtVehicles, flights, vessels]);

  // Auto-connect to nearest camera when user moves or nearest camera changes
  const lastAutoLockedCamIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (isTrackingLocation && isAutoLockNearest && userLocation && nearestIntel.camera) {
      const cam = nearestIntel.camera.cam;
      if (cam.id !== lastAutoLockedCamIdRef.current) {
        lastAutoLockedCamIdRef.current = cam.id;
        handleSelectCameraFromList(cam);
      }
    }
  }, [isTrackingLocation, isAutoLockNearest, userLocation, nearestIntel.camera]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#121212] text-zinc-100 flex flex-col select-none font-sans">
      {/* Top Header */}
      <TacticalHeader
        stats={{
          flights: flights.length,
          vessels: vessels.length,
          cameras: cameras.length,
          weather: weather.length,
          wildfires: wildfires.length,
          gbfs: gbfsStations.length,
          gtfsRt: gtfsRtVehicles.length,
        }}
        layers={layers}
        onToggleLayer={handleToggleLayer}
        onChangeBaseLayer={handleChangeBaseLayer}
        onTeleport={handleTeleport}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCctvWall={() => setIsCctvWallOpen(true)}
        isTrackingLocation={isTrackingLocation}
        onToggleTrackLocation={handleToggleTrackLocation}
        onLocationBtnPosChange={setLocationPopoverPos}
      />

      {/* Main Viewport (Tactical Map) */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <GodsEyeMap
          flights={filteredFlights}
          vessels={filteredVessels}
          cameras={filteredCameras}
          weather={weather}
          wildfires={wildfires}
          gbfsStations={filteredGbfs}
          gtfsRtVehicles={filteredGtfsRt}
          selectedTarget={selectedTarget}
          onSelectTarget={handleSelectTarget}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          centerCoordinates={centerCoordinates}
          settings={settings}
          userLocation={userLocation}
          radarSource={radarSource}
          activeRadarFrame={radarFrames[currentFrameIndex] || null}
          radarOpacity={radarOpacity}
          activeHighlights={activeHighlights}
          walkingRoute={walkingRoute}
          fitRouteTrigger={fitRouteTrigger}
          onViewportChange={handleViewportChange}
        />

        {/* Live Weather Playback Slider HUD */}
        <RadarTimelineHUD
          isVisible={!!layers.weather}
          radarSource={radarSource}
          onRadarSourceChange={setRadarSource}
          frames={radarFrames}
          currentFrameIndex={currentFrameIndex}
          onFrameIndexChange={setCurrentFrameIndex}
          isPlaying={isRadarPlaying}
          onTogglePlay={() => setIsRadarPlaying((prev) => !prev)}
          radarOpacity={radarOpacity}
          onOpacityChange={setRadarOpacity}
          isLoading={isRadarLoading}
        />

        {/* Live User Location & Nearest CCTV Auto-Connect HUD */}
        <LocationIntelCard
          userLocation={userLocation}
          isTracking={isTrackingLocation}
          isAutoLockNearest={isAutoLockNearest}
          intel={nearestIntel}
          onToggleTracking={handleToggleTrackLocation}
          onToggleAutoLock={() => setIsAutoLockNearest((prev) => !prev)}
          onRecenterUser={handleRecenterUser}
          onSelectCamera={handleSelectCameraFromList}
          onSelectTarget={handleSelectTarget}
          onClose={stopLocationTracking}
          popoverPos={locationPopoverPos}
        />

        {/* Floating Layers & Search Panel */}
        <LayerControlPanel
          layers={layers}
          settings={settings}
          onToggleLayer={handleToggleLayer}
          onChangeBaseLayer={handleChangeBaseLayer}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCctvWall={() => setIsCctvWallOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onWikiSearch={handleWikiSearch}
        />

        {/* Target Details Drawer */}
        <TargetTelemetryDrawer
          target={selectedTarget}
          onClose={() => setSelectedTarget(null)}
          allCameras={cameras}
          onSelectCamera={handleSelectCameraFromList}
          settings={settings}
          pinnedCamIds={pinnedCamIds}
          onTogglePin={handleTogglePin}
          onFitRoute={() => setFitRouteTrigger(Date.now())}
        />

        {/* Wikipedia Intel Floating Card */}
        <WikipediaIntelCard
          wikiData={wikiIntelData}
          onClose={() => {
            if (wikiIntelData) {
              handleClearHighlights(wikiIntelData.title);
            }
            setWikiIntelData(null);
          }}
          onTeleportToLocation={(lat, lon) => setCenterCoordinates({ lat, lon, zoom: 12 })}
        />

        {/* Multi-CCTV Wall Modal */}
        <CCTVStreamViewer
          cameras={cameras}
          isOpen={isCctvWallOpen}
          onClose={() => setIsCctvWallOpen(false)}
          onSelectCameraOnMap={handleSelectCameraFromList}
          pinnedCamIds={pinnedCamIds}
          onTogglePin={(camId, e) => {
            e.stopPropagation();
            handleTogglePin(camId);
          }}
        />

        {/* System & Feeds Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
        />

        {/* Active Pedestrian Walking Path HUD */}
        <WalkingRouteHUD
          route={walkingRoute}
          onClose={() => setWalkingRoute(null)}
          onRecenterRoute={() => {
            if (walkingRoute && walkingRoute.coordinates.length > 0) {
              setCenterCoordinates({
                lat: walkingRoute.fromCoords.lat,
                lon: walkingRoute.fromCoords.lon,
                zoom: 14,
              });
            }
          }}
        />

        {/* Floating Spark Voice Command Overlay */}
        <VoiceCommandSpark
          onTeleport={(lat, lon, zoom) => handleTeleport(lat, lon, zoom)}
          onSelectTarget={setSelectedTarget}
          onToggleLayer={handleToggleLayer}
          onChangeBaseLayer={handleChangeBaseLayer}
          layers={layers}
          flights={filteredFlights}
          cameras={filteredCameras}
          vessels={filteredVessels}
          gbfsStations={filteredGbfs}
          gtfsRtVehicles={filteredGtfsRt}
          activeHighlights={activeHighlights}
          onAddHighlight={handleAddHighlight}
          onClearHighlights={handleClearHighlights}
          onSelectWikiIntel={setWikiIntelData}
          onSetWalkingRoute={setWalkingRoute}
        />
      </main>

    </div>
  );
}

