import { SocialApp } from '../types';

/**
 * Obtient les URL schemes alternatifs pour une app
 */
export const getAppSchemes = (app: SocialApp): string[] => {
  const schemes = [app.iosScheme];
  
  switch (app.id) {
    case 'tiktok':
      return [
        'tiktok://',
        'snssdk1233://',
        'snssdk1180://',
        'aweme://',
        'musically://'
      ];
    case 'instagram':
      return ['instagram://', 'instagram-stories://'];
    case 'youtube':
      return ['youtube://', 'vnd.youtube://'];
    case 'facebook':
      return ['fb://', 'facebook://'];
    case 'twitter':
      return ['twitter://', 'tweetbot://'];
    default:
      return schemes;
  }
};

/**
 * Génère une URL de store appropriée pour la plateforme
 */
export const getStoreUrl = (app: SocialApp, platform: string): string => {
  return platform === 'ios' 
    ? `https://apps.apple.com/search?term=${encodeURIComponent(app.name)}`
    : `https://play.google.com/store/apps/details?id=${app.androidPackage}`;
}; 