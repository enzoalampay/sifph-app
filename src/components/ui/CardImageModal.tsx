"use client";

import { useState, useCallback } from "react";
import { Modal } from "./Modal";
import { FactionId } from "@/lib/types/game-data";
import {
  getCardImageUrl,
  getCardBackImageUrl,
} from "@/lib/utils/card-images";

interface CardImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  cardName: string;
  faction: FactionId;
}

export function CardImageModal({
  isOpen,
  onClose,
  cardId,
  cardName,
  faction,
}: CardImageModalProps) {
  const [showBack, setShowBack] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [backImgError, setBackImgError] = useState(false);
  const [loading, setLoading] = useState(true);

  const frontUrl = getCardImageUrl(cardId, faction);
  const backUrl = getCardBackImageUrl(cardId, faction);

  const handleClose = useCallback(() => {
    setShowBack(false);
    setImgError(false);
    setBackImgError(false);
    setLoading(true);
    onClose();
  }, [onClose]);

  const currentUrl = showBack ? backUrl : frontUrl;
  const currentError = showBack ? backImgError : imgError;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={cardName} size="lg">
      <div className="flex flex-col items-center gap-3">
        {/* Card image */}
        <div className="relative w-full max-w-md mx-auto">
          {loading && !currentError && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-900 rounded-lg">
              <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {currentError ? (
            <div className="flex items-center justify-center h-64 bg-stone-900 rounded-lg border border-stone-700">
              <p className="text-sm text-stone-500">
                Card image not available
              </p>
            </div>
          ) : (
            <img
              key={currentUrl}
              src={currentUrl}
              alt={`${cardName} - ${showBack ? "Back" : "Front"}`}
              className="w-full rounded-lg shadow-xl"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                if (showBack) setBackImgError(true);
                else setImgError(true);
              }}
              style={{ display: loading ? "none" : "block" }}
            />
          )}
        </div>

        {/* Front / Back toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowBack(false);
              setLoading(true);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              !showBack
                ? "bg-amber-900/40 border-amber-600 text-amber-300"
                : "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
            }`}
          >
            Front
          </button>
          <button
            onClick={() => {
              setShowBack(true);
              setLoading(true);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              showBack
                ? "bg-amber-900/40 border-amber-600 text-amber-300"
                : "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
            }`}
          >
            Back
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---- Hook for managing card viewer state ----

export interface CardViewerState {
  isOpen: boolean;
  cardId: string;
  cardName: string;
  faction: FactionId;
}

const CLOSED_STATE: CardViewerState = {
  isOpen: false,
  cardId: "",
  cardName: "",
  faction: "neutral",
};

export function useCardViewer() {
  const [state, setState] = useState<CardViewerState>(CLOSED_STATE);

  const openCard = useCallback(
    (cardId: string, cardName: string, faction: FactionId) => {
      setState({ isOpen: true, cardId, cardName, faction });
    },
    []
  );

  const closeCard = useCallback(() => {
    setState(CLOSED_STATE);
  }, []);

  return { cardViewer: state, openCard, closeCard };
}
