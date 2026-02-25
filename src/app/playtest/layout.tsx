"use client";

import { PlaytestImageProvider } from "@/contexts/PlaytestImageContext";

export default function PlaytestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlaytestImageProvider>{children}</PlaytestImageProvider>;
}
