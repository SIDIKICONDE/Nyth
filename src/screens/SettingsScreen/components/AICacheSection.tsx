import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import tw from "twrnc";

import { UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { useCacheManagement } from "../../../hooks/ai-settings/useCacheManagement";
import { useTranslation } from "../../../hooks/useTranslation";

export default function AICacheSection() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { clearingCache, cacheStats, refreshCacheStats, clearCache } =
    useCacheManagement();

  const [isExpanded, setIsExpanded] = useState(false);

  // Charger les statistiques au montage
  useEffect(() => {
    refreshCacheStats();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 O";
    const k = 1024;
    const sizes = ["O", "Ko", "Mo", "Go"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const hasCache = cacheStats.entryCount > 0;
  const sizeFormatted = formatBytes(cacheStats.sizeInBytes);

  return (
    <View>
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        style={tw`flex-row items-center justify-between py-3`}
      >
        <View style={tw`flex-row items-center flex-1`}>
          <View
            style={[
              tw`p-2 rounded-full mr-3`,
              { backgroundColor: "#6366f120" },
            ]}
          >
            <MaterialCommunityIcons name="database" size={20} color="#6366f1" />
          </View>
          <View style={tw`flex-1`}>
            <UIText
              size="base"
              weight="medium"
              color={currentTheme.colors.text}
            >
              {t("aiSettings.cache.title", "Gestion du Cache")}
            </UIText>
            <UIText size="sm" color={currentTheme.colors.textSecondary}>
              {hasCache
                ? `${cacheStats.entryCount} ${t(
                    "aiSettings.cache.entriesCount",
                    "entrées"
                  )} • ${sizeFormatted}`
                : t("aiSettings.cache.noCache", "Vide")}
            </UIText>
          </View>
        </View>

        <View style={tw`flex-row items-center`}>
          {/* Bouton de nettoyage rapide */}
          {hasCache && (
            <Pressable
              onPress={clearCache}
              disabled={clearingCache}
              style={[
                tw`p-2 rounded-lg mr-2`,
                { backgroundColor: "#ef444415" },
              ]}
            >
              {clearingCache ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <MaterialCommunityIcons
                  name="delete-sweep"
                  size={18}
                  color="#ef4444"
                />
              )}
            </Pressable>
          )}

          {/* Icône d'expansion */}
          <MaterialCommunityIcons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={currentTheme.colors.textSecondary}
          />
        </View>
      </Pressable>

      {/* Détails étendus (optionnel) */}
      {isExpanded && hasCache && (
        <View style={tw`mt-4 pt-4 border-t border-gray-200`}>
          <View style={tw`flex-row justify-between items-center mb-2`}>
            <UIText size="sm" color={currentTheme.colors.textSecondary}>
              {t("aiSettings.cache.entries", "Conversations en cache")}
            </UIText>
            <UIText size="sm" weight="medium" color={currentTheme.colors.text}>
              {cacheStats.entryCount}
            </UIText>
          </View>

          <View style={tw`flex-row justify-between items-center mb-2`}>
            <UIText size="sm" color={currentTheme.colors.textSecondary}>
              {t("aiSettings.cache.size", "Espace utilisé")}
            </UIText>
            <UIText size="sm" weight="medium" color={currentTheme.colors.text}>
              {sizeFormatted}
            </UIText>
          </View>

          {/* Bouton de nettoyage complet */}
          <Pressable
            onPress={clearCache}
            disabled={clearingCache}
            style={[
              tw`mt-3 p-3 rounded-lg flex-row items-center justify-center`,
              { backgroundColor: "#ef444415" },
            ]}
          >
            {clearingCache ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="delete-sweep"
                  size={18}
                  color="#ef4444"
                  style={tw`mr-2`}
                />
                <UIText size="sm" weight="medium" color="#ef4444">
                  {t("aiSettings.cache.clearCache", "Vider le cache IA")}
                </UIText>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* Message si vide */}
      {!hasCache && isExpanded && (
        <View style={tw`mt-4 pt-4 border-t border-gray-200`}>
          <View style={tw`items-center py-4`}>
            <MaterialCommunityIcons
              name="database-off"
              size={32}
              color={currentTheme.colors.textSecondary}
              style={tw`mb-2`}
            />
            <UIText
              size="sm"
              color={currentTheme.colors.textSecondary}
              align="center"
            >
              {t(
                "aiSettings.cache.explanation",
                "Aucune donnée en cache.\nLes conversations futures seront mises en cache automatiquement."
              )}
            </UIText>
          </View>
        </View>
      )}
    </View>
  );
}
