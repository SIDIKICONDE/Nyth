import { Platform } from 'react-native';

// Détection de la plateforme
export const getPlatformInfo = () => {
  const os = Platform.OS;
  const version = Platform.Version;
  
  // Détection plus robuste pour Windows
  // Vérifier plusieurs indicateurs pour détecter Windows
  const isRunningOnWindows = () => {
    // 1. Vérifier Platform.OS
    if (os === 'windows' || (os as string) === 'win32') {
      return true;
    }
    
    // 2. Vérifier si on est dans un environnement Node.js Windows
    if (typeof process !== 'undefined' && process.platform) {
      return process.platform === 'win32';
    }
    
    // 3. Vérifier le navigator (pour les environnements web)
    if (typeof navigator !== 'undefined' && navigator.platform) {
      return navigator.platform.toLowerCase().includes('win');
    }
    
    // 4. Vérifier les variables d'environnement Windows
    if (typeof process !== 'undefined' && process.env) {
      return !!(process.env.WINDIR || process.env.SYSTEMROOT || process.env.OS === 'Windows_NT');
    }
    
    // 5. Vérifier si react-native-keychain n'est pas disponible (indicateur indirect)
    try {
      require('react-native-keychain');
      return false; // Si on peut charger keychain, on n'est probablement pas sur Windows
    } catch (e) {
      // Si keychain ne peut pas être chargé et qu'on n'est pas sur web, on est probablement sur Windows
      return os !== 'web' && os !== 'ios' && os !== 'android';
    }
  };
  
  const isWindows = isRunningOnWindows();
  const isWeb = os === 'web';
  const isMobile = (os === 'ios' || os === 'android') && !isWindows; // Important: vérifier qu'on n'est pas sur Windows
  const isIOS = os === 'ios' && !isWindows;
  const isAndroid = os === 'android' && !isWindows;
  
  // Forcer la désactivation de Keychain si on détecte Windows
  if (isWindows) {}
  
  return {
    os,
    version,
    isWindows,
    isWeb,
    isMobile,
    isIOS,
    isAndroid,
    // Désactiver Keychain sur Windows et Web
    supportsKeychain: isMobile && !isWindows && !isWeb,

  };
};

// Configuration de stockage sécurisé par plateforme
export const getSecureStorageConfig = () => {
  const platform = getPlatformInfo();

  return {
    useKeychain: platform.supportsKeychain,

    // Toujours utiliser le chiffrement sur desktop
    forceEncryption: platform.isWindows || platform.isWeb,
    // Préfixe pour les clés AsyncStorage
    storagePrefix: platform.isWindows ? 'win_secure_' : 'secure_',
  };
}; 