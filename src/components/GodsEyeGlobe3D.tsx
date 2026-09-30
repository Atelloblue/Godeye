import React, { useEffect, useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { 
  _GlobeView as BaseGlobeView, 
  _GlobeViewport as GlobeViewport, 
  WebMercatorViewport 
} from '@deck.gl/core';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer, IconLayer } from '@deck.gl/layers';
import Supercluster from 'supercluster';
import { 
  FlightState, 
  MaritimeVessel, 
  CCTVCamera, 
  GodsEyeEvent, 
  SelectedTarget, 
  LayerVisibility, 
  GbfsStation,
  GtfsRtVehicle
} from '../types';
import { isMilitaryFlight, isHelicopterFlight } from '../utils/flightClassification';

// Polyfill WebMercatorViewport with getZoomAnchorStrength to prevent Deck.gl crash on high zoom levels in GlobeView
const proto = WebMercatorViewport?.prototype as any;
if (proto && !proto.getZoomAnchorStrength) {
  proto.getZoomAnchorStrength = function () {
    return 0;
  };
}

// Custom GlobeView subclass that always returns GlobeViewport to maintain the 3D spherical rendering at all zooms
class GlobeView extends BaseGlobeView {
  getViewportType() {
    return GlobeViewport;
  }
}

interface GodsEyeGlobe3DProps {
  flights: FlightState[];
  vessels: MaritimeVessel[];
  cameras: CCTVCamera[];
  events?: GodsEyeEvent[];
  weather?: GodsEyeEvent[];
  wildfires?: GodsEyeEvent[];
  gbfsStations?: GbfsStation[];
  gtfsRtVehicles?: GtfsRtVehicle[];
  selectedTarget: SelectedTarget | null;
  onSelectTarget: (target: SelectedTarget) => void;
  layers: LayerVisibility;
  centerCoordinates: { lat: number; lon: number; zoom: number } | null;
  onClose3D?: () => void;
}

// Robust coordinate validation to prevent WebGL positions array crash
const isValidCoordinates = (lat: any, lon: any): boolean => {
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
};

