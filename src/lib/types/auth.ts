import type { User } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  realName: string;
  realNamePrivate: boolean;
  createdAt: string;
}

export function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? "",
    displayName: (user.user_metadata?.displayName as string) ?? "",
    realName: (user.user_metadata?.realName as string) ?? "",
    realNamePrivate: (user.user_metadata?.realNamePrivate as boolean) ?? true,
    createdAt: user.created_at,
  };
}
