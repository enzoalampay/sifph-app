"use client";

import { createContext, useContext, ReactNode } from "react";

interface PlaytestImageContextValue {
  usePlaytestImages: boolean;
}

const PlaytestImageContext = createContext<PlaytestImageContextValue>({
  usePlaytestImages: false,
});

export function PlaytestImageProvider({ children }: { children: ReactNode }) {
  return (
    <PlaytestImageContext.Provider value={{ usePlaytestImages: true }}>
      {children}
    </PlaytestImageContext.Provider>
  );
}

export function usePlaytestImageContext(): PlaytestImageContextValue {
  return useContext(PlaytestImageContext);
}
