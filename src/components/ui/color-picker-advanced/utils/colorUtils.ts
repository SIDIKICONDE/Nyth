import { RgbColor } from '../types';

/**
 * Convertit une couleur hexadécimale en RGB
 */
export const hexToRgb = (hex: string): RgbColor | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Convertit une couleur RGB en hexadécimal
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Valide si une chaîne est un code couleur hexadécimal valide
 */
export const isValidHex = (hex: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(hex);
};

/**
 * Normalise un code couleur hexadécimal (ajoute # si nécessaire)
 */
export const normalizeHex = (hex: string): string => {
  return hex.startsWith('#') ? hex : `#${hex}`;
};

/**
 * Détermine si une couleur est claire ou sombre pour choisir la couleur de texte
 */
export const getContrastColor = (hex: string): '#000' | '#fff' => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000';
  
  const { r, g, b } = rgb;
  const brightness = (r + g + b) / 3;
  return brightness > 127 ? '#000' : '#fff';
};

/**
 * Calcule la luminance d'une couleur selon la formule W3C
 */
export const getLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  
  const { r, g, b } = rgb;
  
  // Normaliser les valeurs RGB
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  // Calculer la luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calcule le ratio de contraste entre deux couleurs
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Génère une couleur aléatoire
 */
export const generateRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Assombrit une couleur d'un pourcentage donné
 */
export const darkenColor = (hex: string, percent: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const factor = (100 - percent) / 100;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);
  
  return rgbToHex(r, g, b);
};

/**
 * Éclaircit une couleur d'un pourcentage donné
 */
export const lightenColor = (hex: string, percent: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const factor = percent / 100;
  const r = Math.round(rgb.r + (255 - rgb.r) * factor);
  const g = Math.round(rgb.g + (255 - rgb.g) * factor);
  const b = Math.round(rgb.b + (255 - rgb.b) * factor);
  
  return rgbToHex(r, g, b);
}; 