// 🎨 Composant principal
export { ProfessionalBlock } from "./ProfessionalBlock";

// 🔧 Hook personnalisé
export { useProfessionalBlock } from "./hooks/useProfessionalBlock";

// 📦 Sous-composants (export optionnel pour usage avancé)
export * from "./components";

// 🎯 Types TypeScript
export type {
  ProfessionalBlockProps,
  ProfessionalBlockVariant,
  ProfessionalBlockSize,
  ProfessionalBlockPadding,
  ProfessionalBlockRadius,
  ProfessionalBlockStatus,
  SizeConfig,
  VariantConfig,
  AnimationConfig,
  UseProfessionalBlockConfig,
  UseProfessionalBlockReturn,
} from "./types";

// 📊 Constantes (export optionnel pour customisation)
export {
  SIZE_CONFIGS,
  STATUS_COLORS,
  ANIMATION_CONFIGS,
  PADDING_MAP,
  RADIUS_MAP,
  STATUS_ICONS,
  DEFAULT_VALUES,
  VARIANT_PRESETS,
  BREAKPOINTS,
} from "./constants";
