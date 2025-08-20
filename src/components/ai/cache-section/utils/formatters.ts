import { SizeInfo } from '../types';

export const formatDate = (timestamp: number, t: (key: string, defaultValue: string, params?: any) => string): string => {
  if (timestamp === 0) return t('cache.noData', 'Aucune donnée');
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return t('cache.today', 'Aujourd\'hui');
  if (diffDays === 1) return t('cache.yesterday', 'Hier');
  if (diffDays < 7) return t('cache.daysAgo', '{{days}} jours', { days: diffDays });
  
  return date.toLocaleDateString();
};

export const formatSize = (bytes: number, textSecondaryColor: string): SizeInfo => {
  if (bytes === 0) return { text: '0 KB', color: textSecondaryColor };
  
  let text = '';
  let color = '#10b981'; // Vert par défaut
  
  if (bytes < 1024) {
    text = `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    text = `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    text = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes > 10 * 1024 * 1024) color = '#f59e0b'; // Orange si > 10MB
    if (bytes > 50 * 1024 * 1024) color = '#ef4444'; // Rouge si > 50MB
  }
  
  return { text, color };
};

export const calculateUsagePercentage = (sizeInBytes: number): number => {
  return Math.min((sizeInBytes / (100 * 1024 * 1024)) * 100, 100);
}; 