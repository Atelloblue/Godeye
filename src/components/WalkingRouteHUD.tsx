import React from 'react';
import { Footprints, Navigation, X, GripHorizontal, ArrowRight, Clock, MapPin } from 'lucide-react';
import { WalkingRoute, formatDistance, formatWalkingTime } from '../utils/walkingRouteApi';
import { useDraggable } from '../hooks/useDraggable';

interface WalkingRouteHUDProps {
  route: WalkingRoute | null;
  onClose: () => void;
  onRecenterRoute?: () => void;
}

export const WalkingRouteHUD: React.FC<WalkingRouteHUDProps> = ({
  route,
  onClose,
  onRecenterRoute,
}) => {
  const { style: dragStyle, dragProps } = useDraggable();

  if (!route) return null;

  return (
    <div
      style={dragStyle}
      {...dragProps}
      className="fixed bottom-6 left-4 sm:left-6 z-40 w-[92vw] sm:w-[360px] max-w-md bg-[#1c1c1c]/95 border border-[#2e2e2e] rounded-2xl shadow-2xl backdrop-blur-md text-zinc-200 overflow-hidden select-none"
    >
      {/* Header & Drag Handle */}
      <div
        data-drag-handle
        className="flex items-center justify-between px-3.5 py-2.5 bg-[#181818]/90 border-b border-[#282828] cursor-grab active:cursor-grabbing touch-none"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-zinc-500 shrink-0" />
          <div className="p-1 rounded-md bg-[#282828] text-zinc-300 border border-[#383838] shrink-0">
            <Footprints className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-zinc-200">
            Pedestrian Walking Trail
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-[#282828] text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          title="Clear Walking Route"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Stats Row */}
      <div className="p-3.5 space-y-3">
        {/* Origin to Destination */}
        <div className="bg-[#141414] p-3 rounded-xl border border-[#262626] space-y-2">
          <div className="flex items-center gap-2 text-xs text-zinc-200">
            <div className="w-2 h-2 rounded-full bg-zinc-200 border border-zinc-400 shrink-0" />
            <span className="font-medium truncate text-zinc-100">{route.fromName}</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-zinc-400 pl-3">
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0 rotate-90" />
            <span className="text-xs text-zinc-500">OSRM Foot Path</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-200">
            <div className="w-2 h-2 rounded-full bg-zinc-400 border border-zinc-600 shrink-0" />
            <span className="font-medium truncate text-zinc-100">{route.toName}</span>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#141414] p-2.5 rounded-xl border border-[#262626] flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#282828] text-zinc-300 shrink-0 border border-[#383838]">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-400">Distance</div>
              <div className="text-xs font-semibold text-zinc-100">
                {formatDistance(route.distanceMeters)}
              </div>
            </div>
          </div>

          <div className="bg-[#141414] p-2.5 rounded-xl border border-[#262626] flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#282828] text-zinc-300 shrink-0 border border-[#383838]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-400">Est. Time</div>
              <div className="text-xs font-semibold text-zinc-100">
                {formatWalkingTime(route.durationSeconds)}
              </div>
            </div>
          </div>
        </div>

        {/* Action button */}
        {onRecenterRoute && (
          <button
            onClick={onRecenterRoute}
            className="w-full py-2 rounded-xl bg-[#282828] hover:bg-[#333333] border border-[#383838] text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-zinc-300" />
            <span>Fit Map to Trail</span>
          </button>
        )}
      </div>
    </div>
  );
};
