import { isValidHex, getContrastRatio, getLuminance } from './colorUtils';

export interface ColorValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface AccessibilityValidationOptions {
  backgroundColor?: string;
  minContrastRatio?: number;
  checkAAA?: boolean;
}

/**
 * Valide une couleur hexadécimale avec des messages détaillés
 */
export const validateColor = (
  color: string,
  t: (key: string, params?: any) => string
): ColorValidationResult => {
  const result: ColorValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // Validation du format
  if (!color || color.trim() === '') {
    result.isValid = false;
    result.errors.push(t('colorPicker.validation.emptyColor'));
    return result;
  }

  if (!isValidHex(color)) {
    result.isValid = false;
    result.errors.push(t('colorPicker.validation.invalidHex'));
    
    // Suggestions pour corriger le format
    if (!color.startsWith('#')) {
      result.suggestions.push(t('colorPicker.validation.addHashPrefix'));
    }
    
    if (color.length !== 7) {
      result.suggestions.push(t('colorPicker.validation.correctLength'));
    }
    
    return result;
  }

  // Validation de la luminance
  const luminance = getLuminance(color);
  
  if (luminance < 0.1) {
    result.warnings.push(t('colorPicker.validation.veryDark'));
  } else if (luminance > 0.9) {
    result.warnings.push(t('colorPicker.validation.veryLight'));
  }

  return result;
};

/**
 * Valide l'accessibilité d'une couleur
 */
export const validateAccessibility = (
  foregroundColor: string,
  options: AccessibilityValidationOptions,
  t: (key: string, params?: any) => string
): ColorValidationResult => {
  const result: ColorValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  const { backgroundColor = '#ffffff', minContrastRatio = 4.5, checkAAA = false } = options;

  if (!isValidHex(foregroundColor) || !isValidHex(backgroundColor)) {
    result.isValid = false;
    result.errors.push(t('colorPicker.validation.invalidColors'));
    return result;
  }

  const contrastRatio = getContrastRatio(foregroundColor, backgroundColor);
  const requiredRatio = checkAAA ? 7 : minContrastRatio;

  if (contrastRatio < requiredRatio) {
    result.isValid = false;
    result.errors.push(
      t('colorPicker.validation.insufficientContrast', {
        current: contrastRatio.toFixed(2),
        required: requiredRatio
      })
    );

    // Suggestions d'amélioration
    if (contrastRatio < 3) {
      result.suggestions.push(t('colorPicker.validation.considerDifferentColors'));
    } else {
      result.suggestions.push(t('colorPicker.validation.adjustBrightness'));
    }
  } else if (contrastRatio < 7 && checkAAA) {
    result.warnings.push(
      t('colorPicker.validation.aaaRecommended', {
        current: contrastRatio.toFixed(2)
      })
    );
  }

  return result;
};

/**
 * Suggestions de couleurs similaires mais plus accessibles
 */
export const suggestAccessibleColors = (
  originalColor: string,
  backgroundColor: string,
  targetRatio: number = 4.5
): string[] => {
  // Cette fonction pourrait être étendue pour générer des suggestions intelligentes
  // Pour l'instant, elle retourne un tableau vide
  return [];
};

/**
 * Évalue la qualité globale d'une couleur
 */
export const evaluateColorQuality = (
  color: string,
  t: (key: string, params?: any) => string
): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  feedback: string[];
} => {
  let score = 100;
  const feedback: string[] = [];

  const validation = validateColor(color, t);
  
  if (!validation.isValid) {
    return {
      score: 0,
      grade: 'F',
      feedback: validation.errors
    };
  }

  // Déduire des points pour les avertissements
  score -= validation.warnings.length * 10;

  // Évaluer la luminance
  const luminance = getLuminance(color);
  if (luminance < 0.05 || luminance > 0.95) {
    score -= 20;
    feedback.push(t('colorPicker.validation.extremeLuminance'));
  }

  // Déterminer la note
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { score, grade, feedback };
}; 