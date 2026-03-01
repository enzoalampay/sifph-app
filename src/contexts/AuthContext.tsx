"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthUser, mapSupabaseUser } from "@/lib/types/auth";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface ProfileMetadata {
  displayName: string;
  realName: string;
  realNamePrivate: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  signUp: (
    email: string,
    password: string,
    metadata?: ProfileMetadata
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (
    data: Partial<ProfileMetadata>
  ) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(mapSupabaseUser(session?.user ?? null));
      setInitialized(true);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapSupabaseUser(session?.user ?? null));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, metadata?: ProfileMetadata) => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: metadata ? { data: metadata } : undefined,
        });
        return { error: error?.message ?? null };
      } catch (err) {
        return { error: (err as Error).message };
      }
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return { error: error?.message ?? null };
      } catch (err) {
        return { error: (err as Error).message };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<ProfileMetadata>) => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ data });
        return { error: error?.message ?? null };
      } catch (err) {
        return { error: (err as Error).message };
      }
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, initialized, signUp, signIn, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
