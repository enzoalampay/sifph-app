"use client";

import { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">{children}</main>
      <footer className="text-center py-4 text-[10px] text-stone-600">
        Icons by{" "}
        <a
          href="https://game-icons.net"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-stone-400 transition-colors"
        >
          game-icons.net
        </a>{" "}
        (CC BY 3.0)
      </footer>
    </AuthProvider>
  );
}
