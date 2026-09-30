import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface CCTVImageProps {
  src: string;
  streamUrl?: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  onError?: () => void;
  onLoad?: () => void;
}

const stripCacheBuster = (url?: string | null): string => {
  if (!url) return '';
  return url
    .replace(/([?&])t=\d+(&|$)/, (_m, p1, p2) => (p2 === '&' ? p1 : ''))
    .replace(/[?&]$/, '');
};

export const CCTVImage: React.FC<CCTVImageProps> = ({
  src,
  streamUrl,
  alt,
  fallbackSrc,
  className = '',
  onError,
  onLoad,
}) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [streamFailed, setStreamFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Active stream URL to use if video stream is available and has not failed
  const activeStream = !streamFailed && streamUrl ? streamUrl : null;

  // Extract raw underlying URL from proxied or direct URL
  const rawTargetUrl = (() => {
    try {
      const target = activeStream || src;
      if (target.includes('proxy?url=')) {
        const match = target.match(/proxy\?url=([^&]+)/);
        if (match && match[1]) {
          return decodeURIComponent(match[1]);
        }
      }
      return target;
    } catch {
      return activeStream || src;
    }
  })();

  const directTarget = rawTargetUrl && rawTargetUrl.startsWith('http') && !rawTargetUrl.includes('/api/cctv/proxy') ? rawTargetUrl : null;
  const effectiveFallback = fallbackSrc || directTarget;
  const effectiveSrc = isUsingFallback && effectiveFallback ? effectiveFallback : src;

  const decodedUrl = rawTargetUrl;

  const isImageFormat = Boolean(
    decodedUrl && (
      decodedUrl.toLowerCase().includes('.jpg') ||
      decodedUrl.toLowerCase().includes('.jpeg') ||
      decodedUrl.toLowerCase().includes('format=jpg') ||
      decodedUrl.toLowerCase().includes('.png') ||
      decodedUrl.toLowerCase().includes('/snapshot') ||
      decodedUrl.toLowerCase().includes('tripcheck.com') ||
      decodedUrl.toLowerCase().includes('wyoroad.info') ||
      decodedUrl.toLowerCase().includes('web-cam')
    )
  );

  const isHlsStream = Boolean(
    activeStream || (
      decodedUrl && !isImageFormat && (
        decodedUrl.toLowerCase().includes('.m3u8') ||
        decodedUrl.toLowerCase().includes('/hls/') ||
        (decodedUrl.toLowerCase().includes('hls') && !decodedUrl.includes('wyoroad') && !decodedUrl.includes('tripcheck')) ||
        decodedUrl.toLowerCase().includes('/playlist') ||
        decodedUrl.toLowerCase().includes('/manifest') ||
        decodedUrl.toLowerCase().includes('.mp4')
      )
    )
  );

  // Track resource identity to only show loading on actual camera change, never on periodic background refreshes
  const baseSrc = stripCacheBuster(src);
  const baseStream = stripCacheBuster(streamUrl);
  const resourceKey = `${baseStream}::${baseSrc}`;
  const lastResourceKeyRef = useRef<string>('');

  useEffect(() => {
    if (lastResourceKeyRef.current !== resourceKey) {
      lastResourceKeyRef.current = resourceKey;
      setLoading(true);
      setHasError(false);
      setIsUsingFallback(false);
      setStreamFailed(false);
    }
  }, [resourceKey]);

  // Stream source to play
  const streamSource = activeStream || (isHlsStream ? effectiveSrc : null);
  const baseStreamSource = stripCacheBuster(streamSource);

  // Handle HLS stream video rendering without re-triggering on query-param timestamp changes
  useEffect(() => {
    if (!isHlsStream || !videoRef.current || hasError || !streamSource) return;

    const video = videoRef.current;
    let hls: Hls | null = null;
    let retryCount = 0;

    // Timeout: If stream doesn't successfully start playing within 4.5s, fall back to snapshot image
    const streamTimeout = setTimeout(() => {
      if (activeStream) {
        setStreamFailed(true);
      } else if (fallbackSrc && !isUsingFallback) {
        setIsUsingFallback(true);
      }
    }, 4500);

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        manifestLoadingTimeOut: 3500,
        levelLoadingTimeOut: 3500,
      });
      hlsRef.current = hls;

      hls.loadSource(streamSource);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        clearTimeout(streamTimeout);
        setLoading(false);
        video.play().catch(() => {});
        if (onLoad) onLoad();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && retryCount < 1) {
            retryCount++;
            hls?.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR && retryCount < 1) {
            retryCount++;
            hls?.recoverMediaError();
          } else {
            clearTimeout(streamTimeout);
            hls?.destroy();
            if (activeStream) {
              // Video stream failed, fall back to still image snapshot
              setStreamFailed(true);
            } else if (fallbackSrc && !isUsingFallback) {
              setIsUsingFallback(true);
            } else {
              setHasError(true);
              if (onError) onError();
            }
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamSource;
      video.addEventListener('loadedmetadata', () => {
        clearTimeout(streamTimeout);
        setLoading(false);
        video.play().catch(() => {});
        if (onLoad) onLoad();
      });
      video.addEventListener('error', () => {
        clearTimeout(streamTimeout);
        if (activeStream) {
          setStreamFailed(true);
        } else if (fallbackSrc && !isUsingFallback) {
          setIsUsingFallback(true);
        } else {
          setHasError(true);
          if (onError) onError();
        }
      });
    }

    return () => {
      clearTimeout(streamTimeout);
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
    };
  }, [baseStreamSource, isHlsStream, hasError, fallbackSrc, isUsingFallback]);

  const isMdotFeed = Boolean(
    (effectiveSrc && (effectiveSrc.includes('mdottraffic.com') || effectiveSrc.includes('mdot-'))) ||
    (streamSource && (streamSource.includes('mdottraffic.com') || streamSource.includes('mdot-'))) ||
    (alt && alt.toLowerCase().includes('mdot'))
  );

  if (hasError) {
    if (isMdotFeed) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-[#141414] border border-[#262626] select-none">
          <div className="w-8 h-8 rounded-full bg-[#222222] border border-[#333333] flex items-center justify-center mb-2">
            <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <span className="text-zinc-200 text-xs font-semibold">Feed Blocked by MDOT Traffic</span>
          <span className="text-zinc-400 text-[11px] mt-1 max-w-[260px] leading-tight">
            Upstream firewall (HTTP 403) blocks automated streaming requests.
          </span>
          <a
            href="https://www.mdottraffic.com/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-[#222222] hover:bg-[#2c2c2c] border border-[#383838] rounded-lg text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <span>Open on MDOTtraffic.com</span>
            <svg className="w-3 h-3 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-[#181818]">
        <span className="text-zinc-500 text-xs font-medium">Stream / Snapshot Unavailable</span>
      </div>
    );
  }

  if (isHlsStream && !streamFailed) {
    return (
      <div className="relative w-full h-full bg-[#181818]">
        <video
          ref={videoRef}
          className={`${className} opacity-100 w-full h-full object-cover`}
          muted
          playsInline
          autoPlay
          onLoadedData={() => setLoading(false)}
          onError={() => {
            if (activeStream) {
              setStreamFailed(true);
            } else if (fallbackSrc && !isUsingFallback) {
              setIsUsingFallback(true);
            } else {
              setHasError(true);
              if (onError) onError();
            }
          }}
        />
        {loading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#141414] z-10 pointer-events-none">
            <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-[#181818]">
      <img
        src={effectiveSrc}
        alt={alt}
        className={`${className} opacity-100`}
        onLoad={() => {
          setLoading(false);
          if (onLoad) onLoad();
        }}
        onError={() => {
          if (effectiveFallback && !isUsingFallback && effectiveFallback !== src) {
            setIsUsingFallback(true);
            setLoading(true);
          } else {
            setHasError(true);
            if (onError) onError();
          }
        }}
      />
      {loading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#141414] z-10 pointer-events-none">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
        </div>
      )}
    </div>
  );
};
