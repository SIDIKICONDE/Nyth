import i18next from '../locales/i18n';

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString(i18next.language === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString(i18next.language === 'fr' ? 'fr-FR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}; 