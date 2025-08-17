// Type pour la fonction de traduction
type TranslationFunction = (key: string, options?: any) => string;

/**
 * Utilitaire pour formater les dates dans le menu latéral
 */
export const formatDate = (dateString: string, t: TranslationFunction): string => {
  const date = new Date(dateString);
  const today = new Date();
  
  // Aujourd'hui
  if (date.toDateString() === today.toDateString()) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  // Hier
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return t('menu.yesterday');
  }
  
  // Cette semaine
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  if (date >= weekStart) {
    const days = [
      t('menu.days.sun'),
      t('menu.days.mon'),
      t('menu.days.tue'),
      t('menu.days.wed'),
      t('menu.days.thu'),
      t('menu.days.fri'),
      t('menu.days.sat')
    ];
    return days[date.getDay()];
  }
  
  // Date précise
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}; 