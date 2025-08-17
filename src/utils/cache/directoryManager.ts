import RNFS from 'react-native-fs';
import { useTranslation } from '../../hooks/useTranslation';

// Fonction pour obtenir l'instance de traduction
let translationInstance: ReturnType<typeof useTranslation>['t'] | null = null;

export const setTranslationInstance = (t: ReturnType<typeof useTranslation>['t']) => {
  translationInstance = t;
};

const t = (key: string, params?: any) => {
  if (translationInstance) {
    return translationInstance(key, params);
  }
  // Fallback si pas d'instance de traduction
  return key;
};

/**
 * Nettoie tous les dossiers de l'application
 * @returns {Promise<void>}
 */
export const cleanAllDirectories = async (): Promise<void> => {
  // Dossiers à nettoyer
  const directories = [
    RNFS.DocumentDirectoryPath,
    RNFS.CachesDirectoryPath,
  ];

  // Nettoyage de chaque dossier
  for (const dir of directories) {
    if (!dir) continue;
    
    try {
      const files = await RNFS.readDir(dir);
      for (const file of files) {
        try {
          const filePath = `${dir}${file}`;
          await RNFS.unlink(filePath);
        } catch (error) {}
      }
    } catch (error) {}
  }
}; 