/**
 * Configuration pour les tests d'accessibilité
 */

import { AccessibilityInfo } from 'react-native';

// Mock d'AccessibilityInfo pour les tests
Object.defineProperty(AccessibilityInfo, 'isScreenReaderEnabled', {
  value: Promise.resolve(false),
  writable: true
});

Object.defineProperty(AccessibilityInfo, 'isReduceMotionEnabled', {
  value: Promise.resolve(false),
  writable: true
});

Object.defineProperty(AccessibilityInfo, 'isBoldTextEnabled', {
  value: Promise.resolve(false),
  writable: true
});

// Utilitaires globaux pour les tests d'accessibilité
global.AccessibilityUtils = {
  // Simule un lecteur d'écran actif
  enableScreenReader: () => {
    AccessibilityInfo.isScreenReaderEnabled = Promise.resolve(true);
  },

  // Désactive le lecteur d'écran
  disableScreenReader: () => {
    AccessibilityInfo.isScreenReaderEnabled = Promise.resolve(false);
  },

  // Simule le mode réduction de mouvement
  enableReduceMotion: () => {
    AccessibilityInfo.isReduceMotionEnabled = Promise.resolve(true);
  },

  // Désactive le mode réduction de mouvement
  disableReduceMotion: () => {
    AccessibilityInfo.isReduceMotionEnabled = Promise.resolve(false);
  }
};
