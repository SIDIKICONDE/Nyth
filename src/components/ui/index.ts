// Exports existants (préservés)
export { default as ColorPickerAdvanced } from "./ColorPickerAdvanced";
export { CustomAlert, useCustomAlert } from "./CustomAlert";
export { default as GlassTabMenu } from "./GlassTabMenu";
export { default as TabMenu } from "./TabMenu";
export type { TabItem, TabMenuProps, TabMenuVariant } from "./TabMenu";

// Nouveaux composants flottants
export * from "./floating";

// Composant Professional Block
export * from "./professional-block";

// Composants égaliseur moderne

// Export centralisé du système de polices

// Composants Typography
export {
  ButtonText,
  Caption,
  CodeText,
  ContentText,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  HeadingText,
  HelpText,
  Label,
  Paragraph,
  UIText,
  useTextStyles,
} from "./Typography";

// Composants SmartText
export {
  CodeSmartText,
  ContentSmartText,
  HeadingSmartText,
  SmartText,
  UISmartText,
  useSmartFontStyle,
  withSmartFont,
} from "./SmartText";

// Hooks centralisés
export {
  useCentralizedFont,
  useCodeFont,
  useContentFont,
  useHeadingFont,
  useMigratedTextStyle,
  useUIFont,
  type FontCategory,
} from "../../hooks/useCentralizedFont";

// Provider global (optionnel)
export {
  CodeTextGlobal,
  ContentTextGlobal,
  EnhancedText,
  GlobalFontProvider,
  HeadingTextGlobal,
  UITextGlobal,
  useGlobalFont,
  useTypedText,
} from "../../contexts/GlobalFontProvider";

// Exemple d'utilisation
export { CentralizedFontExample } from "../examples/CentralizedFontExample";

// 🆕 AMÉLIORATIONS UX

// Tooltips informatifs pour les gestes
export {
  Tooltip,
  GestureTooltip,
  InfoTooltip,
  DestructiveActionTooltip
} from './Tooltip';

// Indicateurs de progrès et états de chargement
export {
  ProgressBar,
  LoadingIndicator,
  StatusIndicator,
  DownloadIndicator
} from './ProgressIndicators';

// Skeletons de chargement
export {
  Skeleton,
  SkeletonBookItem,
  SkeletonVideoItem,
  SkeletonShelf,
  SkeletonVideoShelf,
  SkeletonLibrary
} from './SkeletonLoading';

// Exemple complet des améliorations UX
export { UXImprovementsExample } from './UXImprovementsExample';

// Variantes de composants BookItem
export {
  CompactBookItem,
  InteractiveBookItem,
  LoadingBookItem,
  ListBookItem,
  CardBookItem,
  MiniBookItem,
  ActionableBookItem,
  FavoriteBookItem,
  NewBookItem,
  EditingBookItem,
  createBookItemVariant,
  useBookItemVariant
} from '../home/library/BookItemVariants';

// Variantes de composants VideoItem
export {
  CompactVideoItem,
  InteractiveVideoItem,
  LoadingVideoItem,
  ListVideoItem,
  CardVideoItem,
  MiniVideoItem,
  ActionableVideoItem,
  RecentVideoItem,
  DownloadingVideoItem,
  OverlayVideoItem,
  PremiumVideoItem,
  createVideoItemVariant,
  useVideoItemVariant
} from '../home/video-library/VideoItemVariants';

// Bibliothèque améliorée avec UX
export { LibraryWithUX } from '../home/library/LibraryWithUX';

// Exemples d'intégration
export { UXIntegrationExample } from '../examples/UXIntegrationExample';
