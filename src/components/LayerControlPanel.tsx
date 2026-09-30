import React, { useState } from 'react';
import { 
  Layers, 
  Plane, 
  Ship, 
  Video, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Tag,
  Check,
  Car,
  CloudRain,
  Flame,
  Bike,
  Bus,
  GripHorizontal,
  Globe,
  Map,
} from 'lucide-react';
import { useDraggable } from '../hooks/useDraggable';
import { LayerVisibility, LayerType, AppSettings } from '../types';

interface LayerControlPanelProps {
  layers: LayerVisibility;
  settings?: AppSettings;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  onChangeBaseLayer: (layer: LayerType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCctvWall: () => void;
  onOpenSettings: () => void;
  onWikiSearch?: (topic: string) => void;
}

export const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
  layers,
  settings,
  onToggleLayer,
  onChangeBaseLayer,
  searchQuery,
  onSearchChange,
  onOpenCctvWall,
  onOpenSettings,
  onWikiSearch,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const { style: dragStyle, dragProps } = useDraggable();

  const hasTomTomKey = Boolean(settings?.tomTomApiKey?.trim());
  const hasAisKey = Boolean(settings?.aisStreamApiKey?.trim());

  const BASE_LAYERS: { id: LayerType; label: string }[] = [
    { id: 'satellite', label: 'Satellite' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'dark_tactical', label: 'Dark' },
    { id: 'topographic', label: 'Terrain' },
  ];

