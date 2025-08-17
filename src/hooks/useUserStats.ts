import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateToNewStatsSystem } from '../utils/migrationUtils';

export interface CumulativeStats {
  totalRecordingTime: number; // Temps total cumulé en secondes
  totalRecordingsCreated: number; // Nombre total d'enregistrements créés
  lastUpdated: Date;
}

const STATS_STORAGE_KEY = 'userCumulativeStats';

const DEFAULT_STATS: CumulativeStats = {
  totalRecordingTime: 0,
  totalRecordingsCreated: 0,
  lastUpdated: new Date(),
};

export const useUserStats = () => {
  const [cumulativeStats, setCumulativeStats] = useState<CumulativeStats>(DEFAULT_STATS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les statistiques depuis le stockage
  const loadStats = useCallback(async () => {
    try {
      // Effectuer la migration si nécessaire
      await migrateToNewStatsSystem();
      
      const savedStats = await AsyncStorage.getItem(STATS_STORAGE_KEY);
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        // Convertir la date string en objet Date
        parsedStats.lastUpdated = new Date(parsedStats.lastUpdated);
        setCumulativeStats(parsedStats);
      }
    } catch (error) {} finally {
      setIsLoaded(true);
    }
  }, []);

  // Sauvegarder les statistiques
  const saveStats = useCallback(async (stats: CumulativeStats) => {
    try {
      await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {}
  }, []);

  // Ajouter du temps d'enregistrement
  const addRecordingTime = useCallback(async (duration: number) => {
    const newStats: CumulativeStats = {
      totalRecordingTime: cumulativeStats.totalRecordingTime + duration,
      totalRecordingsCreated: cumulativeStats.totalRecordingsCreated + 1,
      lastUpdated: new Date(),
    };

    setCumulativeStats(newStats);
    await saveStats(newStats);
  }, [cumulativeStats, saveStats]);

  // Réinitialiser les statistiques
  const resetStats = useCallback(async () => {
    setCumulativeStats(DEFAULT_STATS);
    await saveStats(DEFAULT_STATS);
  }, [saveStats]);

  // Charger les stats au démarrage
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    cumulativeStats,
    isLoaded,
    addRecordingTime,
    resetStats,
    loadStats,
  };
}; 