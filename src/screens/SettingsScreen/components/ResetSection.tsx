import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { ResetSectionProps } from "../types";

export default function ResetSection({
  onClearCache,
  isClearingCache,
  cacheSize,
}: ResetSectionProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View>
      {/* Informations du cache */}
      {cacheSize && (
        <View
          style={[
            tw`p-3 rounded-xl mb-3`,
            { backgroundColor: currentTheme.colors.background },
          ]}
        >
          <View style={tw`flex-row items-center justify-between`}>
            <Text
              style={[
                tw`text-sm font-medium`,
                { color: currentTheme.colors.text },
              ]}
            >
              {t("settings.cache.size", "Taille du cache")}
            </Text>
            <Text
              style={[
                tw`text-sm`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {cacheSize}
            </Text>
          </View>
        </View>
      )}

      {/* Bouton de nettoyage */}
      <Pressable
        onPress={onClearCache}
        disabled={isClearingCache}
        style={({ pressed }) => [
          tw`flex-row items-center justify-center p-4 rounded-xl`,
          {
            backgroundColor: pressed ? "#ef444430" : "#ef444415",
            opacity: isClearingCache ? 0.7 : 1,
          },
        ]}
      >
        {isClearingCache ? (
          <ActivityIndicator size="small" color="#ef4444" />
        ) : (
          <>
            <MaterialCommunityIcons
              name="delete-sweep"
              size={20}
              color="#ef4444"
              style={tw`mr-2`}
            />
            <Text style={[tw`text-base font-medium`, { color: "#ef4444" }]}>
              {t("settings.clearCache.title", "Vider le cache")}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