  return (
    <div 
      style={dragStyle}
      {...dragProps}
      className={`absolute top-14 sm:top-16 left-2 sm:left-4 z-30 transition-all duration-200 select-none max-w-[calc(100vw-1rem)] ${
        isCollapsed ? 'w-10' : 'w-72 sm:w-80'
      }`}
    >
      <div className="bg-[#1e1e1e]/95 border border-[#2e2e2e] rounded-2xl shadow-xl backdrop-blur-md overflow-hidden text-zinc-200">
        {/* Header - Drag Handle (Only Top Bar is Draggable) */}
        <div 
          data-drag-handle
          className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#2a2a2a] cursor-grab active:cursor-grabbing touch-none select-none bg-[#1a1a1a]/50"
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2 font-medium text-sm text-zinc-100">
              <GripHorizontal className="w-4 h-4 text-zinc-500 shrink-0" />
              <Layers className="w-4 h-4 text-zinc-400" />
              <span>Map Layers</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-full hover:bg-[#2c2c2c] text-zinc-400 hover:text-zinc-200 transition-colors ml-auto cursor-pointer"
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="p-3.5 space-y-4 max-h-[calc(100vh-6.5rem)] overflow-y-auto">
            {/* Search Bar */}
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      onWikiSearch?.(searchQuery);
                    }
                  }}
                  placeholder="Search Texas, city, building, topic..."
                  className="w-full bg-[#141414] border border-[#2c2c2c] focus:border-[#3a3a3a] rounded-full pl-9 pr-14 py-1.5 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100 text-xs cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Unified Map View & Base Style Control */}
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-zinc-400">
                Map Style & Projection
              </div>
              <div className="bg-[#141414] rounded-xl border border-[#282828] overflow-hidden">
                {/* Connected Segment 1: Projection Selector (Top) */}
                <div className="p-1.5 bg-[#141414]">
                  <div className="grid grid-cols-2 gap-1 bg-[#1c1c1c] p-1 rounded-lg">
                    <button
                      onClick={() => { if (layers.is3DGlobe) onToggleLayer('is3DGlobe'); }}
                      className={`py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        !layers.is3DGlobe
                          ? 'bg-[#2a2a2a] text-zinc-100 shadow-sm border border-[#3c3c3c]'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#222222]'
                      }`}
                    >
                      <Map className="w-3.5 h-3.5" />
                      <span>2D Map</span>
                    </button>
                    <button
                      onClick={() => { if (!layers.is3DGlobe) onToggleLayer('is3DGlobe'); }}
                      className={`py-1.5 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        layers.is3DGlobe
                          ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40 shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#222222]'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>3D Globe</span>
                    </button>
                  </div>
                </div>

                {/* Connected Segment 2: Base Map Chips (Bottom) */}
                <div className="p-1.5 bg-[#141414]">
                  <div className="grid grid-cols-2 gap-1 bg-[#1c1c1c] p-1 rounded-lg">
                    {BASE_LAYERS.map((layer) => {
                      const isSelected = layers.satelliteLayer === layer.id;
                      return (
                        <button
                          key={layer.id}
                          onClick={() => onChangeBaseLayer(layer.id)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#2a2a2a] text-white shadow-sm border border-[#3c3c3c]'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#222222]'
                          }`}
                        >
                          <span>{layer.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Layer Toggles */}
            <div>
              <div className="text-xs font-medium text-zinc-400 mb-2">
                Data Feeds
              </div>

              <div className="space-y-1">
                {/* Flights Toggle */}
                <div
                  onClick={() => onToggleLayer('flights')}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#252525] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Plane className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-200">Flights (ADS-B)</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${layers.flights ? 'bg-zinc-200' : 'bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-zinc-900 absolute top-0.5 left-0.5 transition-transform duration-200 ${layers.flights ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Vehicle Traffic Toggle */}
                <div
                  onClick={() => {
                    if (hasTomTomKey) {
                      onToggleLayer('tomtomTraffic');
                    } else if (onOpenSettings) {
                      onOpenSettings();
                    }
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                    hasTomTomKey
                      ? 'hover:bg-[#252525] cursor-pointer opacity-100'
                      : 'opacity-50 cursor-pointer hover:bg-[#222222]'
                  }`}
                  title={hasTomTomKey ? 'Toggle Vehicle Traffic' : 'TomTom API Key required - Click to open Settings'}
                >
                  <div className="flex items-center gap-2.5">
                    <Car className={`w-4 h-4 ${hasTomTomKey ? 'text-zinc-400' : 'text-zinc-500'}`} />
                    <div>
                      <span className={`text-xs font-medium block ${hasTomTomKey ? 'text-zinc-200' : 'text-zinc-400'}`}>
                        Vehicle Traffic
                      </span>
                      {!hasTomTomKey && (
                        <span className="text-[10px] text-zinc-500 block font-mono">Requires API key</span>
                      )}
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${hasTomTomKey && layers.tomtomTraffic ? 'bg-zinc-200' : 'bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-zinc-900 absolute top-0.5 left-0.5 transition-transform duration-200 ${hasTomTomKey && layers.tomtomTraffic ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* CCTV Cameras Toggle */}
                <div
                  onClick={() => onToggleLayer('cctv')}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#252525] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Video className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-200">Traffic Cameras</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${layers.cctv ? 'bg-zinc-200' : 'bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-zinc-900 absolute top-0.5 left-0.5 transition-transform duration-200 ${layers.cctv ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Weather Toggle */}
                <div
                  onClick={() => onToggleLayer('weather')}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#252525] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <CloudRain className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-200">Weather & Hurricanes</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${layers.weather ? 'bg-zinc-200' : 'bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-zinc-900 absolute top-0.5 left-0.5 transition-transform duration-200 ${layers.weather ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Wildfires Toggle */}
                <div
                  onClick={() => onToggleLayer('wildfires')}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#252525] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Flame className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-200">Active Wildfires</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${layers.wildfires ? 'bg-zinc-200' : 'bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-zinc-900 absolute top-0.5 left-0.5 transition-transform duration-200 ${layers.wildfires ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Ships & Maritime Toggle */}
                <div
                  onClick={() => onToggleLayer('maritime')}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#252525] transition-colors cursor-pointer"
                  title="Toggle Live AIS Vessel Tracking"
                >
                  <div className="flex items-center gap-2.5">
                    <Ship className="w-4 h-4 text-zinc-400" />
                    <div>
                      <span className="text-xs font-medium text-zinc-200 block">
                        Ships & Maritime (AIS)
                      </span>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${layers.maritime ? 'bg-zinc-200' : 'bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-zinc-900 absolute top-0.5 left-0.5 transition-transform duration-200 ${layers.maritime ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* GBFS Bikeshare Toggle */}
                <div
                  onClick={() => onToggleLayer('gbfs')}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#252525] transition-colors cursor-pointer"
                  title="Toggle Live GBFS Bikeshare Docks & Fleets (Citi Bike, Bay Wheels, Divvy, CapMetro Austin, TfL Santander)"
                >
                  <div className="flex items-center gap-2.5">
                    <Bike className="w-4 h-4 text-zinc-400" />
                    <div>
                      <span className="text-xs font-medium text-zinc-200 block">
                        Bikeshare (GBFS)
                      </span>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${layers.gbfs ? 'bg-zinc-200' : 'bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-zinc-900 absolute top-0.5 left-0.5 transition-transform duration-200 ${layers.gbfs ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* GTFS-RT Public Transit Toggle */}
                <div
                  onClick={() => onToggleLayer('gtfsRt')}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#252525] transition-colors cursor-pointer"
                  title="Toggle Live GTFS-RT Realtime Public Transit & Rail (MTA, MBTA, SEPTA, RTD, VR Rail)"
                >
                  <div className="flex items-center gap-2.5">
                    <Bus className="w-4 h-4 text-zinc-400" />
                    <div>
                      <span className="text-xs font-medium text-zinc-200 block">
                        Public Transit (GTFS-RT)
                      </span>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${layers.gtfsRt ? 'bg-zinc-200' : 'bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-zinc-900 absolute top-0.5 left-0.5 transition-transform duration-200 ${layers.gtfsRt ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                {/* Map Labels Toggle */}
                <div
                  onClick={() => onToggleLayer('targetLabels')}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#252525] transition-colors cursor-pointer pt-2 border-t border-[#2a2a2a]"
                >
                  <div className="flex items-center gap-2.5">
                    <Tag className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-200">Map Pin Labels</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${layers.targetLabels ? 'bg-zinc-200' : 'bg-zinc-700'}`}>
                    <div className={`w-3 h-3 rounded-full bg-zinc-900 absolute top-0.5 left-0.5 transition-transform duration-200 ${layers.targetLabels ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-[#2a2a2a]">
              <button
                onClick={onOpenCctvWall}
                className="w-full py-2 px-3 rounded-full bg-[#1e1e1e] hover:bg-[#282828] text-zinc-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#333333]"
              >
                <Video className="w-4 h-4 text-zinc-400" />
                <span>Camera Feed</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
