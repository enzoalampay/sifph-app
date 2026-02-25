import type { Metadata } from "next";
import { Rosario, Geist_Mono, Cinzel } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "./client-layout";

const rosario = Rosario({
  variable: "--font-rosario",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "SIFPH - A Song of Ice and Fire Tournament Manager",
  description:
    "Army list builder, tournament management, and player stats for ASOIAF: The Miniatures Game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${rosario.variable} ${geistMono.variable} ${cinzel.variable} antialiased min-h-screen bg-[#0d0b0b]`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
