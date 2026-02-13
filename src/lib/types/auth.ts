import type { User } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? "",
    createdAt: user.created_at,
  };
}
