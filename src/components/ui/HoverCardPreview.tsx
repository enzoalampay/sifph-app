"use client";

import { useState, useRef, useCallback, ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { FactionId } from "@/lib/types/game-data";
import { getPlaytestCardImageUrl } from "@/lib/utils/card-images";
import { usePlaytestImageContext } from "@/contexts/PlaytestImageContext";

interface HoverCardPreviewProps {
  cardId: string;
  faction: FactionId;
  children: ReactNode;
  className?: string;
}

export function HoverCardPreview({
  cardId,
  faction,
  children,
  className = "",
}: HoverCardPreviewProps) {
  const [visible, setVisible] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { usePlaytestImages } = usePlaytestImageContext();
  const imageUrl = getPlaytestCardImageUrl(cardId, faction, usePlaytestImages);

  // Only render portal after mount (SSR-safe)
  useEffect(() => {
    setMounted(true);
  }, []);

  const showPreview = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const imgWidth = 280;
        const imgHeight = 400;

        // Position to the right of the element by default
        let left = rect.right + 12;
        let top = rect.top - 40;

        // If it goes off the right edge, show on the left
        if (left + imgWidth > window.innerWidth - 8) {
          left = rect.left - imgWidth - 12;
        }

        // If it goes off the left edge, center it above
        if (left < 8) {
          left = Math.max(8, (window.innerWidth - imgWidth) / 2);
          top = rect.top - imgHeight - 8;
        }

        // If it goes off the bottom, shift up
        if (top + imgHeight > window.innerHeight - 8) {
          top = Math.max(8, window.innerHeight - imgHeight - 8);
        }

        // If it goes off the top, shift down
        if (top < 8) {
          top = 8;
        }

        setPosition({ top, left });
      }
      setVisible(true);
    }, 200);
  }, []);

  const hidePreview = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Reset load state when cardId changes
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [cardId, faction]);

  const preview =
    visible && mounted
      ? createPortal(
          <div
            className="fixed pointer-events-none"
            style={{
              top: position.top,
              left: position.left,
              width: 280,
              zIndex: 99999,
            }}
          >
            <div className="rounded-lg overflow-hidden shadow-2xl border border-stone-600 bg-stone-900">
              {!imgLoaded && !imgError && (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {imgError ? (
                <div className="flex items-center justify-center h-24">
                  <p className="text-[10px] text-stone-500">No preview</p>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt="Card preview"
                  className="w-full"
                  onLoad={() => setImgLoaded(true)}
                  onError={() => {
                    setImgLoaded(true);
                    setImgError(true);
                  }}
                  style={{
                    display: imgLoaded && !imgError ? "block" : "none",
                  }}
                />
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <span
        ref={wrapperRef}
        className={className}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        style={{ cursor: "default" }}
      >
        {children}
      </span>
      {preview}
    </>
  );
}
