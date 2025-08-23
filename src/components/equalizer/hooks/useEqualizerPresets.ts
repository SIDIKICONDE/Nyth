import { useState, useCallback, useEffect } from 'react';
import { EqualizerPreset } from '../types';
import NativeAudioCoreModule from '../../../../specs/NativeAudioCoreModule';

// Presets prédéfinis
const BUILT_IN_PRESETS: EqualizerPreset[] = [
  { name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Rock', gains: [4, 3, -1, -2, -1, 2, 3, 4, 3, 2] },
  { name: 'Pop', gains: [-1, 2, 4, 3, 0, -1, -1, 0, 2, 3] },
  { name: 'Jazz', gains: [0, 2, 1, 2, -2, -2, 0, 1, 2, 3] },
  { name: 'Classical', gains: [0, 0, 0, 0, 0, 0, -2, -2, -2, -3] },
  { name: 'Electronic', gains: [4, 3, 1, 0, -2, 2, 1, 1, 3, 4] },
  { name: 'Vocal Boost', gains: [-2, -1, 0, 2, 4, 4, 3, 2, 0, -1] },
  { name: 'Bass Boost', gains: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
  { name: 'Treble Boost', gains: [0, 0, 0, 0, 0, 0, 2, 4, 5, 6] },
  { name: 'Loudness', gains: [5, 3, 0, -1, -2, -2, -1, 0, 3, 5] }
];

export const useEqualizerPresets = () => {
  const [presets, setPresets] = useState<EqualizerPreset[]>(BUILT_IN_PRESETS);
  const [currentPreset, setCurrentPreset] = useState<string>('Flat');
  const [customPresets, setCustomPresets] = useState<EqualizerPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les presets personnalisés depuis le stockage
  useEffect(() => {
    loadCustomPresets();
  }, []);

  // Charger les presets personnalisés
  const loadCustomPresets = useCallback(async () => {
    try {
      // TODO: Implémenter le chargement depuis AsyncStorage
      // Pour l'instant, on utilise des presets vides
      setCustomPresets([]);
    } catch (error) {
      console.error('Failed to load custom presets:', error);
    }
  }, []);

  // Sauvegarder un preset personnalisé
  const saveCustomPreset = useCallback(async (name: string, gains: number[]) => {
    try {
      const newPreset: EqualizerPreset = { name, gains };
      const updatedCustomPresets = [...customPresets, newPreset];
      setCustomPresets(updatedCustomPresets);
      
      // TODO: Sauvegarder dans AsyncStorage
      
      return true;
    } catch (error) {
      console.error('Failed to save custom preset:', error);
      return false;
    }
  }, [customPresets]);

  // Supprimer un preset personnalisé
  const deleteCustomPreset = useCallback(async (name: string) => {
    try {
      const updatedCustomPresets = customPresets.filter(p => p.name !== name);
      setCustomPresets(updatedCustomPresets);
      
      // TODO: Mettre à jour AsyncStorage
      
      return true;
    } catch (error) {
      console.error('Failed to delete custom preset:', error);
      return false;
    }
  }, [customPresets]);

  // Appliquer un preset
  const applyPreset = useCallback(async (presetName: string): Promise<number[] | null> => {
    if (!NativeAudioCoreModule) {
      console.error('NativeAudioCoreModule not available');
      return null;
    }

    try {
      setIsLoading(true);

      // Chercher le preset dans les presets intégrés et personnalisés
      const allPresets = [...BUILT_IN_PRESETS, ...customPresets];
      const preset = allPresets.find(p => p.name === presetName);

      if (!preset) {
        console.error(`Preset "${presetName}" not found`);
        return null;
      }

      // Appliquer le preset via le module natif - utiliser loadPreset au lieu de setPreset
      await NativeAudioCoreModule.equalizerLoadPreset(presetName);
      setCurrentPreset(presetName);

      return preset.gains;
    } catch (error) {
      console.error('Failed to apply preset:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [customPresets]);

  // Obtenir les gains d'un preset
  const getPresetGains = useCallback((presetName: string): number[] | null => {
    const allPresets = [...BUILT_IN_PRESETS, ...customPresets];
    const preset = allPresets.find(p => p.name === presetName);
    return preset ? preset.gains : null;
  }, [customPresets]);

  // Obtenir tous les noms de presets disponibles
  const getAvailablePresetNames = useCallback((): string[] => {
    const builtInNames = BUILT_IN_PRESETS.map(p => p.name);
    const customNames = customPresets.map(p => p.name);
    return [...builtInNames, ...customNames];
  }, [customPresets]);

  // Vérifier si un preset est personnalisé
  const isCustomPreset = useCallback((presetName: string): boolean => {
    return customPresets.some(p => p.name === presetName);
  }, [customPresets]);

  return {
    // État
    presets: [...BUILT_IN_PRESETS, ...customPresets],
    currentPreset,
    isLoading,
    
    // Actions
    applyPreset,
    saveCustomPreset,
    deleteCustomPreset,
    getPresetGains,
    getAvailablePresetNames,
    isCustomPreset,
    
    // Constantes
    BUILT_IN_PRESETS
  };
};
