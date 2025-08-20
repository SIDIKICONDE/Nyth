import { SocialField } from "./types";

export const getSocialFields = (
  t: (key: string, fallback: string) => string
): SocialField[] => [
  {
    name: "twitter",
    icon: "twitter",
    placeholder: t(
      "profile.editProfile.social.placeholders.twitter",
      "Nom d'utilisateur Twitter"
    ),
    baseUrl: "https://twitter.com/",
  },
  {
    name: "linkedin",
    icon: "linkedin",
    placeholder: t(
      "profile.editProfile.social.placeholders.linkedin",
      "Nom d'utilisateur LinkedIn"
    ),
    baseUrl: "https://linkedin.com/in/",
  },
  {
    name: "github",
    icon: "github",
    placeholder: t(
      "profile.editProfile.social.placeholders.github",
      "Nom d'utilisateur GitHub"
    ),
    baseUrl: "https://github.com/",
  },
  {
    name: "youtube",
    icon: "youtube",
    placeholder: t(
      "profile.editProfile.social.placeholders.youtube",
      "Nom de chaîne YouTube"
    ),
    baseUrl: "https://youtube.com/@",
  },
  {
    name: "instagram",
    icon: "instagram",
    placeholder: t(
      "profile.editProfile.social.placeholders.instagram",
      "Nom d'utilisateur Instagram"
    ),
    baseUrl: "https://instagram.com/",
  },
];

// Fallback pour la compatibilité
export const SOCIAL_FIELDS: SocialField[] = [
  {
    name: "twitter",
    icon: "twitter",
    placeholder: "Nom d'utilisateur Twitter",
    baseUrl: "https://twitter.com/",
  },
  {
    name: "linkedin",
    icon: "linkedin",
    placeholder: "Nom d'utilisateur LinkedIn",
    baseUrl: "https://linkedin.com/in/",
  },
  {
    name: "github",
    icon: "github",
    placeholder: "Nom d'utilisateur GitHub",
    baseUrl: "https://github.com/",
  },
  {
    name: "youtube",
    icon: "youtube",
    placeholder: "Nom de chaîne YouTube",
    baseUrl: "https://youtube.com/@",
  },
  {
    name: "instagram",
    icon: "instagram",
    placeholder: "Nom d'utilisateur Instagram",
    baseUrl: "https://instagram.com/",
  },
];
