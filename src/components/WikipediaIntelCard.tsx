import React from 'react';
import { 
  BookOpen, 
  X, 
  ExternalLink, 
  MapPin, 
  GripHorizontal
} from 'lucide-react';
import { WikiSummaryResult } from '../utils/wikiApi';
import { useDraggable } from '../hooks/useDraggable';

interface WikipediaIntelCardProps {
  wikiData: WikiSummaryResult | null;
  onClose: () => void;
  onTeleportToLocation?: (lat: number, lon: number, name: string) => void;
}

export const WikipediaIntelCard: React.FC<WikipediaIntelCardProps> = ({
  wikiData,
  onClose,
  onTeleportToLocation,
}) => {
  const { style: dragStyle, dragProps } = useDraggable();

  if (!wikiData) return null;

  return (
    <div
      style={dragStyle}
      {...dragProps}
      className="fixed bottom-6 right-4 sm:right-6 z-40 w-[92vw] sm:w-[380px] max-w-lg bg-[#1c1c1c]/95 border border-[#2e2e2e] rounded-2xl shadow-xl backdrop-blur-md text-zinc-200 overflow-hidden select-none"
    >
      {/* Drag Handle & Header */}
      <div 
        data-drag-handle
        className="flex items-center justify-between px-3.5 py-2.5 bg-[#181818]/90 border-b border-[#282828] cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-zinc-500 shrink-0" />
          <div className="p-1 rounded-md bg-[#282828] text-zinc-300 border border-[#333333] shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-300 tracking-wider uppercase">Wikipedia Brief</span>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-[#282828] text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          title="Close Wikipedia Brief"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
        {/* Article Title & Subtitle */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-100 tracking-tight leading-snug">
              {wikiData.title}
            </h3>
            {wikiData.coordinates && (
              <button
                onClick={() => onTeleportToLocation?.(wikiData.coordinates!.lat, wikiData.coordinates!.lon, wikiData.title)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-[#282828] hover:bg-[#333333] border border-[#383838] text-zinc-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Teleport to location on map"
              >
                <MapPin className="w-3 h-3 text-zinc-400" />
                <span>Map Location</span>
              </button>
            )}
          </div>

          {wikiData.description && (
            <p className="text-xs text-zinc-400 mt-0.5">
              {wikiData.description}
            </p>
          )}
        </div>

        {/* Featured Image Thumbnail (Inline without modal popup) */}
        {(wikiData.thumbnailUrl || wikiData.originalImageUrl) && (
          <div className="rounded-xl overflow-hidden border border-[#282828] bg-[#141414] max-h-40 flex items-center justify-center">
            <img
              src={wikiData.thumbnailUrl || wikiData.originalImageUrl}
              alt={wikiData.title}
              className="w-full h-36 object-cover object-center"
            />
          </div>
        )}

        {/* Extract Briefing Text */}
        <div className="text-xs text-zinc-300 leading-relaxed bg-[#141414] p-3 rounded-xl border border-[#262626]">
          {wikiData.extract}
        </div>

        {/* Action Bar */}
        {wikiData.pageUrl && (
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#282828]">
            <a
              href={wikiData.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#282828] hover:bg-[#333333] text-zinc-300 hover:text-zinc-100 border border-[#383838] flex items-center gap-1.5 transition-colors"
            >
              <span>Read Article</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
