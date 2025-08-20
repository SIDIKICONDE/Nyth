// Types
export * from './types';

// Configuration
export { 
  SOCIAL_PLATFORMS, 
  APP_STORE_URLS, 
  PLATFORM_HASHTAGS, 
  COMMON_HASHTAGS 
} from './config/platforms';

// Utilitaires
export { AppDetector } from './utils/appDetector';
export { FileManager } from './utils/fileManager';
export { HashtagGenerator } from './utils/hashtagGenerator';
export { PlatformRecommender } from './utils/platformRecommender';

// Partageurs
export { NativeSharer } from './sharers/nativeSharer';
export { WebSharer } from './sharers/webSharer';

// Service principal
export { default } from './SocialShareService';
export { SocialShareService } from './SocialShareService'; 