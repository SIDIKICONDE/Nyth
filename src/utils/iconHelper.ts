import { Platform } from 'react-native';

/**
 * Helper pour s'assurer que les icônes fonctionnent sur Android
 */
export const getIconName = (name: string): string => {
  // Sur Android, certains noms d'icônes peuvent nécessiter des ajustements
  if (Platform.OS === 'android') {
    // Mapper les icônes problématiques
    const iconMap: Record<string, string> = {
      'chevron-forward': 'chevron-right',
      'chevron-back': 'chevron-left',
      'checkmark-circle': 'check-circle',
      'checkmark': 'check',
      'notifications-off': 'bell-off',
      'warning': 'alert',
      // Ajouter d'autres mappings si nécessaire
    };
    
    return iconMap[name] || name;
  }
  
  return name;
};

/**
 * Vérifier si une icône existe
 */
export const isIconAvailable = (iconSet: any, name: string): boolean => {
  try {
    return iconSet.glyphMap && iconSet.glyphMap[name] !== undefined;
  } catch (error) {
    return false;
  }
};

/**
 * Obtenir une icône de fallback si l'icône principale n'est pas disponible
 */
export const getFallbackIcon = (name: string): string => {
  const fallbacks: Record<string, string> = {
    'chevron-forward': 'arrow-forward',
    'chevron-back': 'arrow-back',
    'checkmark-circle': 'check-circle-outline',
    'checkmark': 'check',
    'reload': 'refresh',
    'warning': 'alert',
    'notifications-off': 'bell-off',
    // Ajouter d'autres fallbacks
  };
  
  return fallbacks[name] || 'help-circle-outline';
}; 