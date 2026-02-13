"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";

const navItems = [
  { href: "/", label: "Dashboard", icon: "⚔️" },
  { href: "/builder", label: "List Builder", icon: "📜" },
  { href: "/tournaments", label: "Tournaments", icon: "🏆" },
  { href: "/players", label: "Players", icon: "👤" },
  { href: "/collection", label: "Collection", icon: "📦" },
  { href: "/wiki", label: "Wiki", icon: "📖" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-stone-700/50 bg-stone-900/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl">⚔️</span>
            <span className="text-lg font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
              SIFPH
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-amber-900/30 text-amber-400"
                        : "text-stone-400 hover:text-stone-200 hover:bg-stone-800"
                    }
                  `}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            <div className="ml-2 pl-2 border-l border-stone-700/50">
              <UserMenu />
            </div>
          </div>

          {/* Mobile: User Menu only in header */}
          <div className="flex md:hidden items-center">
            <UserMenu />
          </div>
        </div>

        {/* Mobile Nav Row */}
        <div className="flex md:hidden overflow-x-auto gap-1 pb-2 -mx-4 px-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors
                  ${
                    isActive
                      ? "bg-amber-900/30 text-amber-400"
                      : "text-stone-400 hover:text-stone-200"
                  }
                `}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
