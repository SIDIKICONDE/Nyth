// Types
export * from './types';

// Configuration
export { SOCIAL_APPS, getFallbackApps } from './config/socialApps';

// Détecteurs
export { IOSDetector } from './detectors/iosDetector';
export { AndroidDetector } from './detectors/androidDetector';

// Utilitaires
export { getAppSchemes, getStoreUrl } from './utils/schemeUtils';
export { ShareUtils } from './utils/shareUtils';
export { AppLauncher } from './utils/appLauncher';

// Service principal
export { default } from './InstalledAppsService';
export { default as InstalledAppsService } from './InstalledAppsService'; 