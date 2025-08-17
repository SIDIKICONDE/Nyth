import { SocialPlatform } from "../types";

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: "tiktok",
    name: "TikTok",
    icon: "🎵",
    color: "#000000",
    packageName: "com.zhiliaoapp.musically",
    urlScheme: "tiktok://",
    webUrl: "https://www.tiktok.com/upload",
    maxDuration: 180, // 3 minutes
    recommendedFormat: {
      quality: "1080p",
      aspectRatio: { width: 9, height: 16 },
    },
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    color: "#E4405F",
    packageName: "com.instagram.android",
    urlScheme: "instagram://",
    webUrl: "https://www.instagram.com",
    maxDuration: 90, // 90 secondes pour les reels
    recommendedFormat: {
      quality: "1080p",
      aspectRatio: { width: 9, height: 16 },
    },
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "📺",
    color: "#FF0000",
    packageName: "com.google.android.youtube",
    urlScheme: "youtube://",
    webUrl: "https://studio.youtube.com",
    maxDuration: 60, // 60 secondes pour les Shorts
    recommendedFormat: {
      quality: "1080p",
      aspectRatio: { width: 9, height: 16 },
    },
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "📘",
    color: "#1877F2",
    packageName: "com.facebook.katana",
    urlScheme: "fb://",
    webUrl: "https://www.facebook.com",
    maxDuration: 240, // 4 minutes
    recommendedFormat: {
      quality: "1080p",
      aspectRatio: { width: 1, height: 1 },
    },
  },
  {
    id: "twitter",
    name: "Twitter/X",
    icon: "🐦",
    color: "#1DA1F2",
    packageName: "com.twitter.android",
    urlScheme: "twitter://",
    webUrl: "https://twitter.com/compose/tweet",
    maxDuration: 140, // 2 minutes 20 secondes
    recommendedFormat: {
      quality: "720p",
      aspectRatio: { width: 16, height: 9 },
    },
  },
];

/**
 * URLs App Store pour iOS
 */
export const APP_STORE_URLS: { [key: string]: string } = {
  tiktok: "https://apps.apple.com/app/tiktok/id835599320",
  instagram: "https://apps.apple.com/app/instagram/id389801252",
  youtube: "https://apps.apple.com/app/youtube/id544007664",
  facebook: "https://apps.apple.com/app/facebook/id284882215",
  twitter: "https://apps.apple.com/app/twitter/id333903271",
};

/**
 * Hashtags par plateforme
 */
export const PLATFORM_HASHTAGS: { [key: string]: string[] } = {
  tiktok: ["TikTok", "Viral", "FYP", "Trending", "Creator"],
  instagram: ["Instagram", "Reels", "Content", "Creator", "Video"],
  youtube: ["YouTube", "Shorts", "Creator", "Video", "Content"],
  facebook: ["Facebook", "Video", "Social", "Share"],
  twitter: ["Twitter", "Video", "Thread", "Content"],
};

/**
 * Hashtags communs
 */
export const COMMON_HASHTAGS = ["Naya", "Video", "Content"];