export const GodsEyeGlobe3D: React.FC<GodsEyeGlobe3DProps> = ({
  flights,
  vessels,
  cameras,
  events = [],
  weather = [],
  wildfires = [],
  gbfsStations = [],
  gtfsRtVehicles = [],
  selectedTarget,
  onSelectTarget,
  layers,
  centerCoordinates,
  onClose3D,
}) => {
  const [viewState, setViewState] = useState({
    longitude: centerCoordinates?.lon || -99.9,
    latitude: centerCoordinates?.lat || 31.9,
    zoom: centerCoordinates?.zoom ? Math.max(0.5, centerCoordinates.zoom - 3) : 1.8,
    pitch: 25,
    bearing: 0,
    maxZoom: 20,
    minZoom: 0,
    minPitch: 0,
    maxPitch: 85,
  });

  // Clamp zoom level for Supercluster index queries to strictly [0, 18] to avoid range errors at zoom extremes
  const zoom = Math.max(0, Math.min(18, Math.floor(viewState.zoom)));

  // Sync camera position when centerCoordinates updates (e.g. search / teleport)
  useEffect(() => {
    if (centerCoordinates) {
      setViewState((prev) => ({
        ...prev,
        longitude: centerCoordinates.lon,
        latitude: centerCoordinates.lat,
        zoom: Math.max(0.5, centerCoordinates.zoom - 2),
      }));
    }
  }, [centerCoordinates]);

  // Determine base map tile URLs based on active layer setting
  const tileUrls = useMemo(() => {
    switch (layers.satelliteLayer) {
      case 'hybrid':
        return [
          'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        ];
      case 'dark_tactical':
        return [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        ];
      case 'topographic':
        return [
          'https://mt0.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          'https://mt2.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          'https://mt3.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
        ];
      case 'satellite':
      default:
        return [
          'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        ];
    }
  }, [layers.satelliteLayer]);

  // 1. Spherical 3D Globe TileLayer
  const globeTileLayer = new TileLayer({
    id: `globe-tile-layer-${layers.satelliteLayer}`,
    data: tileUrls,
    minZoom: 0,
    maxZoom: 19,
    tileSize: 256,
    renderSubLayers: (props: any) => {
      const {
        bbox: { west, south, east, north },
      } = props.tile;
      return new BitmapLayer(props, {
        data: undefined,
        image: props.data,
        bounds: [west, south, east, north],
      });
    },
  });

  // --- Static SVG String Cache to avoid texture overhead crashes on WebGL ---
  const cachedIcons = useMemo(() => {
    const flightCivilian = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#f0f0f0" stroke="#000000" stroke-width="0.75"/>
      </svg>
    `;
    const flightCivilianSelected = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#ffffff" stroke="#000000" stroke-width="1.0"/>
      </svg>
    `;
    const flightMilitary = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#f97316" stroke="#000000" stroke-width="0.75"/>
      </svg>
    `;
    const flightMilitarySelected = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#f97316" stroke="#ffffff" stroke-width="1.25"/>
      </svg>
    `;

    const heliCivilian = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <line x1="6" y1="7.5" x2="6" y2="13.5" stroke="#f0f0f0" stroke-width="0.9" stroke-linecap="round"/>
        <line x1="18" y1="7.5" x2="18" y2="13.5" stroke="#f0f0f0" stroke-width="0.9" stroke-linecap="round"/>
        <line x1="6" y1="9.5" x2="9.5" y2="9.5" stroke="#f0f0f0" stroke-width="0.8"/>
        <line x1="14.5" y1="9.5" x2="18" y2="9.5" stroke="#f0f0f0" stroke-width="0.8"/>
        <path d="M12 3.5 C10.2 3.5 9 5.5 9 8.5 L9 11.5 C9 13 10.5 14 11 15 L11 20.5 L12 21.5 L13 20.5 L13 15 C13.5 14 15 13 15 11.5 L15 8.5 C15 5.5 13.8 3.5 12 3.5 Z" fill="#f0f0f0" stroke="#000000" stroke-width="0.75"/>
        <line x1="9" y1="16.5" x2="15" y2="16.5" stroke="#f0f0f0" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M8.5 20.2 H12 V21.7 H8.5 Z" fill="#f0f0f0" stroke="#000000" stroke-width="0.5"/>
        <rect x="2" y="8.7" width="20" height="1.6" rx="0.8" fill="#f0f0f0" stroke="#000000" stroke-width="0.5"/>
        <circle cx="12" cy="9.5" r="1.8" fill="#000000"/>
        <circle cx="12" cy="9.5" r="1" fill="#f0f0f0"/>
      </svg>
    `;
    const heliCivilianSelected = heliCivilian.replace(/#f0f0f0/g, '#ffffff');

    const heliMilitary = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <line x1="6" y1="7.5" x2="6" y2="13.5" stroke="#f97316" stroke-width="0.9" stroke-linecap="round"/>
        <line x1="18" y1="7.5" x2="18" y2="13.5" stroke="#f97316" stroke-width="0.9" stroke-linecap="round"/>
        <line x1="6" y1="9.5" x2="9.5" y2="9.5" stroke="#f97316" stroke-width="0.8"/>
        <line x1="14.5" y1="9.5" x2="18" y2="9.5" stroke="#f97316" stroke-width="0.8"/>
        <path d="M12 3.5 C10.2 3.5 9 5.5 9 8.5 L9 11.5 C9 13 10.5 14 11 15 L11 20.5 L12 21.5 L13 20.5 L13 15 C13.5 14 15 13 15 11.5 L15 8.5 C15 5.5 13.8 3.5 12 3.5 Z" fill="#f97316" stroke="#000000" stroke-width="0.75"/>
        <line x1="9" y1="16.5" x2="15" y2="16.5" stroke="#f97316" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M8.5 20.2 H12 V21.7 H8.5 Z" fill="#f97316" stroke="#000000" stroke-width="0.5"/>
        <rect x="2" y="8.7" width="20" height="1.6" rx="0.8" fill="#f97316" stroke="#000000" stroke-width="0.5"/>
        <circle cx="12" cy="9.5" r="1.8" fill="#000000"/>
        <circle cx="12" cy="9.5" r="1" fill="#f97316"/>
      </svg>
    `;
    const heliMilitarySelected = heliMilitary.replace(/#000000/g, '#ffffff');

    const vesselCivilian = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" fill="none" stroke="#f0f0f0" stroke-width="2"/>
        <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" fill="none" stroke="#f0f0f0" stroke-width="2"/>
        <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" fill="none" stroke="#f0f0f0" stroke-width="2"/>
        <path d="M12 10v4" fill="none" stroke="#f0f0f0" stroke-width="2"/>
        <path d="M12 2v3" fill="none" stroke="#f0f0f0" stroke-width="2"/>
      </svg>
    `;
    const vesselSelected = vesselCivilian.replace(/#f0f0f0/g, '#ffffff');

    const transitVehicle = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11" fill="#202020" stroke="#f59e0b" stroke-width="2"/>
        <path d="M12 5l-6 6h4v8h4v-8h4z" fill="#f59e0b"/>
      </svg>
    `;
    const transitVehicleSelected = transitVehicle.replace(/#f59e0b/g, '#3b82f6');

    const makeDataUrl = (xml: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml.trim());

    return {
      flightCivilian: makeDataUrl(flightCivilian),
      flightCivilianSelected: makeDataUrl(flightCivilianSelected),
      flightMilitary: makeDataUrl(flightMilitary),
      flightMilitarySelected: makeDataUrl(flightMilitarySelected),
      heliCivilian: makeDataUrl(heliCivilian),
      heliCivilianSelected: makeDataUrl(heliCivilianSelected),
      heliMilitary: makeDataUrl(heliMilitary),
      heliMilitarySelected: makeDataUrl(heliMilitarySelected),
      vesselCivilian: makeDataUrl(vesselCivilian),
      vesselSelected: makeDataUrl(vesselSelected),
      transitVehicle: makeDataUrl(transitVehicle),
      transitVehicleSelected: makeDataUrl(transitVehicleSelected),
    };
  }, []);

  // Filter dynamic target arrays to absolutely guarantee zero bad coordinates reach the WebGL buffers
  const validFlights = useMemo(() => flights.filter((f) => isValidCoordinates(f.latitude, f.longitude)), [flights]);
  const validVessels = useMemo(() => vessels.filter((v) => isValidCoordinates(v.currentLat || v.lat, v.currentLon || v.lon)), [vessels]);
  const validCameras = useMemo(() => cameras.filter((c) => isValidCoordinates(c.lat, c.lon)), [cameras]);
  const validWildfires = useMemo(() => wildfires.filter((w) => isValidCoordinates(w.lat, w.lon)), [wildfires]);
  const validGbfsStations = useMemo(() => gbfsStations.filter((g) => isValidCoordinates(g.lat, g.lon)), [gbfsStations]);
  const validGtfsRtVehicles = useMemo(() => gtfsRtVehicles.filter((t) => isValidCoordinates(t.lat, t.lon)), [gtfsRtVehicles]);
  const validEvents = useMemo(() => events.filter((e) => isValidCoordinates(e.lat, e.lon)), [events]);

  // 2. Flight Markers (Uses build-in getAngle property to rotate standard icons on GPU, preventing texture cache crashes)
  const flightLayer = useMemo(() => {
    if (!layers.flights || !validFlights.length) return null;

    return new IconLayer({
      id: 'globe-flights-layer',
      data: validFlights,
      getPosition: (d: FlightState) => [d.longitude, d.latitude, (d.baroAltitude || 1000) / 10],
      getIcon: (d: FlightState) => {
        const isSelected = selectedTarget?.id === d.icao24;
        const isMil = isMilitaryFlight(d);
        const isHeli = isHelicopterFlight(d);

        let url = cachedIcons.flightCivilian;
        if (isHeli) {
          url = isMil ? (isSelected ? cachedIcons.heliMilitarySelected : cachedIcons.heliMilitary) : (isSelected ? cachedIcons.heliCivilianSelected : cachedIcons.heliCivilian);
        } else {
          url = isMil ? (isSelected ? cachedIcons.flightMilitarySelected : cachedIcons.flightMilitary) : (isSelected ? cachedIcons.flightCivilianSelected : cachedIcons.flightCivilian);
        }

        return {
          url,
          width: 32,
          height: 32,
          anchorY: 16,
          anchorX: 16,
        };
      },
      getSize: (d: FlightState) => {
        const isSelected = selectedTarget?.id === d.icao24;
        return isSelected ? 32 : 24;
      },
      getAngle: (d: FlightState) => {
        // Deck.gl rotates counter-clockwise; negate trueTrack (degrees clockwise from North) to match Map/Compass
        return -(d.trueTrack || 0);
      },
      pickable: true,
      onClick: (info: any) => {
        if (info.object) {
          const f = info.object as FlightState;
          onSelectTarget({
            kind: 'FLIGHT',
            id: f.icao24,
            title: `✈️ ${f.callsign || f.icao24.toUpperCase()}`,
            subtitle: `${f.originCountry || 'Aircraft'} • Alt: ${f.baroAltitude ? Math.round(f.baroAltitude * 3.28084) : 'N/A'} ft`,
            lat: f.latitude,
            lon: f.longitude,
            data: f,
          });
        }
      },
    });
  }, [validFlights, layers.flights, selectedTarget, cachedIcons, onSelectTarget]);

  // 3. Maritime Vessels (Dynamic Ship SVGs rotated in Shader)
  const vesselLayer = useMemo(() => {
    if (!layers.maritime || !validVessels.length) return null;

    return new IconLayer({
      id: 'globe-vessels-layer',
      data: validVessels,
      getPosition: (d: MaritimeVessel) => [d.currentLon || d.lon, d.currentLat || d.lat, 0],
      getIcon: (d: MaritimeVessel) => {
        const isSelected = selectedTarget?.id === String(d.mmsi);
        return {
          url: isSelected ? cachedIcons.vesselSelected : cachedIcons.vesselCivilian,
          width: 32,
          height: 32,
          anchorY: 16,
          anchorX: 16,
        };
      },
      getSize: (d: MaritimeVessel) => {
        const isSelected = selectedTarget?.id === String(d.mmsi);
        return isSelected ? 30 : 22;
      },
      getAngle: (d: MaritimeVessel) => {
        return -(d.cogDeg || 0);
      },
      pickable: true,
      onClick: (info: any) => {
        if (info.object) {
          const v = info.object as MaritimeVessel;
          onSelectTarget({
            kind: 'VESSEL',
            id: String(v.mmsi),
            title: `🚢 ${v.name || `MMSI: ${v.mmsi}`}`,
            subtitle: `${v.type || 'Maritime Vessel'} • Speed: ${v.sogKnots ? v.sogKnots.toFixed(1) : 0} kts`,
            lat: v.currentLat || v.lat,
            lon: v.currentLon || v.lon,
            data: v,
          });
        }
      },
    });
  }, [validVessels, layers.maritime, selectedTarget, cachedIcons, onSelectTarget]);

  // --- Supercluster Initialization ---

  // A. Cameras Supercluster Index
  const cameraClusterIndex = useMemo(() => {
    const sc = new Supercluster({
      radius: 60,
      maxZoom: 17,
    });
    const points = validCameras.map((cam) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [cam.lon, cam.lat],
      },
      properties: {
        cluster: false,
        camera: cam,
      },
    }));
    sc.load(points);
    return sc;
  }, [validCameras]);

  const cameraClusters = useMemo(() => {
    if (!layers.cctv) return [];
    return cameraClusterIndex.getClusters([-180, -85, 180, 85], zoom);
  }, [cameraClusterIndex, layers.cctv, zoom]);

  // B. Wildfires Supercluster Index
  const wildfireClusterIndex = useMemo(() => {
    const sc = new Supercluster({
      radius: 50,
      maxZoom: 17,
    });
    const points = validWildfires.map((fire) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [fire.lon, fire.lat],
      },
      properties: {
        cluster: false,
        event: fire,
      },
    }));
    sc.load(points);
    return sc;
  }, [validWildfires]);

  const wildfireClusters = useMemo(() => {
    if (!layers.wildfires) return [];
    return wildfireClusterIndex.getClusters([-180, -85, 180, 85], zoom);
  }, [wildfireClusterIndex, layers.wildfires, zoom]);

  // C. GBFS Bikeshare Stations Supercluster Index
  const gbfsClusterIndex = useMemo(() => {
    const sc = new Supercluster({
      radius: 50,
      maxZoom: 17,
    });
    const points = validGbfsStations.map((station) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [station.lon, station.lat],
      },
      properties: {
        cluster: false,
        station: station,
      },
    }));
    sc.load(points);
    return sc;
  }, [validGbfsStations]);

  const gbfsClusters = useMemo(() => {
    if (!layers.gbfs) return [];
    return gbfsClusterIndex.getClusters([-180, -85, 180, 85], zoom);
  }, [gbfsClusterIndex, layers.gbfs, zoom]);

  // --- Clumped Icon Layers & SVGs ---

  // 4. Clumped Cameras Layer (IconLayer)
  const cameraLayer = useMemo(() => {
    if (!layers.cctv || !cameraClusters.length) return null;

    const getCameraIconUrl = (isSelected: boolean) => {
      const color = isSelected ? '#3b82f6' : '#a855f7';
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill="#202020" stroke="${color}" stroke-width="2"/>
          <g transform="translate(5, 5) scale(0.6)" stroke="${color}" stroke-width="2" fill="none">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
            <circle cx="12" cy="13" r="3"/>
          </g>
        </svg>
      `;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
    };

    const getCameraClusterIconUrl = (count: number) => {
      const formattedCount = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toLocaleString();
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="32" viewBox="0 0 96 32">
          <rect x="2" y="2" width="92" height="28" rx="14" fill="#242424" stroke="#3f3f46" stroke-width="2"/>
          <g transform="translate(14, 8) scale(0.65)" stroke="#a1a1aa" stroke-width="2.5" fill="none">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
            <circle cx="12" cy="13" r="3"/>
          </g>
          <text x="56" y="20" font-family="monospace" font-size="12" font-weight="bold" fill="#e4e4e7" text-anchor="middle">${formattedCount}</text>
        </svg>
      `;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
    };

    return new IconLayer({
      id: 'globe-cameras-clumped-layer',
      data: cameraClusters,
      getPosition: (d: any) => [d.geometry?.coordinates?.[0] || 0, d.geometry?.coordinates?.[1] || 0, 0] as [number, number, number],
      getIcon: (d: any) => {
        const isCluster = d.properties.cluster;
        if (isCluster) {
          return {
            url: getCameraClusterIconUrl(d.properties.point_count),
            width: 96,
            height: 32,
            anchorX: 48,
            anchorY: 16,
          };
        } else {
          const cam = d.properties.camera as CCTVCamera;
          const isSelected = selectedTarget?.id === cam.id;
          return {
            url: getCameraIconUrl(isSelected),
            width: 24,
            height: 24,
            anchorX: 12,
            anchorY: 12,
          };
        }
      },
      getSize: (d: any) => {
        if (d.properties.cluster) return 36;
        const cam = d.properties.camera as CCTVCamera;
        return selectedTarget?.id === cam.id ? 28 : 20;
      },
      pickable: true,
      onClick: (info: any) => {
        if (info.object) {
          const props = info.object.properties;
          if (props.cluster) {
            const clusterId = props.cluster_id;
            const [lon, lat] = info.object.geometry.coordinates;
            const expansionZoom = Math.min(cameraClusterIndex.getClusterExpansionZoom(clusterId), 18);
            setViewState((prev) => ({
              ...prev,
              longitude: lon,
              latitude: lat,
              zoom: expansionZoom,
            }));
          } else {
            const c = props.camera as CCTVCamera;
            onSelectTarget({
              kind: 'CCTV',
              id: c.id,
              title: `📹 ${c.name}`,
              subtitle: `${c.city || c.highway || 'CCTV Station'} • ${c.agency || 'Live Feed'}`,
              lat: c.lat,
              lon: c.lon,
              data: c,
            });
          }
        }
      },
    });
  }, [cameraClusters, layers.cctv, selectedTarget, onSelectTarget, cameraClusterIndex]);

  // 5. Clumped Wildfires Layer (IconLayer)
  const wildfireLayer = useMemo(() => {
    if (!layers.wildfires || !wildfireClusters.length) return null;

    const getWildfireIconUrl = (isSelected: boolean) => {
      const color = isSelected ? '#3b82f6' : '#ef4444';
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill="#202020" stroke="${color}" stroke-width="2"/>
          <g transform="translate(5, 5) scale(0.6)" stroke="${color}" stroke-width="2" fill="none">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/>
          </g>
        </svg>
      `;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
    };

    const getWildfireClusterIconUrl = (count: number) => {
      const formattedCount = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toLocaleString();
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="32" viewBox="0 0 96 32">
          <rect x="2" y="2" width="92" height="28" rx="14" fill="#242424" stroke="#3f3f46" stroke-width="2"/>
          <g transform="translate(14, 8) scale(0.65)" stroke="#ef4444" stroke-width="2.5" fill="none">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/>
          </g>
          <text x="56" y="20" font-family="monospace" font-size="12" font-weight="bold" fill="#e4e4e7" text-anchor="middle">${formattedCount}</text>
        </svg>
      `;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
    };

    return new IconLayer({
      id: 'globe-wildfires-clumped-layer',
      data: wildfireClusters,
      getPosition: (d: any) => [d.geometry?.coordinates?.[0] || 0, d.geometry?.coordinates?.[1] || 0, 0] as [number, number, number],
      getIcon: (d: any) => {
        const isCluster = d.properties.cluster;
        if (isCluster) {
          return {
            url: getWildfireClusterIconUrl(d.properties.point_count),
            width: 96,
            height: 32,
            anchorX: 48,
            anchorY: 16,
          };
        } else {
          const event = d.properties.event as GodsEyeEvent;
          const isSelected = selectedTarget?.id === event.id;
          return {
            url: getWildfireIconUrl(isSelected),
            width: 24,
            height: 24,
            anchorX: 12,
            anchorY: 12,
          };
        }
      },
      getSize: (d: any) => {
        if (d.properties.cluster) return 36;
        const event = d.properties.event as GodsEyeEvent;
        return selectedTarget?.id === event.id ? 28 : 20;
      },
      pickable: true,
      onClick: (info: any) => {
        if (info.object) {
          const props = info.object.properties;
          if (props.cluster) {
            const clusterId = props.cluster_id;
            const [lon, lat] = info.object.geometry.coordinates;
            const expansionZoom = Math.min(wildfireClusterIndex.getClusterExpansionZoom(clusterId), 18);
            setViewState((prev) => ({
              ...prev,
              longitude: lon,
              latitude: lat,
              zoom: expansionZoom,
            }));
          } else {
            const event = props.event as GodsEyeEvent;
            onSelectTarget({
              kind: 'EVENT',
              id: event.id,
              title: event.title,
              subtitle: `WILDFIRE EVENT`,
              lat: event.lat,
              lon: event.lon,
              data: event,
            });
          }
        }
      },
    });
  }, [wildfireClusters, layers.wildfires, selectedTarget, onSelectTarget, wildfireClusterIndex]);

  // 6. Clumped Bikeshare Stations Layer (IconLayer)
  const gbfsLayer = useMemo(() => {
    if (!layers.gbfs || !gbfsClusters.length) return null;

    const getBikeshareIconUrl = (station: GbfsStation, isSelected: boolean) => {
      const color = isSelected ? '#3b82f6' : '#10b981';
      const numBikes = station.numBikesAvailable ?? 0;
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="24" viewBox="0 0 48 24">
          <rect x="1" y="1" width="46" height="22" rx="11" fill="#202020" stroke="${color}" stroke-width="2"/>
          <g transform="translate(6, 4) scale(0.65)" stroke="${color}" stroke-width="2.5" fill="none">
            <circle cx="18.5" cy="17.5" r="3.5"/>
            <circle cx="5.5" cy="17.5" r="3.5"/>
            <circle cx="15" cy="5" r="1"/>
            <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
          </g>
          <text x="34" y="15" font-family="monospace" font-size="11" font-weight="bold" fill="#e4e4e7" text-anchor="middle">${numBikes}</text>
        </svg>
      `;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
    };

    const getGbfsClusterIconUrl = (count: number) => {
      const formattedCount = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toLocaleString();
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="32" viewBox="0 0 96 32">
          <rect x="2" y="2" width="92" height="28" rx="14" fill="#242424" stroke="#3f3f46" stroke-width="2"/>
          <g transform="translate(14, 8) scale(0.65)" stroke="#10b981" stroke-width="2.5" fill="none">
            <circle cx="18.5" cy="17.5" r="3.5"/>
            <circle cx="5.5" cy="17.5" r="3.5"/>
            <circle cx="15" cy="5" r="1"/>
            <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
          </g>
          <text x="56" y="20" font-family="monospace" font-size="12" font-weight="bold" fill="#e4e4e7" text-anchor="middle">${formattedCount}</text>
        </svg>
      `;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
    };

    return new IconLayer({
      id: 'globe-gbfs-clumped-layer',
      data: gbfsClusters,
      getPosition: (d: any) => [d.geometry?.coordinates?.[0] || 0, d.geometry?.coordinates?.[1] || 0, 0] as [number, number, number],
      getIcon: (d: any) => {
        const isCluster = d.properties.cluster;
        if (isCluster) {
          return {
            url: getGbfsClusterIconUrl(d.properties.point_count),
            width: 96,
            height: 32,
            anchorX: 48,
            anchorY: 16,
          };
        } else {
          const station = d.properties.station as GbfsStation;
          const isSelected = selectedTarget?.id === station.id;
          return {
            url: getBikeshareIconUrl(station, isSelected),
            width: 48,
            height: 24,
            anchorX: 24,
            anchorY: 12,
          };
        }
      },
      getSize: (d: any) => {
        if (d.properties.cluster) return 36;
        const station = d.properties.station as GbfsStation;
        return selectedTarget?.id === station.id ? 28 : 22;
      },
      pickable: true,
      onClick: (info: any) => {
        if (info.object) {
          const props = info.object.properties;
          if (props.cluster) {
            const clusterId = props.cluster_id;
            const [lon, lat] = info.object.geometry.coordinates;
            const expansionZoom = Math.min(gbfsClusterIndex.getClusterExpansionZoom(clusterId), 18);
            setViewState((prev) => ({
              ...prev,
              longitude: lon,
              latitude: lat,
              zoom: expansionZoom,
            }));
          } else {
            const station = props.station as GbfsStation;
            onSelectTarget({
              kind: 'GBFS',
              id: station.id,
              title: `🚲 ${station.name}`,
              subtitle: `Available Bikes: ${station.numBikesAvailable ?? 0} • Docks: ${station.numDocksAvailable ?? 0}`,
              lat: station.lat,
              lon: station.lon,
              data: station,
            });
          }
        }
      },
    });
  }, [gbfsClusters, layers.gbfs, selectedTarget, onSelectTarget, gbfsClusterIndex]);

  // 7. Transit Vehicles Layer (IconLayer with bearing arrows rotated on GPU)
  const transitLayer = useMemo(() => {
    if (!layers.gtfsRt || !validGtfsRtVehicles.length) return null;

    return new IconLayer({
      id: 'globe-transit-layer',
      data: validGtfsRtVehicles,
      getPosition: (d: GtfsRtVehicle) => [d.lon, d.lat, 0],
      getIcon: (d: GtfsRtVehicle) => {
        const isSelected = selectedTarget?.id === d.id;
        return {
          url: isSelected ? cachedIcons.transitVehicleSelected : cachedIcons.transitVehicle,
          width: 32,
          height: 32,
          anchorX: 16,
          anchorY: 16,
        };
      },
      getSize: (d: GtfsRtVehicle) => {
        const isSelected = selectedTarget?.id === d.id;
        return isSelected ? 32 : 24;
      },
      getAngle: (d: GtfsRtVehicle) => {
        return -(d.bearing || 0);
      },
      pickable: true,
      onClick: (info: any) => {
        if (info.object) {
          const vehicle = info.object as GtfsRtVehicle;
          onSelectTarget({
            kind: 'GTFS_RT',
            id: vehicle.id,
            title: `🚌 ${vehicle.routeId || 'Transit'} - ${vehicle.label || 'Bus'}`,
            subtitle: `Trip: ${vehicle.tripId || 'N/A'} • Speed: ${vehicle.speed ? (vehicle.speed * 2.23694).toFixed(1) : 0} mph`,
            lat: vehicle.lat,
            lon: vehicle.lon,
            data: vehicle,
          });
        }
      },
    });
  }, [validGtfsRtVehicles, layers.gtfsRt, selectedTarget, cachedIcons, onSelectTarget]);

  // 8. Event/Incident Markers (Generic Red Warning Badges)
  const eventLayer = useMemo(() => {
    if (!layers.events || !validEvents.length) return null;

    const getEventIconUrl = (isSelected: boolean) => {
      const color = isSelected ? '#3b82f6' : '#e11d48';
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill="#202020" stroke="${color}" stroke-width="2"/>
          <g transform="translate(6, 6) scale(0.5)" stroke="${color}" stroke-width="2.5" fill="none">
            <path d="M12 9v4"/>
            <path d="M12 17h.01"/>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          </g>
        </svg>
      `;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
    };

    return new IconLayer({
      id: 'globe-events-layer',
      data: validEvents,
      getPosition: (d: GodsEyeEvent) => [d.lon, d.lat, 0],
      getIcon: (d: GodsEyeEvent) => {
        const isSelected = selectedTarget?.id === d.id;
        return {
          url: getEventIconUrl(isSelected),
          width: 24,
          height: 24,
          anchorX: 12,
          anchorY: 12,
        };
      },
      getSize: (d: GodsEyeEvent) => {
        const isSelected = selectedTarget?.id === d.id;
        return isSelected ? 28 : 20;
      },
      pickable: true,
      onClick: (info: any) => {
        if (info.object) {
          const event = info.object as GodsEyeEvent;
          onSelectTarget({
            kind: 'EVENT',
            id: event.id,
            title: event.title,
            subtitle: `WEATHER/SECURITY EVENT`,
            lat: event.lat,
            lon: event.lon,
            data: event,
          });
        }
      },
    });
  }, [validEvents, layers.events, selectedTarget, onSelectTarget]);

  // Combine active layers
  const deckLayers = [
    globeTileLayer,
    flightLayer,
    vesselLayer,
    cameraLayer,
    wildfireLayer,
    gbfsLayer,
    transitLayer,
    eventLayer,
  ].filter(Boolean);

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] overflow-hidden select-none">
      {/* DeckGL 3D Globe Container */}
      <DeckGL
        views={new GlobeView({
          id: 'globe',
          controller: {
            dragPan: true,
            dragRotate: true,
            scrollZoom: true,
            doubleClickZoom: true,
            touchZoom: true,
            touchRotate: true,
            multiTouchDrag: 'rotate', // Enables pinching, rotating, and tilting via touch gestures (vertical drag for pitch, horizontal drag for bearing)
            keyboard: true,
            inertia: 250, // Enhances physical ease-out animation feel on touch screens
          }
        })}
        viewState={viewState}
        onViewStateChange={({ viewState: newViewState }: any) => {
          setViewState(viewState => ({
            ...viewState,
            ...newViewState,
            // Keep bounds and limits protected
            zoom: Math.max(0, Math.min(20, newViewState.zoom || viewState.zoom)),
          }));
        }}
        layers={deckLayers}
        getCursor={({ isHovering }: any) => (isHovering ? 'pointer' : 'default')}
      />

      {/* Bottom Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#141414]/90 border border-[#262626] rounded-full px-4 py-1.5 text-[11px] text-zinc-400 backdrop-blur-md pointer-events-none shadow-xl">
        Drag to rotate 3D Globe • Scroll to zoom • Click markers for target telemetry
      </div>
    </div>
  );
};
