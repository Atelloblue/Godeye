import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  X, 
  Video, 
  Search, 
  MapPin, 
  Pin, 
  PinOff, 
  RefreshCw, 
  Grid2X2, 
  Grid3X3, 
  List, 
  ArrowUp, 
  Radio, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { CCTVCamera } from '../types';
import { CCTVImage } from './CCTVImage';

interface CCTVStreamViewerProps {
  cameras: CCTVCamera[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCameraOnMap?: (camera: CCTVCamera) => void;
  pinnedCamIds?: string[];
  onTogglePin?: (camId: string, e: React.MouseEvent) => void;
}

type GridLayout = 'standard' | 'dense' | 'list';
type FeedFilterType = 'all' | 'video' | 'pinned';

interface RegionCategory {
  id: string;
  label: string;
  match: (c: CCTVCamera) => boolean;
}

const REGION_CATEGORIES: RegionCategory[] = [
  { 
    id: 'ALL', 
    label: 'All', 
    match: () => true 
  },
  { 
    id: 'TX', 
    label: 'Texas', 
    match: (c) => 
      c.city?.includes('TX') || 
      c.id.startsWith('tx-') || 
      c.agency?.toLowerCase().includes('txdot') || 
      c.agency?.toLowerCase().includes('transtar') ||
      c.agency?.toLowerCase().includes('austin')
  },
  { 
    id: 'CA', 
    label: 'California', 
    match: (c) => 
      c.city?.includes('CA') || 
      c.id.startsWith('caltrans-') || 
      c.agency?.toLowerCase().includes('caltrans')
  },
  { 
    id: 'FL', 
    label: 'Florida', 
    match: (c) => 
      c.city?.includes('FL') || 
      c.id.startsWith('fl511-') || 
      c.agency?.toLowerCase().includes('florida') || 
      c.agency?.toLowerCase().includes('fl511')
  },
  { 
    id: 'CO', 
    label: 'Colorado', 
    match: (c) => 
      c.city?.includes('CO') || 
      c.id.startsWith('cotrip-') || 
      c.agency?.toLowerCase().includes('cdot') || 
      c.agency?.toLowerCase().includes('colorado')
  },
  { 
    id: 'KS', 
    label: 'Kansas', 
    match: (c) => 
      c.city?.includes('KS') || 
      c.id.startsWith('kandrive-') || 
      c.agency?.toLowerCase().includes('kandrive') || 
      c.agency?.toLowerCase().includes('kansas') ||
      c.agency?.toLowerCase().includes('kdot')
  },
  { 
    id: 'IL', 
    label: 'Illinois', 
    match: (c) => 
      c.city?.includes('IL') || 
      c.id.startsWith('il-chi-') || 
      c.agency?.toLowerCase().includes('illinois') || 
      c.agency?.toLowerCase().includes('travelmidwest')
  },
  { 
    id: 'LA', 
    label: 'Louisiana', 
    match: (c) => 
      c.city?.includes('LA') || 
      c.id.startsWith('la-') || 
      c.agency?.toLowerCase().includes('louisiana') || 
      c.agency?.toLowerCase().includes('dotd')
  },
  { 
    id: 'MS', 
    label: 'Mississippi', 
    match: (c) => 
      c.city?.includes('MS') || 
      c.id.startsWith('mdot-') || 
      c.agency?.toLowerCase().includes('mdot') || 
      c.agency?.toLowerCase().includes('mississippi')
  },
  { 
    id: 'OK', 
    label: 'Oklahoma', 
    match: (c) => 
      c.city?.includes('OK') || 
      c.id.startsWith('okdot-') || 
      c.agency?.toLowerCase().includes('okdot') || 
      c.agency?.toLowerCase().includes('oktraffic') || 
      c.agency?.toLowerCase().includes('oklahoma')
  },
  { 
    id: 'AZ', 
    label: 'Arizona', 
    match: (c) => 
      c.city?.includes('AZ') || 
      c.id.startsWith('az511-') || 
      c.agency?.toLowerCase().includes('adot') || 
      c.agency?.toLowerCase().includes('az511') || 
      c.agency?.toLowerCase().includes('arizona')
  },
  { 
    id: 'NM', 
    label: 'New Mexico', 
    match: (c) => 
      c.city?.includes('NM') || 
      c.id.startsWith('nmroads-') || 
      c.id.startsWith('nmdot-') || 
      c.agency?.toLowerCase().includes('nmroads') || 
      c.agency?.toLowerCase().includes('nmdot') || 
      c.agency?.toLowerCase().includes('new mexico')
  },
  { 
    id: 'UT', 
    label: 'Utah', 
    match: (c) => 
      c.city?.includes('UT') || 
      c.id.startsWith('udot-') || 
      c.agency?.toLowerCase().includes('udot') || 
      c.agency?.toLowerCase().includes('utah')
  },
  { 
    id: 'AR', 
    label: 'Arkansas', 
    match: (c) => 
      c.city?.includes('AR') || 
      c.id.startsWith('ardot-') || 
      c.id.startsWith('idrivear-') || 
      c.agency?.toLowerCase().includes('ardot') || 
      c.agency?.toLowerCase().includes('idrive arkansas') || 
      c.agency?.toLowerCase().includes('arkansas')
  },
  { 
    id: 'AL', 
    label: 'Alabama', 
    match: (c) => 
      c.city?.includes('AL') || 
      c.id.startsWith('algo-') || 
      c.agency?.toLowerCase().includes('algo') || 
      c.agency?.toLowerCase().includes('alabama')
  },
  { 
    id: 'OR', 
    label: 'Oregon', 
    match: (c) => 
      c.city?.includes('OR') || 
      c.id.startsWith('odot-') || 
      c.agency?.toLowerCase().includes('odot') || 
      c.agency?.toLowerCase().includes('tripcheck') ||
      c.agency?.toLowerCase().includes('oregon')
  },
  { 
    id: 'WY', 
    label: 'Wyoming', 
    match: (c) => 
      c.city?.includes('WY') || 
      c.id.startsWith('wydot-') || 
      c.agency?.toLowerCase().includes('wydot') || 
      c.agency?.toLowerCase().includes('wyoroad') ||
      c.agency?.toLowerCase().includes('wyoming')
  },
  { 
    id: 'NY', 
    label: 'New York', 
    match: (c) => 
      c.city?.includes('NY') || 
      c.id.startsWith('ny511-') || 
      c.agency?.toLowerCase().includes('511ny') || 
      c.agency?.toLowerCase().includes('nysdot')
  },
  { 
    id: 'UK', 
    label: 'UK', 
    match: (c) => 
      c.city?.includes('UK') || 
      c.id.startsWith('tfl-') || 
      c.id.startsWith('uk-') || 
      c.agency?.toLowerCase().includes('transport for london') ||
      c.agency?.toLowerCase().includes('national highways') ||
      c.agency?.toLowerCase().includes('traffic scotland')
  },
  { 
    id: 'CAN', 
    label: 'Canada', 
    match: (c) => 
      c.city?.includes('BC') || 
      c.city?.includes('Ontario') || 
      c.id.startsWith('drivebc-') || 
      c.id.startsWith('ontario-') || 
      c.agency?.toLowerCase().includes('drivebc') ||
      c.agency?.toLowerCase().includes('ontario')
  },
  { 
    id: 'AU', 
    label: 'Australia', 
    match: (c) => 
      c.city?.includes('QLD') || 
      c.id.startsWith('au-') || 
      c.agency?.toLowerCase().includes('queensland')
  },
  { 
    id: 'INTL', 
    label: 'International', 
    match: (c) => 
      c.id.startsWith('sg-') || 
      c.id.startsWith('fi-') || 
      c.id.startsWith('isl-') || 
      c.city?.toLowerCase().includes('singapore') || 
      c.city?.toLowerCase().includes('helsinki') || 
      c.city?.toLowerCase().includes('iceland') || 
      c.city?.toLowerCase().includes('hong kong')
  }
];

const INITIAL_BATCH_SIZE = 48;
const LOAD_MORE_BATCH_SIZE = 36;

export const CCTVStreamViewer: React.FC<CCTVStreamViewerProps> = ({
  cameras,
  isOpen,
  onClose,
  onSelectCameraOnMap,
  pinnedCamIds = [],
  onTogglePin,
}) => {
  const [frameTimestamp, setFrameTimestamp] = useState<number>(Date.now());
  const [singleCamRefreshKeys, setSingleCamRefreshKeys] = useState<Record<string, number>>({});
  
  // Search and Filtering State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('ALL');
  const [feedTypeFilter, setFeedTypeFilter] = useState<FeedFilterType>('all');
  const [layoutMode, setLayoutMode] = useState<GridLayout>('standard');
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(15);
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState<boolean>(true);

  // Progressive Infinite Scroll State
  const [displayedCount, setDisplayedCount] = useState<number>(INITIAL_BATCH_SIZE);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset pagination when search or filters change
  useEffect(() => {
    setDisplayedCount(INITIAL_BATCH_SIZE);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [searchQuery, selectedRegionId, feedTypeFilter]);

  // Handle ESC Key to Close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-refresh snapshot timer
  useEffect(() => {
    if (!isOpen || !isAutoRefreshActive || refreshIntervalSec <= 0) return;
    const interval = setInterval(() => {
      setFrameTimestamp(Date.now());
    }, refreshIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [isOpen, isAutoRefreshActive, refreshIntervalSec]);

  // Manual full refresh
  const handleRefreshAll = useCallback(() => {
    setFrameTimestamp(Date.now());
    setSingleCamRefreshKeys({});
  }, []);

  // Refresh single camera snapshot
  const handleRefreshCamera = useCallback((camId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSingleCamRefreshKeys((prev) => ({
      ...prev,
      [camId]: Date.now(),
    }));
  }, []);

  // Compute camera counts per region category
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    REGION_CATEGORIES.forEach((cat) => {
      counts[cat.id] = 0;
    });

    if (!cameras) return counts;

    cameras.forEach((cam) => {
      REGION_CATEGORIES.forEach((cat) => {
        if (cat.id === 'ALL' || cat.match(cam)) {
          counts[cat.id] = (counts[cat.id] || 0) + 1;
        }
      });
    });

    return counts;
  }, [cameras]);

  // Filtered cameras based on Search, Region, and Feed Type
  const filteredCameras = useMemo(() => {
    if (!cameras || cameras.length === 0) return [];

    let list = cameras.filter((c) => Boolean(c.snapshotUrl || c.streamUrl));

    // Region category filter
    if (selectedRegionId !== 'ALL') {
      const activeCategory = REGION_CATEGORIES.find((c) => c.id === selectedRegionId);
      if (activeCategory) {
        list = list.filter((c) => activeCategory.match(c));
      }
    }

    // Feed type filter (Only Colorado cameras have live HLS video streams; California HLS cams removed)
    if (feedTypeFilter === 'video') {
      list = list.filter((c) => {
        const isCalifornia = c.city?.includes('CA') || c.id?.startsWith('caltrans-') || c.agency?.toLowerCase().includes('caltrans') || c.agency?.toLowerCase().includes('california');
        if (isCalifornia) return false;
        const isColorado = c.city?.includes('CO') || c.id?.startsWith('cotrip-') || c.agency?.toLowerCase().includes('colorado') || c.agency?.toLowerCase().includes('cdot');
        return isColorado && Boolean(c.streamUrl || c.videoUrl || c.feedType === 'VIDEO_STREAM' || c.feedType === 'HLS_STREAM');
      });
    } else if (feedTypeFilter === 'pinned') {
      list = list.filter((c) => pinnedCamIds.includes(c.id));
    }

    // Keyword search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        return (
          c.name?.toLowerCase().includes(q) ||
          c.highway?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.agency?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q) ||
          c.views?.some((v) => v.name?.toLowerCase().includes(q) || v.label?.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [cameras, selectedRegionId, feedTypeFilter, searchQuery, pinnedCamIds]);

  // Sliced cameras for progressive loading
  const visibleCameras = useMemo(() => {
    return filteredCameras.slice(0, displayedCount);
  }, [filteredCameras, displayedCount]);

  const hasMore = visibleCameras.length < filteredCameras.length;

  // Load more cameras handler
  const loadMore = useCallback(() => {
    if (hasMore) {
      setDisplayedCount((prev) => Math.min(prev + LOAD_MORE_BATCH_SIZE, filteredCameras.length));
    }
  }, [hasMore, filteredCameras.length]);

  // IntersectionObserver for Infinite Scrolling
  useEffect(() => {
    if (!isOpen) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1, rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, hasMore, loadMore]);

  // Scroll listener for back-to-top button
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setShowBackToTop(scrollContainerRef.current.scrollTop > 500);
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  // Layout Grid Classes
  const getGridClasses = () => {
    switch (layoutMode) {
      case 'dense':
        return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3';
      case 'list':
        return 'grid grid-cols-1 gap-2.5 max-w-3xl mx-auto';
      case 'standard':
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm select-none text-zinc-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Tactical Window Container matching LayerControlPanel & SettingsModal */}
      <div className="w-full max-w-6xl h-[92vh] max-h-[920px] bg-[#1c1c1c]/95 border border-[#2e2e2e] rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden text-zinc-200">
        
        {/* Streamlined Tactical Header */}
        <header className="shrink-0 bg-[#181818]/90 border-b border-[#282828] px-4 py-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            
            {/* Title & Quiet Feed Count */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#282828] border border-[#383838] flex items-center justify-center text-zinc-300">
                <Video className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-zinc-100">
                  Camera Feed Browser
                </h2>
                <span className="text-xs text-zinc-400 font-mono">
                  · {filteredCameras.length.toLocaleString()} feeds
                </span>
              </div>
            </div>

            {/* Centered Search Bar */}
            <div className="flex-1 max-w-md mx-auto w-full">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by street, highway, city, agency..."
                  className="w-full bg-[#141414] border border-[#2c2c2c] focus:border-[#3a3a3a] rounded-full pl-8 pr-8 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100 p-0.5 rounded-full hover:bg-[#282828] cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Header Controls: Auto-Refresh, Layout Mode & Close */}
            <div className="flex items-center justify-end gap-2 shrink-0">
              
              {/* Refresh Interval & Manual Trigger */}
              <div className="flex items-center gap-1 bg-[#141414] px-1.5 py-1 rounded-lg border border-[#262626]">
                <button
                  onClick={handleRefreshAll}
                  className="p-1 hover:bg-[#282828] text-zinc-400 hover:text-zinc-200 rounded transition-colors cursor-pointer"
                  title="Refresh snapshots"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <div className="h-3 w-px bg-[#2a2a2a]" />
                <select
                  value={refreshIntervalSec}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRefreshIntervalSec(val);
                    setIsAutoRefreshActive(val > 0);
                  }}
                  className="bg-transparent text-zinc-400 hover:text-zinc-200 text-[11px] focus:outline-none cursor-pointer pr-1"
                  title="Auto-refresh rate"
                >
                  <option value={10} className="bg-[#1c1c1c] text-zinc-200">10s</option>
                  <option value={15} className="bg-[#1c1c1c] text-zinc-200">15s</option>
                  <option value={30} className="bg-[#1c1c1c] text-zinc-200">30s</option>
                  <option value={60} className="bg-[#1c1c1c] text-zinc-200">60s</option>
                  <option value={0} className="bg-[#1c1c1c] text-zinc-200">Off</option>
                </select>
              </div>

              {/* Layout Mode Segmented Control */}
              <div className="hidden sm:flex items-center gap-0.5 bg-[#141414] p-0.5 rounded-lg border border-[#262626]">
                <button
                  onClick={() => setLayoutMode('standard')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    layoutMode === 'standard' ? 'bg-[#282828] text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Standard grid view"
                >
                  <Grid2X2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setLayoutMode('dense')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    layoutMode === 'dense' ? 'bg-[#282828] text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Dense grid view"
                >
                  <Grid3X3 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    layoutMode === 'list' ? 'bg-[#282828] text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="List view"
                >
                  <List className="w-3 h-3" />
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-[#282828] hover:bg-[#333333] border border-[#383838] text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>
        </header>

        {/* Cohesive Filter Bar (State Categories & Feed Type) */}
        <div className="shrink-0 bg-[#161616]/80 border-b border-[#242424] px-4 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          
          {/* State / Region Categories */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none">
            {REGION_CATEGORIES.map((category) => {
              const count = regionCounts[category.id] || 0;
              const isSelected = selectedRegionId === category.id;
              
              if (category.id !== 'ALL' && count === 0) return null;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedRegionId(category.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#2a2a2a] text-zinc-100 border border-[#383838] shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#202020]'
                  }`}
                >
                  <span>{category.label}</span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {count.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary Feed Filter (All / Live Streams / Pinned) */}
          <div className="flex items-center gap-1 shrink-0 bg-[#141414] p-0.5 rounded-lg border border-[#262626] text-xs self-start md:self-auto">
            <button
              onClick={() => setFeedTypeFilter('all')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                feedTypeFilter === 'all'
                  ? 'bg-[#282828] text-zinc-100 border border-[#383838]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Feeds
            </button>
            <button
              onClick={() => setFeedTypeFilter('video')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                feedTypeFilter === 'video'
                  ? 'bg-[#282828] text-zinc-100 border border-[#383838]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Radio className="w-3 h-3 text-zinc-400" />
              <span>Live Streams</span>
            </button>
            <button
              onClick={() => setFeedTypeFilter('pinned')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                feedTypeFilter === 'pinned'
                  ? 'bg-[#282828] text-zinc-100 border border-[#383838]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Pin className="w-3 h-3 text-zinc-400" />
              <span>Pinned ({pinnedCamIds.length})</span>
            </button>
          </div>

        </div>

        {/* Scrollable Camera Grid Content */}
        <main 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3.5 sm:p-4 bg-[#141414]/50 relative"
        >
          {filteredCameras.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-zinc-400 mb-3">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-medium text-zinc-200 mb-1">
                No camera feeds found
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mb-4">
                No cameras matched your active filter or search query. Try clearing filters or changing regions.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegionId('ALL');
                  setFeedTypeFilter('all');
                }}
                className="px-3.5 py-1.5 bg-[#282828] hover:bg-[#333333] text-zinc-200 text-xs font-medium rounded-lg border border-[#383838] transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              
              {/* Quiet Meta Line */}
              <div className="flex items-center justify-between text-xs text-zinc-400 px-0.5">
                <div className="flex items-center gap-1.5">
                  <span>Showing</span>
                  <span className="font-mono text-zinc-200 font-medium">
                    {visibleCameras.length.toLocaleString()}
                  </span>
                  <span>of</span>
                  <span className="font-mono text-zinc-200 font-medium">
                    {filteredCameras.length.toLocaleString()}
                  </span>
                  <span>cameras</span>
                </div>

                <div className="text-[11px] text-zinc-500 hidden sm:block">
                  Click a camera to locate on map
                </div>
              </div>

              {/* Camera Cards */}
              <div className={getGridClasses()}>
                {visibleCameras.map((cam) => {
                  const isPinned = pinnedCamIds.includes(cam.id);
                  const isCalifornia = cam.city?.includes('CA') || cam.id?.startsWith('caltrans-') || cam.agency?.toLowerCase().includes('caltrans') || cam.agency?.toLowerCase().includes('california');
                  const isColorado = cam.city?.includes('CO') || cam.id?.startsWith('cotrip-') || cam.agency?.toLowerCase().includes('colorado') || cam.agency?.toLowerCase().includes('cdot');
                  const isVideo = !isCalifornia && isColorado && Boolean(cam.streamUrl || cam.videoUrl || cam.feedType === 'VIDEO_STREAM' || cam.feedType === 'HLS_STREAM');
                  const singleKey = singleCamRefreshKeys[cam.id];
                  const activeTimestamp = singleKey || frameTimestamp;
                  const proxiedUrl = isVideo && cam.streamUrl
                    ? `/api/cctv/proxy?url=${encodeURIComponent(cam.snapshotUrl || '')}`
                    : `/api/cctv/proxy?url=${encodeURIComponent(cam.snapshotUrl || '')}&t=${activeTimestamp}`;

                  return (
                    <div
                      key={cam.id}
                      onClick={() => {
                        if (onSelectCameraOnMap) {
                          onSelectCameraOnMap(cam);
                          onClose();
                        }
                      }}
                      className="group flex flex-col bg-[#161616] hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#383838] rounded-xl overflow-hidden transition-all duration-150 shadow-sm cursor-pointer relative"
                    >
                      {/* Media Container (16:9) */}
                      <div className="relative aspect-video w-full bg-[#101010] overflow-hidden border-b border-[#222222]">
                        <CCTVImage
                          src={proxiedUrl}
                          fallbackSrc={cam.snapshotUrl}
                          streamUrl={isVideo ? (cam.streamUrl || cam.videoUrl) : undefined}
                          alt={cam.name}
                          className="w-full h-full object-cover"
                        />

                        {/* Top Left: Quiet LIVE indicator & Angles count */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <div className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-mono text-zinc-400 border border-white/10">
                            LIVE
                          </div>
                          {cam.views && cam.views.length > 1 && (
                            <div className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-mono text-zinc-300 border border-white/10">
                              {cam.views.length} Angles
                            </div>
                          )}
                        </div>

                        {/* Top Right: Pin and Refresh Controls */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          {onTogglePin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTogglePin(cam.id, e);
                              }}
                              className={`p-1.5 rounded-md backdrop-blur-sm transition-colors cursor-pointer ${
                                isPinned
                                  ? 'bg-zinc-200 text-zinc-950 font-bold'
                                  : 'bg-black/70 hover:bg-black text-zinc-300 hover:text-white border border-white/10'
                              }`}
                              title={isPinned ? 'Unpin camera' : 'Pin camera'}
                            >
                              {isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                            </button>
                          )}
                          <button
                            onClick={(e) => handleRefreshCamera(cam.id, e)}
                            className="p-1.5 rounded-md bg-black/70 hover:bg-black text-zinc-300 hover:text-white backdrop-blur-sm border border-white/10 transition-colors cursor-pointer"
                            title="Refresh frame"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Highway Tag if Available */}
                        {cam.highway && (
                          <div className="absolute bottom-2 left-2 max-w-[80%] truncate px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[9px] font-mono text-zinc-300 border border-white/10">
                            {cam.highway}
                          </div>
                        )}
                      </div>

                      {/* Card Content Details */}
                      <div className="p-2.5 flex flex-col justify-between flex-1 gap-1.5">
                        <div>
                          <h4 className="text-xs font-medium text-zinc-200 truncate group-hover:text-zinc-100 transition-colors" title={cam.name}>
                            {cam.name}
                          </h4>
                          
                          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-zinc-400">
                            <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span className="truncate">{cam.city || 'Municipal Area'}</span>
                          </div>
                        </div>

                        {/* Agency & View on Map Footer */}
                        <div className="pt-1.5 border-t border-[#222222] flex items-center justify-between text-[10px] text-zinc-500">
                          <span className="truncate max-w-[130px]" title={cam.agency}>
                            {cam.agency || 'Traffic DOT'}
                          </span>

                          <div className="flex items-center gap-1 text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium">
                            <span>View on map</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Infinite Scroll Sentinel */}
              <div ref={sentinelRef} className="py-5 flex flex-col items-center justify-center gap-2">
                {hasMore ? (
                  <div className="flex flex-col items-center gap-2 text-xs text-zinc-400">
                    <span className="font-mono text-[11px] text-zinc-500">
                      Loading more feeds on scroll...
                    </span>
                    <button
                      onClick={loadMore}
                      className="px-3 py-1 bg-[#242424] hover:bg-[#2c2c2c] text-zinc-300 rounded-lg text-xs font-medium border border-[#333333] cursor-pointer transition-colors"
                    >
                      Load More ({filteredCameras.length - visibleCameras.length} remaining)
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 py-2 font-mono">
                    All {filteredCameras.length.toLocaleString()} feeds loaded
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Floating Back to Top Button */}
          {showBackToTop && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 z-30 p-2 bg-[#222222] hover:bg-[#2c2c2c] text-zinc-200 hover:text-white rounded-full border border-[#383838] shadow-xl transition-all duration-150 cursor-pointer flex items-center gap-1 text-xs font-medium backdrop-blur-md"
              title="Scroll to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Top</span>
            </button>
          )}
        </main>

      </div>
    </div>
  );
};
