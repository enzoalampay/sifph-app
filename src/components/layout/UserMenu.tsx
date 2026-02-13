"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";

export function UserMenu() {
  const { user, initialized, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render anything until auth is initialized
  if (!initialized) return null;

  // Logged out — show sign-in button
  if (!user) {
    return (
      <Link href="/login">
        <Button variant="ghost" size="sm">
          Sign In
        </Button>
      </Link>
    );
  }

  // Logged in — avatar + dropdown
  const initials = user.email.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    router.push("/login");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-stone-300 hover:text-stone-100 hover:bg-stone-800 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-amber-900/40 border border-amber-800/50 flex items-center justify-center">
          <span className="text-amber-400 text-[10px] font-bold">
            {initials}
          </span>
        </div>
        <span className="hidden md:block text-xs text-stone-400 max-w-[120px] truncate">
          {user.email}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border border-stone-700/50 bg-stone-800/95 backdrop-blur-md shadow-lg z-50">
          <div className="px-4 py-3 border-b border-stone-700/50">
            <p className="text-[10px] text-stone-500 uppercase tracking-wider">
              Signed in as
            </p>
            <p className="text-sm font-medium text-stone-200 truncate mt-0.5">
              {user.email}
            </p>
          </div>

          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-stone-300 hover:bg-stone-700/50 hover:text-stone-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
