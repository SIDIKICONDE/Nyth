export interface SocialApp {
  id: string;
  name: string;
  packageName: string;
  iosScheme: string;
  androidPackage: string;
  icon: string;
  shareSupported: boolean;
}

export interface InstalledAppsResult {
  installedApps: SocialApp[];
  checkedApps: SocialApp[];
  detectionMethod: 'url_scheme' | 'package_query' | 'fallback';
}

export interface ShareContent {
  text?: string;
  url?: string;
  videoPath?: string;
}

export interface DetectionStats {
  totalApps: number;
  installedCount: number;
  detectionRate: number;
  platformSupport: string;
} 