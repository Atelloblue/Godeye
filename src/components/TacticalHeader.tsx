import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plane, 
  Ship, 
  Video, 
  Database, 
  Globe2, 
  Globe,
  Settings as SettingsIcon, 
  CloudRain, 
  Flame, 
  Bike, 
  Bus,
  Locate,
  BarChart3,
  ChevronDown,
  Eye,
  EyeOff,
  Radio
} from 'lucide-react';
import { LayerVisibility, LayerType } from '../types';

interface TacticalHeaderProps {
  stats: {
    flights: number;
    vessels: number;
    cameras: number;
    weather: number;
    wildfires: number;
    gbfs?: number;
    gtfsRt?: number;
  };
  layers?: LayerVisibility;
  onToggleLayer?: (layer: keyof LayerVisibility) => void;
  onChangeBaseLayer?: (layer: LayerType) => void;
  onTeleport?: (lat: number, lon: number, zoom: number, title: string) => void;
  onRefreshAll?: () => void;
  onOpenSettings: () => void;
  onOpenCctvWall?: () => void;
  isRefreshing?: boolean;
  isTrackingLocation?: boolean;
  onToggleTrackLocation?: () => void;
  onLocationBtnPosChange?: (pos: { top: number; right: number } | null) => void;
}

export const TacticalHeader: React.FC<TacticalHeaderProps> = ({
  stats,
  layers = {
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
  },
  onToggleLayer = () => {},
  onOpenSettings,
  onOpenCctvWall,
  isTrackingLocation = false,
  onToggleTrackLocation = () => {},
  onLocationBtnPosChange,
}) => {
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; right: number } | null>(null);
  const statsDropdownRef = useRef<HTMLDivElement>(null);
  const trackLocationBtnRef = useRef<HTMLButtonElement>(null);

  const updateTrackLocationPos = useCallback(() => {
    if (trackLocationBtnRef.current && onLocationBtnPosChange) {
      const rect = trackLocationBtnRef.current.getBoundingClientRect();
      onLocationBtnPosChange({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
  }, [onLocationBtnPosChange]);

  useEffect(() => {
    updateTrackLocationPos();
    window.addEventListener('resize', updateTrackLocationPos);
    window.addEventListener('scroll', updateTrackLocationPos, true);
    return () => {
      window.removeEventListener('resize', updateTrackLocationPos);
      window.removeEventListener('scroll', updateTrackLocationPos, true);
    };
  }, [updateTrackLocationPos, isTrackingLocation]);

  const updatePopoverPos = () => {
    if (statsDropdownRef.current) {
      const rect = statsDropdownRef.current.getBoundingClientRect();
      setPopoverPos({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
  };

  // Close dropdown on click outside and track position
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statsDropdownRef.current && !statsDropdownRef.current.contains(event.target as Node)) {
        setIsStatsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isStatsOpen) {
      updatePopoverPos();
      window.addEventListener('resize', updatePopoverPos);
      window.addEventListener('scroll', updatePopoverPos, true);
      return () => {
        window.removeEventListener('resize', updatePopoverPos);
        window.removeEventListener('scroll', updatePopoverPos, true);
      };
    }
  }, [isStatsOpen]);

  const totalEntities = 
    (stats.flights || 0) + 
    (stats.vessels || 0) + 
    (stats.cameras || 0) + 
    (stats.weather || 0) + 
    (stats.wildfires || 0) + 
    (stats.gbfs || 0) + 
    (stats.gtfsRt || 0);

  const categories = [
    {
      id: 'flights' as keyof LayerVisibility,
      label: 'Planes & Aircraft',
      count: stats.flights || 0,
      icon: Plane,
      active: !!layers.flights,
    },
    {
      id: 'maritime' as keyof LayerVisibility,
      label: 'Ships & Maritime',
      count: stats.vessels || 0,
      icon: Ship,
      active: !!layers.maritime,
    },
    {
      id: 'cctv' as keyof LayerVisibility,
      label: 'Traffic Cameras',
      count: stats.cameras || 0,
      icon: Video,
      active: !!layers.cctv,
    },
    {
      id: 'gtfsRt' as keyof LayerVisibility,
      label: 'Public Transit Vehicles',
      count: stats.gtfsRt || 0,
      icon: Bus,
      active: !!layers.gtfsRt,
    },
    {
      id: 'gbfs' as keyof LayerVisibility,
      label: 'Bikeshare Docks',
      count: stats.gbfs || 0,
      icon: Bike,
      active: !!layers.gbfs,
    },
    {
      id: 'weather' as keyof LayerVisibility,
      label: 'Weather Hazards',
      count: stats.weather || 0,
      icon: CloudRain,
      active: !!layers.weather,
    },
    {
      id: 'wildfires' as keyof LayerVisibility,
      label: 'Active Wildfires',
      count: stats.wildfires || 0,
      icon: Flame,
      active: !!layers.wildfires,
    },
  ];

  return (
    <header className="relative z-30 bg-[#1e1e1e] border-b border-[#2e2e2e] px-3 sm:px-4 py-2 shadow-sm select-none">
      <div className="flex items-center justify-between gap-3 max-w-full min-w-0">
        {/* App Title & Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2a2a2a] text-zinc-100 border border-[#383838]">
            <Globe2 className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-200" />
          </div>

          <div>
            <h1 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight leading-tight">
              God's Eye
            </h1>
          </div>
        </div>

        {/* Location Tracker + Unified Stats + Action Bar (Horizontally scrollable if off screen) */}
        <div className="flex items-center gap-1.5 sm:gap-2 justify-end overflow-x-auto min-w-0 py-0.5 custom-scrollbar">
          {/* Location Tracker Primary Toggle */}
          <button
            ref={trackLocationBtnRef}
            onClick={() => {
              onToggleTrackLocation();
              updateTrackLocationPos();
            }}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
              isTrackingLocation
                ? 'bg-[#282828] border-[#444444] text-zinc-100 font-semibold'
                : 'bg-[#2a2a2a] hover:bg-[#333333] text-zinc-200 border-[#383838]'
            }`}
            title="Track my GPS location & auto-connect to nearest live CCTV camera"
          >
            <Locate className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
            <span className="whitespace-nowrap">
              {isTrackingLocation ? (
                <>
                  <span className="inline sm:hidden">Tracking</span>
                  <span className="hidden sm:inline">Tracking GPS</span>
                </>
              ) : (
                <>
                  <span className="inline sm:hidden">Location</span>
                  <span className="hidden sm:inline">Track Location</span>
                </>
              )}
            </span>
          </button>

          {/* Unified Stats Button & Dropdown */}
          <div className="relative" ref={statsDropdownRef}>
            <button
              onClick={() => setIsStatsOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isStatsOpen
                  ? 'bg-[#282828] border-[#444444] text-zinc-100 font-semibold'
                  : 'bg-[#2a2a2a] hover:bg-[#333333] text-zinc-200 border-[#383838]'
              }`}
              title="View live data statistics and category counts"
            >
              <BarChart3 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="hidden xs:inline">Stats</span>
              <span className="px-1.5 py-0.5 rounded-md bg-[#181818] text-zinc-300 text-[11px] font-mono font-medium border border-[#2e2e2e]">
                {totalEntities.toLocaleString()}
              </span>
              <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isStatsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Stats Breakdown Popover Menu */}
            {isStatsOpen && (
              <div 
                style={{
                  position: 'fixed',
                  top: popoverPos?.top ?? 50,
                  right: popoverPos?.right ?? 16,
                }}
                className="w-[calc(100vw-1.5rem)] sm:w-80 max-w-[20rem] bg-[#1e1e1e]/95 border border-[#2e2e2e] rounded-2xl shadow-xl backdrop-blur-md overflow-hidden text-zinc-200 z-50 select-none"
              >
                {/* Popover Header */}
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#2a2a2a] bg-[#1a1a1a]/50">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                    <BarChart3 className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>Active Layers & Counts</span>
                  </div>
                  <span className="text-xs font-mono font-medium text-zinc-300 bg-[#141414] px-2.5 py-0.5 rounded-full border border-[#282828]">
                    {totalEntities.toLocaleString()}
                  </span>
                </div>

                {/* Categories List */}
                <div className="p-3.5 space-y-1 max-h-72 sm:max-h-80 overflow-y-auto custom-scrollbar">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => onToggleLayer(cat.id)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#252525] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span className="text-xs font-medium text-zinc-200 truncate">{cat.label}</span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs font-mono text-zinc-400">
                            {cat.count.toLocaleString()}
                          </span>
                          <span title={cat.active ? "Layer Visible" : "Layer Hidden"}>
                            {cat.active ? (
                              <Eye className="w-3.5 h-3.5 text-zinc-200 shrink-0" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {onOpenCctvWall && (
                  <div className="p-2.5 border-t border-[#2a2a2a] bg-[#161616]/70">
                    <button
                      onClick={() => {
                        setIsStatsOpen(false);
                        onOpenCctvWall();
                      }}
                      className="w-full py-1.5 px-3 rounded-xl bg-[#222222] hover:bg-[#2c2c2c] text-zinc-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#333333]"
                    >
                      <Video className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Open Camera Browser</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings Action Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] hover:bg-[#333333] text-zinc-200 border border-[#383838] transition-colors cursor-pointer shrink-0"
            title="Configure settings"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

