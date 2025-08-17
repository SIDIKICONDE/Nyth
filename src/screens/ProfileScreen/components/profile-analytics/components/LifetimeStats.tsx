import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState, useEffect } from "react";
import { View } from "react-native";
import tw from "twrnc";
import {
  Caption,
  H4,
  HeadingText,
} from "../../../../../components/ui/Typography";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useCloudAnalytics } from "../../../../../hooks/useCloudAnalytics";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { useScripts } from "../../../../../contexts/ScriptsContext";
import { useUserStats } from "../../../../../hooks/useUserStats";
import { useSimpleSessionTracker } from "../../../../../hooks/useSimpleSessionTracker";
import { formatDuration } from "../utils/analytics";

import { createOptimizedLogger } from '../../../../../utils/optimizedLogger';
const logger = createOptimizedLogger('LifetimeStats');

export const LifetimeStats: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { analytics } = useCloudAnalytics();
  const { scripts } = useScripts();
  const { cumulativeStats, isLoaded } = useUserStats();
  const { getActiveDaysCount } = useSimpleSessionTracker();

  // Utiliser les données locales comme source de vérité, avec fallback vers cloud
  const totalScriptsCreated = scripts.length;
  const totalRecordingsCreated = isLoaded
    ? cumulativeStats.totalRecordingsCreated
    : analytics?.lifetimeStats?.totalRecordingsCreated || 0;
  const totalRecordingTime = isLoaded
    ? cumulativeStats.totalRecordingTime
    : analytics?.lifetimeStats?.totalRecordingTime || 0;

  // Calculer les jours depuis le début avec logique corrigée
  let firstActivityDate =
    analytics?.lifetimeStats?.firstActivityDate || analytics?.createdAt;

  // Si pas de date d'activité, utiliser la date de création du premier script comme référence
  if (!firstActivityDate && scripts.length > 0) {
    // Filtrer les scripts de bienvenue automatiques pour trouver la vraie première activité
    const nonWelcomeScripts = scripts.filter(
      (script) =>
        !script.title.toLowerCase().includes("guide") &&
        !script.title.toLowerCase().includes("bienvenue") &&
        !script.title.toLowerCase().includes("welcome") &&
        !script.title.toLowerCase().includes("complete guide") &&
        !script.title.toLowerCase().includes("guía completa")
    );

    // Si on a des scripts non-bienvenue, utiliser le plus ancien
    if (nonWelcomeScripts.length > 0) {
      const oldestScript = nonWelcomeScripts.reduce((oldest, current) => {
        const oldestDate = new Date(oldest.createdAt);
        const currentDate = new Date(current.createdAt);
        return currentDate < oldestDate ? current : oldest;
      });
      firstActivityDate = oldestScript.createdAt;
    } else {
      // Sinon, utiliser la date du script le plus récent (probablement aujourd'hui)
      const newestScript = scripts.reduce((newest, current) => {
        const newestDate = new Date(newest.createdAt);
        const currentDate = new Date(current.createdAt);
        return currentDate > newestDate ? current : newest;
      });
      firstActivityDate = newestScript.createdAt;
    }
  }

  // Fallback à aujourd'hui si toujours pas de date
  if (!firstActivityDate) {
    firstActivityDate = new Date().toISOString();
  }

  // Calculer les jours avec une logique intelligente
  let daysSinceStart = Math.ceil(
    (Date.now() - new Date(firstActivityDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Si l'utilisateur n'a que des scripts de bienvenue et que la date semble incorrecte (plus de 7 jours)
  const hasOnlyWelcomeScripts = scripts.every(
    (script) =>
      script.title.toLowerCase().includes("guide") ||
      script.title.toLowerCase().includes("bienvenue") ||
      script.title.toLowerCase().includes("welcome") ||
      script.title.toLowerCase().includes("complete guide") ||
      script.title.toLowerCase().includes("guía completa")
  );

  if (hasOnlyWelcomeScripts && daysSinceStart > 7) {
    // Pour un nouveau compte, utiliser la date du script le plus récent comme référence
    const newestScript = scripts.reduce((newest, current) => {
      const newestDate = new Date(newest.createdAt);
      const currentDate = new Date(current.createdAt);
      return currentDate > newestDate ? current : newest;
    });

    // Calculer depuis la création du compte (date du premier script de bienvenue)
    const daysSinceAccountCreation = Math.ceil(
      (Date.now() - new Date(newestScript.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const oldDays = daysSinceStart;
    daysSinceStart = Math.max(1, daysSinceAccountCreation);

    // Log de correction occasionnel pour éviter le spam
    if (oldDays !== daysSinceStart && Math.random() < 0.1) {
      logger.debug(
        `📊 LifetimeStats - Nouveau compte: ${oldDays} jours → ${daysSinceStart} jours actifs`
      );
    }
  }

  // Utiliser le système de session pour compter les jours actifs réels
  const [realActiveDays, setRealActiveDays] = useState<number>(0);

  useEffect(() => {
    const loadActiveDays = async () => {
      const activeDays = await getActiveDaysCount();
      setRealActiveDays(activeDays);
    };
    loadActiveDays();
  }, []);

  // Utiliser les jours actifs basés sur les sessions si disponibles, sinon fallback
  const finalDaysActive =
    realActiveDays > 0 ? realActiveDays : Math.max(1, daysSinceStart);

  logger.debug(
    `📊 LifetimeStats - Jours actifs (sessions): ${realActiveDays}, Jours calculés: ${daysSinceStart}, Utilisé: ${finalDaysActive}`
  );

  return (
    <View
      style={[
        tw`p-4 rounded-2xl mb-4`,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      <View style={tw`flex-row items-center mb-4`}>
        <MaterialCommunityIcons
          name="trophy"
          size={24}
          color={currentTheme.colors.primary}
        />
        <H4 style={[tw`ml-2`, { color: currentTheme.colors.text }]}>
          {t("profile.analytics.lifetimeStats", "Statistiques à vie")}
        </H4>
      </View>

      <View style={tw`flex-row flex-wrap justify-between`}>
        {/* Scripts créés */}
        <View style={tw`w-1/2 mb-3`}>
          <Caption
            style={[tw`mb-1`, { color: currentTheme.colors.textSecondary }]}
          >
            {t("profile.analytics.totalScriptsCreated", "Scripts créés")}
          </Caption>
          <HeadingText
            size="2xl"
            weight="bold"
            color={currentTheme.colors.text}
          >
            {totalScriptsCreated}
          </HeadingText>
        </View>

        {/* Enregistrements créés */}
        <View style={tw`w-1/2 mb-3`}>
          <Caption
            style={[tw`mb-1`, { color: currentTheme.colors.textSecondary }]}
          >
            {t("profile.analytics.totalRecordingsCreated", "Enregistrements")}
          </Caption>
          <HeadingText
            size="2xl"
            weight="bold"
            color={currentTheme.colors.text}
          >
            {totalRecordingsCreated}
          </HeadingText>
        </View>

        {/* Temps total */}
        <View style={tw`w-1/2 mb-3`}>
          <Caption
            style={[tw`mb-1`, { color: currentTheme.colors.textSecondary }]}
          >
            {t("profile.analytics.totalRecordingTime", "Temps total")}
          </Caption>
          <HeadingText
            size="2xl"
            weight="bold"
            color={currentTheme.colors.text}
          >
            {formatDuration(totalRecordingTime)}
          </HeadingText>
        </View>

        {/* Jours depuis le début */}
        <View style={tw`w-1/2 mb-3`}>
          <Caption
            style={[tw`mb-1`, { color: currentTheme.colors.textSecondary }]}
          >
            {t("profile.analytics.daysSinceStart", "Jours actif")}
          </Caption>
          <HeadingText
            size="2xl"
            weight="bold"
            color={currentTheme.colors.text}
          >
            {finalDaysActive}
          </HeadingText>
        </View>
      </View>

      <View
        style={[
          tw`mt-3 p-3 rounded-lg flex-row items-center`,
          { backgroundColor: `${currentTheme.colors.primary}10` },
        ]}
      >
        <MaterialCommunityIcons
          name="information"
          size={16}
          color={currentTheme.colors.primary}
        />
        <Caption
          style={[
            tw`ml-2 flex-1`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {t(
            "profile.analytics.lifetimeNote",
            "Ces statistiques ne diminuent jamais, même si vous supprimez des scripts ou enregistrements."
          )}
        </Caption>
      </View>
    </View>
  );
};
