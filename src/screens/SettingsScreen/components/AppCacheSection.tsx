import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import tw from "twrnc";

import { UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { useCache } from "../hooks/useCache";

export default function AppCacheSection() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    cacheSize,
    cacheSizeFormatted,
    isClearingCache,
    handleClearCache,
    loadCacheSize,
  } = useCache();

  const hasCache = cacheSize > 0;

  return (
    <View style={tw`mb-4`}>
      {/* En-tête compacte */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        style={tw`flex-row items-center justify-between`}
      >
        <View style={tw`flex-row items-center flex-1`}>
          <View
            style={[
              tw`p-2 rounded-full mr-3`,
              { backgroundColor: "#ef444420" },
            ]}
          >
            <MaterialCommunityIcons
              name="delete-sweep"
              size={20}
              color="#ef4444"
            />
          </View>
          <View style={tw`flex-1`}>
            <UIText
              size="lg"
              weight="semibold"
              color={currentTheme.colors.text}
            >
              {t("settings.clearCache.title", "Vider le Cache")}
            </UIText>
            <UIText size="sm" color={currentTheme.colors.textSecondary}>
              {hasCache
                ? `${t(
                    "settings.cache.size",
                    "Taille"
                  )} : ${cacheSizeFormatted}`
                : t("ui.cache.noData", "Aucune donnée")}
            </UIText>
          </View>
        </View>

        <View style={tw`flex-row items-center`}>
          {/* Bouton de nettoyage rapide */}
          {hasCache && (
            <Pressable
              onPress={handleClearCache}
              disabled={isClearingCache}
              style={[
                tw`p-2 rounded-lg mr-2`,
                { backgroundColor: "#ef444415" },
              ]}
            >
              {isClearingCache ? (
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

      {/* Détails étendus */}
      {isExpanded && (
        <View
          style={tw`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700`}
        >
          {hasCache ? (
            <>
              <View style={tw`flex-row justify-between items-center mb-2`}>
                <UIText size="sm" color={currentTheme.colors.textSecondary}>
                  {t("settings.cache.size", "Taille du cache")}
                </UIText>
                <UIText
                  size="sm"
                  weight="medium"
                  color={currentTheme.colors.text}
                >
                  {cacheSizeFormatted}
                </UIText>
              </View>

              {/* Description */}
              <View style={tw`mb-4`}>
                <UIText
                  size="sm"
                  color={currentTheme.colors.textSecondary}
                  align="left"
                >
                  {t(
                    "settings.clearCache.confirmation.message",
                    "Êtes-vous sûr de vouloir vider le cache ? Cela libérera de l'espace de stockage mais peut ralentir temporairement l'application."
                  )}
                </UIText>
              </View>

              {/* Bouton de nettoyage complet */}
              <Pressable
                onPress={handleClearCache}
                disabled={isClearingCache}
                style={[
                  tw`p-3 rounded-lg flex-row items-center justify-center`,
                  { backgroundColor: "#ef444415" },
                ]}
              >
                {isClearingCache ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color="#ef4444"
                      style={tw`mr-2`}
                    />
                    <UIText size="sm" weight="medium" color="#ef4444">
                      {t("ui.loading", "Chargement...")}
                    </UIText>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="delete-sweep"
                      size={18}
                      color="#ef4444"
                      style={tw`mr-2`}
                    />
                    <UIText size="sm" weight="medium" color="#ef4444">
                      {t("settings.clearCache.title", "Vider le Cache")}
                    </UIText>
                  </>
                )}
              </Pressable>
            </>
          ) : (
            /* Message si vide */
            <View style={tw`items-center py-4`}>
              <MaterialCommunityIcons
                name="delete-off"
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
                  "ui.cache.noDataDescription",
                  "Aucune donnée en cache.\nLe cache sera automatiquement créé lors de l'utilisation."
                )}
              </UIText>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
