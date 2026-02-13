"use client";

import { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </AuthProvider>
  );
}
