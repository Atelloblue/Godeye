import React, { useState, useEffect } from 'react';
import { 
  Locate, 
  Video, 
  Navigation, 
  Bike, 
  Bus, 
  Plane, 
  Ship, 
  AlertTriangle, 
  X, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  ExternalLink,
  ShieldAlert,
  Compass,
  Radio,
  GripHorizontal
} from 'lucide-react';
import { useDraggable } from '../hooks/useDraggable';
import { CCTVImage } from './CCTVImage';
import { CCTVCamera, FlightState, MaritimeVessel, GbfsStation, GtfsRtVehicle } from '../types';
import { NearestIntel, formatDistance } from '../utils/geoUtils';
import { isHelicopterFlight, isMilitaryFlight, HelicopterIcon } from '../utils/flightClassification';

export interface UserLocation {
  lat: number;
  lon: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

interface LocationIntelCardProps {
  userLocation: UserLocation | null;
  isTracking: boolean;
  isAutoLockNearest: boolean;
  intel: NearestIntel;
  onToggleTracking: () => void;
  onToggleAutoLock: () => void;
  onRecenterUser: () => void;
  onSelectCamera: (cam: CCTVCamera) => void;
  onSelectTarget: (target: any) => void;
  onClose: () => void;
  popoverPos?: { top: number; right: number } | null;
}

export const LocationIntelCard: React.FC<LocationIntelCardProps> = ({
  userLocation,
  isTracking,
  isAutoLockNearest,
  intel,
  onToggleTracking,
  onToggleAutoLock,
  onRecenterUser,
  onSelectCamera,
  onSelectTarget,
  onClose,
  popoverPos,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [cctvFrameKey, setCctvFrameKey] = useState<number>(Date.now());
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    setImgError(false);
  }, [intel.camera?.cam.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCctvFrameKey(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const { style: dragStyle, dragProps } = useDraggable();

  if (!userLocation && !isTracking) return null;

  const cam = intel.camera?.cam;
  const camDist = intel.camera?.distKm;

  return (
    <div 
      style={{
        ...dragStyle,
        position: 'fixed',
        top: popoverPos?.top ?? 52,
        right: popoverPos?.right ?? 16,
      }}
      {...dragProps}
      className="z-40 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-[#1c1c1c]/95 border border-[#2e2e2e] rounded-2xl shadow-xl backdrop-blur-md text-zinc-100 select-none overflow-hidden transition-all duration-200"
    >
      {/* Top Header / Status Bar - Drag handle (Only Top Bar is Draggable) */}
      <div 
        data-drag-handle
        className="flex items-center justify-between px-3.5 py-2.5 bg-[#181818]/90 border-b border-[#282828] cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <GripHorizontal className="w-4 h-4 text-zinc-500 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-semibold text-zinc-100 tracking-tight truncate">Location & Nearby Devices</span>
              {userLocation?.accuracy && (
                <span className="text-[10px] tabular-nums font-medium px-1.5 py-0.2 rounded bg-[#2a2a2a] text-zinc-300 border border-[#383838] shrink-0">
                  ±{Math.round(userLocation.accuracy)}m
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 tabular-nums font-normal truncate">
              {userLocation ? `${userLocation.lat.toFixed(4)}°, ${userLocation.lon.toFixed(4)}°` : 'Acquiring GPS fix...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-[#2c2c2c] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#2c2c2c] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Stop Tracking Location"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-2.5 sm:p-3 space-y-2.5 sm:space-y-3 max-h-[55vh] sm:max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-xl bg-[#202020] border border-[#2d2d2d]">
            <button
              onClick={onRecenterUser}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] hover:bg-[#333333] text-zinc-200 border border-[#3a3a3a] transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
              <span className="truncate">Center Me</span>
            </button>

            <button
              onClick={onToggleAutoLock}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                isAutoLockNearest
                  ? 'bg-[#282828] border-[#444444] text-zinc-100 font-semibold'
                  : 'bg-[#2a2a2a] hover:bg-[#333333] text-zinc-300 border-[#3a3a3a]'
              }`}
            >
              <Radio className="w-3.5 h-3.5 shrink-0 text-zinc-300" />
              <span className="truncate">{isAutoLockNearest ? 'Auto-Lock ON' : 'Auto-Lock OFF'}</span>
            </button>
          </div>

          {/* Nearest CCTV Feed Card */}
          {cam ? (
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#1e1e1e] border border-[#2e2e2e] space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-zinc-200 tracking-tight">
                      Nearest Camera
                    </span>
                  </div>
                  <h4 className="text-xs font-medium text-zinc-100 line-clamp-1 mt-0.5">
                    {cam.name}
                  </h4>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {cam.agency} • {cam.city}
                  </p>
                </div>
                {camDist !== undefined && (
                  <span className="text-[10px] tabular-nums font-semibold px-2 py-0.5 rounded-md bg-[#282828] text-zinc-300 border border-[#383838] shrink-0">
                    {formatDistance(camDist)}
                  </span>
                )}
              </div>

              {/* Camera Preview Box */}
              <div className="relative aspect-video w-full rounded-lg bg-[#121212] overflow-hidden border border-[#2a2a2a] group">
                {!imgError ? (
                  <CCTVImage
                    src={cam.streamUrl ? `/api/cctv/proxy?url=${encodeURIComponent(cam.snapshotUrl)}` : `/api/cctv/proxy?url=${encodeURIComponent(cam.snapshotUrl)}&t=${cctvFrameKey}`}
                    streamUrl={cam.streamUrl}
                    alt={cam.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-[#151515]">
                    <ShieldAlert className="w-6 h-6 text-zinc-400 mb-1" />
                    <span className="text-[11px] text-zinc-300 font-medium">Stream Offline / Refreshing</span>
                  </div>
                )}

                <div className="absolute top-2 left-2 flex items-center px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-medium text-zinc-300">
                  <span>LIVE</span>
                </div>

                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  <button
                    onClick={() => setCctvFrameKey(Date.now())}
                    className="p-1 rounded bg-black/70 hover:bg-black text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Force refresh snapshot"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onSelectCamera(cam)}
                    className="p-1 rounded bg-[#2a2a2a] hover:bg-[#383838] text-zinc-100 border border-[#444444] transition-colors cursor-pointer"
                    title="Lock Camera View on Map"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 text-center bg-[#202020] rounded-xl border border-[#2c2c2c] text-xs text-zinc-400">
              No live cameras found near your location.
            </div>
          )}

          {/* Nearby Infrastructure Breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="text-[10px] font-semibold tracking-tight text-zinc-400 px-0.5">
              Nearby Locations
            </div>

            {/* Bikeshare */}
            {intel.bikeStation && (
              <div 
                onClick={() => onSelectTarget({
                  kind: 'GBFS',
                  id: intel.bikeStation!.station.id,
                  title: intel.bikeStation!.station.name,
                  subtitle: `${intel.bikeStation!.station.systemName} • ${intel.bikeStation!.station.numBikesAvailable} bikes`,
                  lat: intel.bikeStation!.station.lat,
                  lon: intel.bikeStation!.station.lon,
                  data: intel.bikeStation!.station,
                })}
                className="flex items-center justify-between p-2 rounded-xl bg-[#202020] hover:bg-[#282828] border border-[#2c2c2c] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <Bike className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-zinc-200 truncate">{intel.bikeStation.station.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {intel.bikeStation.station.numBikesAvailable} bikes available
                    </p>
                  </div>
                </div>
                <span className="text-[10px] tabular-nums font-medium text-zinc-400 shrink-0 ml-1">
                  {formatDistance(intel.bikeStation.distKm)}
                </span>
              </div>
            )}

            {/* Public Transit */}
            {intel.transitVehicle && (
              <div 
                onClick={() => onSelectTarget({
                  kind: 'GTFS_RT',
                  id: intel.transitVehicle!.vehicle.id,
                  title: `${intel.transitVehicle!.vehicle.agencyName} ${intel.transitVehicle!.vehicle.routeId}`,
                  subtitle: `${intel.transitVehicle!.vehicle.vehicleType} • Unit ${intel.transitVehicle!.vehicle.label || intel.transitVehicle!.vehicle.id}`,
                  lat: intel.transitVehicle!.vehicle.lat,
                  lon: intel.transitVehicle!.vehicle.lon,
                  data: intel.transitVehicle!.vehicle,
                })}
                className="flex items-center justify-between p-2 rounded-xl bg-[#202020] hover:bg-[#282828] border border-[#2c2c2c] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <Bus className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-zinc-200 truncate">
                      {intel.transitVehicle.vehicle.agencyName} Route {intel.transitVehicle.vehicle.routeId}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      Vehicle #{intel.transitVehicle.vehicle.label || intel.transitVehicle.vehicle.id}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] tabular-nums font-medium text-zinc-400 shrink-0 ml-1">
                  {formatDistance(intel.transitVehicle.distKm)}
                </span>
              </div>
            )}

            {/* Overhead Aircraft */}
            {intel.flight && (() => {
              const currentFlight = intel.flight.flight;
              const isHeli = isHelicopterFlight(currentFlight);
              const isMil = isMilitaryFlight(currentFlight);
              const categoryTitle = isMil
                ? (isHeli ? 'Military Helicopter' : 'Military Aircraft')
                : (isHeli ? 'Helicopter' : 'Flight');
              return (
                <div 
                  onClick={() => onSelectTarget({
                    kind: 'FLIGHT',
                    id: currentFlight.icao24,
                    title: `${categoryTitle} ${currentFlight.callsign || currentFlight.icao24}`,
                    subtitle: `${currentFlight.aircraftModel || (isHeli ? 'Rotorcraft' : 'Commercial Aircraft')} • ${Math.round(currentFlight.baroAltitude * 3.28084).toLocaleString()} ft`,
                    lat: currentFlight.latitude,
                    lon: currentFlight.longitude,
                    data: currentFlight,
                  })}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#202020] hover:bg-[#282828] border border-[#2c2c2c] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    {isHeli ? (
                      <HelicopterIcon className={`w-3.5 h-3.5 ${isMil ? 'text-orange-400' : 'text-zinc-400'} shrink-0`} />
                    ) : (
                      <Plane className={`w-3.5 h-3.5 ${isMil ? 'text-orange-400' : 'text-zinc-400'} shrink-0`} />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-[11px] font-medium text-zinc-200 truncate">
                          {currentFlight.callsign || currentFlight.icao24}
                        </p>
                        {isMil && (
                          <span className="text-[8px] px-1 py-0.2 rounded bg-[#282828] border border-[#383838] text-zinc-300 font-mono font-medium">
                            MIL
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {currentFlight.aircraftModel || (isHeli ? 'Rotorcraft' : 'Aircraft')} • {Math.round(currentFlight.baroAltitude * 3.28084).toLocaleString()} ft
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] tabular-nums font-medium text-zinc-400 shrink-0 ml-1">
                    {formatDistance(intel.flight.distKm)}
                  </span>
                </div>
              );
            })()}

            {/* Maritime Vessel */}
            {intel.vessel && (
              <div 
                onClick={() => onSelectTarget({
                  kind: 'VESSEL',
                  id: String(intel.vessel!.vessel.mmsi),
                  title: intel.vessel!.vessel.name,
                  subtitle: `${intel.vessel!.vessel.type} • ${intel.vessel!.vessel.sogKnots} kts`,
                  lat: intel.vessel!.vessel.lat,
                  lon: intel.vessel!.vessel.lon,
                  data: intel.vessel!.vessel,
                })}
                className="flex items-center justify-between p-2 rounded-xl bg-[#202020] hover:bg-[#282828] border border-[#2c2c2c] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <Ship className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-zinc-200 truncate">{intel.vessel.vessel.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {intel.vessel.vessel.type} ({intel.vessel.vessel.sogKnots} kts)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] tabular-nums font-medium text-zinc-400 shrink-0 ml-1">
                  {formatDistance(intel.vessel.distKm)}
                </span>
              </div>
            )}


          </div>
        </div>
      )}
    </div>
  );
};
