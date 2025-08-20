import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../contexts/AuthContext";
import subscriptionService from "../services/firebase/subscriptionService";
import {
  UserSubscription,
  UsageStats,
  SubscriptionUsage,
} from "../types/subscription";
import { createLogger } from "../utils/optimizedLogger";

const logger = createLogger("SubscriptionMigration");

export const useSubscriptionMigration = () => {
  const { currentUser } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    if (currentUser?.uid && !migrationComplete) {
      migrateSubscriptionData();
    }
  }, [currentUser, migrationComplete]);

  const migrateSubscriptionData = async () => {
    try {
      setIsMigrating(true);

      // Vérifier si la migration a déjà été effectuée
      const migrationKey = `subscription_migrated_${currentUser!.uid}`;
      const alreadyMigrated = await AsyncStorage.getItem(migrationKey);

      if (alreadyMigrated === "true") {
        logger.info("Subscription data already migrated");
        setMigrationComplete(true);
        return;
      }

      // Vérifier s'il existe déjà des données dans Firebase
      const existingSubscription = await subscriptionService.getSubscription(
        currentUser!.uid
      );

      if (existingSubscription) {
        logger.info("Subscription already exists in Firebase");
        await AsyncStorage.setItem(migrationKey, "true");
        setMigrationComplete(true);
        return;
      }

      // Migrer les données locales vers Firebase
      const localSubscription = await AsyncStorage.getItem("user_subscription");
      const localUsage = await AsyncStorage.getItem("usage_stats");

      if (localSubscription) {
        const subscription = JSON.parse(localSubscription) as UserSubscription;
        await subscriptionService.createOrUpdateSubscription(
          currentUser!.uid,
          subscription
        );
        logger.info("Migrated subscription to Firebase");
      }

      if (localUsage) {
        const usage = JSON.parse(localUsage) as UsageStats;
        await subscriptionService.trackUsage(
          currentUser!.uid,
          usage as unknown as SubscriptionUsage
        );
        logger.info("Migrated usage stats to Firebase");
      }

      // Marquer la migration comme terminée
      await AsyncStorage.setItem(migrationKey, "true");
      setMigrationComplete(true);

      logger.info("Subscription migration completed successfully");
    } catch (error) {
      logger.error("Error during subscription migration:", error);
    } finally {
      setIsMigrating(false);
    }
  };

  return { isMigrating, migrationComplete };
};
