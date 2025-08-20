import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfilePreferences {
  showAnalytics: boolean;
  showAchievements: boolean;
}

const PROFILE_PREFERENCES_KEY = '@profile_preferences';

export function useProfilePreferences() {
  const [preferences, setPreferences] = useState<ProfilePreferences>({
    showAnalytics: false,
    showAchievements: false,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_PREFERENCES_KEY);
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {} finally {
      setIsLoaded(true);
    }
  };

  const updatePreference = async (key: keyof ProfilePreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    try {
      await AsyncStorage.setItem(PROFILE_PREFERENCES_KEY, JSON.stringify(newPreferences));
    } catch (error) {}
  };

  return {
    preferences,
    isLoaded,
    updatePreference,
  };
} 