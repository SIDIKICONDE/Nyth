import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

interface SubscriptionLockConfig {
  isLocked: boolean;
  reason?: string;
  unlockDate?: Date;
  lockedBy?: string; // ID de l'admin qui a verrouillé
  lockedAt?: Date; // Date de verrouillage
}

const STORAGE_KEY = "subscription_lock_config";

// Configuration par défaut
const DEFAULT_LOCK_CONFIG: SubscriptionLockConfig = {
  isLocked: false,
  reason: "",
};

export const useSubscriptionLock = () => {
  const [lockConfig, setLockConfig] =
    useState<SubscriptionLockConfig>(DEFAULT_LOCK_CONFIG);
  const [loading, setLoading] = useState(true);

  // Charger la configuration depuis le stockage
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Reconstituer les dates
          if (parsed.unlockDate) {
            parsed.unlockDate = new Date(parsed.unlockDate);
          }
          if (parsed.lockedAt) {
            parsed.lockedAt = new Date(parsed.lockedAt);
          }
          setLockConfig(parsed);
        }
      } catch (error) {} finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Sauvegarder la configuration
  const saveConfig = async (newConfig: SubscriptionLockConfig) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {}
  };

  // Vérifier le déverrouillage automatique
  useEffect(() => {
    if (lockConfig.unlockDate && new Date() >= lockConfig.unlockDate) {
      const newConfig = {
        ...lockConfig,
        isLocked: false,
        unlockDate: undefined,
      };
      setLockConfig(newConfig);
      saveConfig(newConfig);
    }
  }, [lockConfig.unlockDate]);

  const toggleLock = async (adminId?: string) => {
    const newConfig = {
      ...lockConfig,
      isLocked: !lockConfig.isLocked,
      lockedBy: !lockConfig.isLocked ? adminId : undefined,
      lockedAt: !lockConfig.isLocked ? new Date() : undefined,
    };
    setLockConfig(newConfig);
    await saveConfig(newConfig);
  };

  const setLockReason = async (reason: string) => {
    const newConfig = { ...lockConfig, reason };
    setLockConfig(newConfig);
    await saveConfig(newConfig);
  };

  const setUnlockDate = async (date?: Date) => {
    const newConfig = { ...lockConfig, unlockDate: date };
    setLockConfig(newConfig);
    await saveConfig(newConfig);
  };

  const forceUnlock = async () => {
    const newConfig = {
      ...lockConfig,
      isLocked: false,
      reason: "",
      unlockDate: undefined,
      lockedBy: undefined,
      lockedAt: undefined,
    };
    setLockConfig(newConfig);
    await saveConfig(newConfig);
  };

  return {
    isLocked: lockConfig.isLocked,
    reason: lockConfig.reason,
    unlockDate: lockConfig.unlockDate,
    lockedBy: lockConfig.lockedBy,
    lockedAt: lockConfig.lockedAt,
    loading,
    toggleLock,
    setLockReason,
    setUnlockDate,
    forceUnlock,
  };
};

export default DEFAULT_LOCK_CONFIG;
