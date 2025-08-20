import { useState, useEffect } from 'react';
import InstalledAppsService, { SocialApp, InstalledAppsResult } from '../services/installed-apps';

export function useInstalledApps() {
  const [installedApps, setInstalledApps] = useState<SocialApp[]>([]);
  const [allApps, setAllApps] = useState<SocialApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectionMethod, setDetectionMethod] = useState<string>('');
  const [detectionStats, setDetectionStats] = useState<{
    totalApps: number;
    installedCount: number;
    detectionRate: number;
    platformSupport: string;
  } | null>(null);

  useEffect(() => {
    detectInstalledApps();
  }, []);

  const detectInstalledApps = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const service = InstalledAppsService.getInstance();

      // Détecter les apps installées
      const result: InstalledAppsResult = await service.getInstalledApps();
      setInstalledApps(result.installedApps);
      setAllApps(result.checkedApps);
      setDetectionMethod(result.detectionMethod);

      // Obtenir les statistiques
      const stats = await service.getDetectionStats();
      setDetectionStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const isAppInstalled = (appId: string): boolean => {
    return installedApps.some(app => app.id === appId);
  };

  const getInstalledApp = (appId: string): SocialApp | undefined => {
    return installedApps.find(app => app.id === appId);
  };

  const openApp = async (appId: string, fallbackUrl?: string): Promise<boolean> => {
    const app = allApps.find(a => a.id === appId);
    if (!app) {
      return false;
    }

    const service = InstalledAppsService.getInstance();
    return await service.openApp(app, fallbackUrl);
  };

  const shareToApp = async (appId: string, content: {
    text?: string;
    url?: string;
    videoPath?: string;
  }): Promise<boolean> => {
    const app = getInstalledApp(appId);
    if (!app) {
      return false;
    }

    const service = InstalledAppsService.getInstance();
    return await service.shareToApp(app, content);
  };

  const getAppsByCategory = () => {
    const categories = {
      video: installedApps.filter(app => ['tiktok', 'youtube', 'instagram'].includes(app.id)),
      social: installedApps.filter(app => ['facebook', 'twitter', 'linkedin'].includes(app.id)),
      messaging: installedApps.filter(app => ['whatsapp', 'telegram'].includes(app.id)),
      photo: installedApps.filter(app => ['instagram', 'snapchat'].includes(app.id)),
    };

    return categories;
  };

  const getMostPopularApps = (limit: number = 5): SocialApp[] => {
    // Ordre de popularité basé sur les statistiques d'usage
    const popularityOrder = ['whatsapp', 'instagram', 'tiktok', 'youtube', 'facebook', 'telegram', 'twitter', 'snapchat', 'linkedin'];
    
    return installedApps
      .sort((a, b) => {
        const aIndex = popularityOrder.indexOf(a.id);
        const bIndex = popularityOrder.indexOf(b.id);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      })
      .slice(0, limit);
  };

  const getDetectionInfo = () => {
    return {
      method: detectionMethod,
      stats: detectionStats,
      isReliable: detectionMethod !== 'fallback',
      platformSupported: detectionMethod !== 'fallback',
    };
  };

  return {
    installedApps,
    allApps,
    isLoading,
    error,
    detectionMethod,
    detectionStats,
    isAppInstalled,
    getInstalledApp,
    openApp,
    shareToApp,
    getAppsByCategory,
    getMostPopularApps,
    getDetectionInfo,
    refresh: detectInstalledApps,
  };
} 