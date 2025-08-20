import { Platform, UIManager } from 'react-native';

/**
 * Active les animations de layout sur Android
 * Doit être appelé au démarrage de l'application
 */
export const enableAndroidLayoutAnimations = () => {
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
};

/**
 * Configuration des animations pour le clavier
 */
export const keyboardAnimationConfig = {
  spring: {
    useNativeDriver: false,
    friction: 8,
    tension: 40
  },
  timing: {
    duration: 300,
    useNativeDriver: false
  }
};

/**
 * Valeurs par défaut pour les animations
 */
export const animationDefaults = {
  viewAdjustment: 0,
  inputPosition: Platform.OS === 'ios' ? 20 : 10,
  backgroundDimming: 0,
  maxDimming: 0.7
}; 