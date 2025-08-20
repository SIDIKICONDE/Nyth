/**
 * Export des composants Filtres Pro
 * Version améliorée avec toutes les fonctionnalités avancées
 */

// Composants principaux
export { FilterCameraInterfacePro } from './FilterCameraInterfacePro';
export { default as FilterCameraInterfaceProDefault } from './FilterCameraInterfacePro';

// Composants de support
export { default as FilterPreviewGridPro } from './FilterPreviewGridPro';
export { default as Tooltip } from './Tooltip';

// Composants avancés Pro
export { default as AdvancedFilterControlsPro } from './AdvancedFilterControlsPro';
export { default as LUT3DPickerPro } from './LUT3DPickerPro';
export { default as FilterPresetsPro } from './FilterPresetsPro';
export { default as LightroomPresetImporter } from './LightroomPresetImporter';

// Types
export type { FilterFavorite } from './FilterCameraInterfacePro';

// Utilitaires
export const FILTER_PRO_FEATURES = {
  REALTIME_PREVIEW: true,
  ADVANCED_CONTROLS: true,
  LUT3D_SUPPORT: true,
  FAVORITES_SYSTEM: true,
  PERFORMANCE_MONITORING: true,
  TOOLTIPS: true,
  PRESETS: true,
  EXPERT_MODE: true,
  COMPARISON_MODE: true,
  BATCH_PROCESSING: true, // ✅ Disponible
} as const;

export const PRO_VERSION = '1.0.0';
export const MIN_REACT_NATIVE_VERSION = '0.70.0';
