import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../../../hooks/useTranslation';
import { UserPreferences } from '../types';
import { SCRIPT_DURATION } from '../../../config/aiConfig';

export const useUserPreferences = (
  setSelectedPlatform: (platform: string) => void,
  setTone: (tone: string) => void,
  setDuration: (duration: number) => void,
  setCreativity: (creativity: number) => void,
  setMaxCharacters: (maxCharacters: number) => void,
  selectedPlatform: string,
  tone: string,
  duration: number,
  creativity: number,
  maxCharacters: number
) => {
  const { t } = useTranslation();

  // Charger les préférences utilisateur au démarrage
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const savedPreferences = await AsyncStorage.getItem('aiGeneratorPreferences');
        if (savedPreferences) {
          const preferences: UserPreferences = JSON.parse(savedPreferences);
          setSelectedPlatform(preferences.platform || 'tiktok');
          setTone(preferences.tone || 'casual');
          setDuration(preferences.duration || SCRIPT_DURATION.MEDIUM.seconds);
          setCreativity(preferences.creativity || 0.7);
          setMaxCharacters(preferences.maxCharacters || 1000);
        }
      } catch (error) {}
    };

    loadUserPreferences();
  }, [t]);

  // Sauvegarder les préférences quand elles changent
  useEffect(() => {
    const saveUserPreferences = async () => {
      try {
        const preferences: UserPreferences = {
          platform: selectedPlatform,
          tone,
          duration,
          creativity,
          maxCharacters,
        };
        await AsyncStorage.setItem('aiGeneratorPreferences', JSON.stringify(preferences));
      } catch (error) {}
    };

    saveUserPreferences();
  }, [selectedPlatform, tone, duration, creativity, maxCharacters, t]);
}; 