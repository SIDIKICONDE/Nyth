import type { User } from "@/contexts/auth/types";
import type { UserProfile } from "@/types/user";

export type SimpleT = (key: string, defaultValue?: string) => string;

function getLastNameFromString(name?: string | null): string | null {
  if (!name) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  const last = parts[parts.length - 1];
  return last || null;
}

export function getPreferredLastName(
  profile?: UserProfile | null,
  user?: User | null
): string | null {
  if (profile?.lastName && profile.lastName.trim())
    return profile.lastName.trim();
  const fromProfile = getLastNameFromString(profile?.displayName || null);
  if (fromProfile) return fromProfile;
  const fromUser = getLastNameFromString(
    user?.displayName || (user as { name?: string | null })?.name || null
  );
  if (fromUser) return fromUser;
  return null;
}

export function getUserLabelLastName(
  profile: UserProfile | null | undefined,
  user: User | null | undefined,
  t?: SimpleT
): string {
  const last = getPreferredLastName(profile || null, user || null);
  if (last) return last;
  const emailLocal = user?.email ? user.email.split("@")[0] : null;
  if (emailLocal) return emailLocal;
  return t ? t("fab.user.default", "Utilisateur") : "Utilisateur";
}
