import React from 'react';
import { Play, Pause, Globe, Sliders, Check, Eye } from 'lucide-react';

export interface RadarFrame {
  time: number;
  path: string;
  isForecast: boolean;
  label: string;
  host: string;
}

interface RadarTimelineHUDProps {
  isVisible: boolean;
  radarSource: 'nexrad' | 'global';
  onRadarSourceChange: (source: 'nexrad' | 'global') => void;
  frames: RadarFrame[];
  currentFrameIndex: number;
  onFrameIndexChange: (idx: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  radarOpacity: number;
  onOpacityChange: (opacity: number) => void;
  isLoading: boolean;
}

export const RadarTimelineHUD: React.FC<RadarTimelineHUDProps> = ({
  isVisible,
  radarSource,
  onRadarSourceChange,
  frames,
  currentFrameIndex,
  onFrameIndexChange,
  isPlaying,
  onTogglePlay,
  radarOpacity,
  onOpacityChange,
  isLoading,
}) => {
  if (!isVisible) return null;

  const currentFrame = frames[currentFrameIndex];
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString(navigator.language, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div 
      id="radar-timeline-hud"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] w-full max-w-2xl px-4 md:px-0"
    >
      <div className="bg-[#1e1e1e]/95 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-zinc-200">
        
        {/* Top Control Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div>
              <span className="text-xs font-semibold text-zinc-100 tracking-wider uppercase">
                Doppler Weather Radar
              </span>
              <p className="text-[10px] text-zinc-400">
                {radarSource === 'nexrad' 
                  ? 'High-Resolution USA NEXRAD Radar Composite'
                  : currentFrame 
                    ? `${currentFrame.isForecast ? 'Forecast model' : 'Observed precipitation'} • ${formatTime(currentFrame.time)}`
                    : 'Global Radar Composite'}
              </p>
            </div>
          </div>

          {/* Source Tabs */}
          <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg select-none self-end sm:self-auto">
            <button
              onClick={() => onRadarSourceChange('global')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                radarSource === 'global'
                  ? 'bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Global & Forecast
            </button>
            <button
              onClick={() => onRadarSourceChange('nexrad')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                radarSource === 'nexrad'
                  ? 'bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              US NEXRAD
            </button>
          </div>
        </div>

        {/* Timeline Slider and Controls */}
        {radarSource === 'global' ? (
          <div className="flex items-center gap-3 w-full">
            {/* Play / Pause */}
            <button
              onClick={onTogglePlay}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 rounded-xl transition-all shadow cursor-pointer flex-shrink-0"
              title={isPlaying ? 'Pause Playback' : 'Loop Playback'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>

            {/* Slider track container */}
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <div className="flex justify-between items-center text-[10px] text-zinc-400 px-1 font-mono">
                <span>{frames[0] ? frames[0].label : '-1h'}</span>
                <span className="text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700/50">
                  {currentFrame ? currentFrame.label : 'LIVE'}
                </span>
                <span>{frames[frames.length - 1] ? frames[frames.length - 1].label : '+1h'}</span>
              </div>

              {/* Range input */}
              <input
                type="range"
                min={0}
                max={frames.length - 1}
                value={currentFrameIndex}
                onChange={(e) => onFrameIndexChange(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-zinc-850 hover:bg-zinc-800 accent-zinc-200 rounded-lg cursor-pointer transition-all"
                style={{
                  background: `linear-gradient(to right, rgb(228, 228, 231) 0%, rgb(228, 228, 231) ${
                    (currentFrameIndex / Math.max(1, frames.length - 1)) * 100
                  }%, rgb(39, 39, 42) ${
                    (currentFrameIndex / Math.max(1, frames.length - 1)) * 100
                  }%, rgb(39, 39, 42) 100%)`
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-2 bg-zinc-900 border border-zinc-800/50 rounded-xl text-center">
            <span className="text-[10px] text-zinc-400">
              Real-time NEXRAD feeds are streamed live directly from NWS servers. Playback timeline is supported in Global mode.
            </span>
          </div>
        )}

        {/* Bottom Metadata & Opacity */}
        <div className="flex items-center justify-between gap-4 text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/50">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-zinc-500 truncate">
              {isLoading ? 'Synchronizing radar cells...' : 'Global Doppler mesh online'}
            </span>
          </div>

          {/* Opacity Control */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Sliders className="w-3.5 h-3.5 text-zinc-500" />
            <span className="font-mono">Opacity: {Math.round(radarOpacity * 100)}%</span>
            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={radarOpacity * 100}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value) / 100)}
              className="w-16 h-1 bg-zinc-800 accent-zinc-300 rounded-lg cursor-pointer"
            />
          </div>
        </div>

      </div>
    </div>
  );
};
