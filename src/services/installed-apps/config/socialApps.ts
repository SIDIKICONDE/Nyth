import { SocialApp } from '../types';

export const SOCIAL_APPS: SocialApp[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    packageName: 'com.zhiliaoapp.musically',
    iosScheme: 'tiktok://',
    androidPackage: 'com.zhiliaoapp.musically',
    icon: '🎵',
    shareSupported: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    packageName: 'com.instagram.android',
    iosScheme: 'instagram://',
    androidPackage: 'com.instagram.android',
    icon: '📷',
    shareSupported: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    iosScheme: 'youtube://',
    androidPackage: 'com.google.android.youtube',
    icon: '📺',
    shareSupported: true,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    packageName: 'com.facebook.katana',
    iosScheme: 'fb://',
    androidPackage: 'com.facebook.katana',
    icon: '👥',
    shareSupported: true,
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    packageName: 'com.twitter.android',
    iosScheme: 'twitter://',
    androidPackage: 'com.twitter.android',
    icon: '🐦',
    shareSupported: true,
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    packageName: 'com.snapchat.android',
    iosScheme: 'snapchat://',
    androidPackage: 'com.snapchat.android',
    icon: '👻',
    shareSupported: true,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    packageName: 'com.linkedin.android',
    iosScheme: 'linkedin://',
    androidPackage: 'com.linkedin.android',
    icon: '💼',
    shareSupported: true,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    packageName: 'com.whatsapp',
    iosScheme: 'whatsapp://',
    androidPackage: 'com.whatsapp',
    icon: '💬',
    shareSupported: true,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    packageName: 'org.telegram.messenger',
    iosScheme: 'tg://',
    androidPackage: 'org.telegram.messenger',
    icon: '✈️',
    shareSupported: true,
  },
];

/**
 * Applications par défaut (fallback)
 */
export const getFallbackApps = (): SocialApp[] => {
  return SOCIAL_APPS.filter(app => 
    ['instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp'].includes(app.id)
  );
}; 