import React, { useState, useRef, useCallback } from 'react';

interface UseDraggableOptions {
  requireHandle?: boolean;
  minTopMargin?: number;
}

export function useDraggable(options?: UseDraggableOptions) {
  const requireHandle = options?.requireHandle ?? true;
  const minTopMargin = options?.minTopMargin ?? 0;
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 0, y: 0 });
  const initialHandleRectRef = useRef<DOMRect | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;

    // Only allow dragging if initiated on a [data-drag-handle] element (when requireHandle is true)
    if (requireHandle && !target.closest('[data-drag-handle]')) {
      return;
    }

    // Do not initiate drag if user is clicking interactive controls
    if (target.closest('button, input, select, textarea, a, [data-no-drag]')) {
      return;
    }

    const container = e.currentTarget as HTMLElement;
    const handle = (container.querySelector('[data-drag-handle]') as HTMLElement) || container;
    
    initialHandleRectRef.current = handle.getBoundingClientRect();

    isDraggingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = { ...position };
    try {
      container.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }, [position, requireHandle]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    let dx = e.clientX - startPosRef.current.x;
    let dy = e.clientY - startPosRef.current.y;

    if (initialHandleRectRef.current) {
      const rect = initialHandleRectRef.current;
      const hHeight = Math.max(rect.height, 28);
      const hWidth = Math.max(rect.width, 40);

      // Clamp vertical movement so top bar never goes above screen or below screen
      const minDy = minTopMargin - rect.top;
      const maxDy = window.innerHeight - rect.top - hHeight;
      dy = Math.max(minDy, Math.min(dy, maxDy));

      // Clamp horizontal movement so at least 40px of top bar remains visible on screen
      const minDx = -rect.left - hWidth + 40;
      const maxDx = window.innerWidth - rect.left - 40;
      dx = Math.max(minDx, Math.min(dx, maxDx));
    }

    setPosition({
      x: initialPosRef.current.x + dx,
      y: initialPosRef.current.y + dy,
    });
  }, [minTopMargin]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      initialHandleRectRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  }, []);

  const resetPosition = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  return {
    style: { transform: `translate3d(${position.x}px, ${position.y}px, 0)` },
    dragProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
    resetPosition,
    isMoved: position.x !== 0 || position.y !== 0,
  };
}
