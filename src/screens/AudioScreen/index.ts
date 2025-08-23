// Export du composant principal
export { default as AudioScreen } from './AudioScreen';

// Export des types
export * from './types';

// Export des hooks
export { useAudioFolders } from './hooks/useAudioFolders';
export { useAudioScreenState } from './hooks/useAudioScreenState';
export { useAudioCapture } from './hooks/useAudioCapture';

// Export des composants
export { default as AudioScreenHeader } from './components/AudioScreenHeader';
export { default as AudioFolderCard } from './components/AudioFolderCard';
export { default as AudioFAB } from './components/AudioFAB';
export { default as EmptyState } from './components/EmptyState';
export { default as AudioFolderActions } from './components/AudioFolderActions';
export { default as AudioSearchBar } from './components/AudioSearchBar';
export { default as AudioLevelIndicator } from './components/AudioLevelIndicator';
export { default as AudioFolderDetail } from './components/AudioFolderDetail';
export { default as AudioSettings } from './components/AudioSettings';
export { default as AudioStats } from './components/AudioStats';
export {
  default as UltraModernUI,
  UltraModernCard,
  UltraModernButton,
  UltraModernLoader,
  UltraModernToast,
  SkiaUltraModernDemo,
} from './components/UltraModernUI';
export { default as RippleButton, useMicroInteractions } from './components/RippleButton';
export { default as MicroInteractionsDemo } from './components/MicroInteractionsDemo';

// Export du connecteur
export { default as AudioScreenConnector } from './AudioScreenConnector';
