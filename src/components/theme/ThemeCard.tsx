import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { Dimensions, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { PRESET_THEMES } from "../../constants/themes";
import { CustomTheme } from "../../contexts/ThemeContext";
import { useTranslatedTheme } from "../../hooks/useTranslatedThemes";
import { useTranslation } from "../../hooks/useTranslation";

import { UIText } from "../ui/Typography";

const { width: screenWidth } = Dimensions.get("window");

interface ThemeCardProps {
  theme: CustomTheme;
  isSelected: boolean;
  numColumns: number;
  index: number;
  onSelect: (theme: CustomTheme) => void;
  onDelete?: (themeId: string) => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  isSelected,
  numColumns,
  index,
  onSelect,
  onDelete,
}) => {
  const { t } = useTranslation();
  const isCustom = !PRESET_THEMES.find(
    (presetTheme: CustomTheme) => presetTheme.id === theme.id
  );
  const translatedTheme = useTranslatedTheme(theme.id);

  // Utiliser le nom traduit pour les thèmes prédéfinis, sinon utiliser le nom original
  const displayName =
    !isCustom && translatedTheme ? translatedTheme.name : theme.name;

  const cardWidth =
    numColumns > 1
      ? (screenWidth - 24 - (numColumns - 1) * 12) / numColumns
      : screenWidth - 24;

  // Calculer si c'est la dernière colonne de la rangée
  const isLastInRow = numColumns > 1 ? (index + 1) % numColumns === 0 : true;

  const handleDelete = (e: any) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(theme.id);
    }
  };

  return (
    <TouchableOpacity
      style={[
        tw`mb-3 rounded-lg overflow-hidden`,
        {
          width: cardWidth,
          minHeight: 100,
          marginRight: numColumns > 1 && !isLastInRow ? 12 : 0,
        },
        isSelected && {
          borderWidth: 2,
          borderColor: theme.colors.primary,
        },
      ]}
      onPress={() => onSelect(theme)}
      activeOpacity={0.8}
    >
      <View style={tw`flex-1`}>
        <LinearGradient
          colors={[...(theme.colors.gradient as [string, string, ...string[]])]}
          style={[
            tw`p-2 min-h-24`,
            { backgroundColor: theme.colors.primary }, // Fallback color
          ]}
        >
          {/* Header du thème */}
          <View style={tw`justify-between items-start mb-1`}>
            <View style={tw`flex-1`}>
              <UIText size="sm" weight="bold" color={theme.colors.text}>
                {displayName}
              </UIText>
              <UIText
                size="xs"
                style={tw`opacity-80`}
                color={theme.colors.textSecondary}
              >
                {theme.isDark ? "🌙" : "☀️"}{" "}
                {isCustom
                  ? t("theme.card.customTheme", "Custom")
                  : t("theme.card.presetTheme", "Preset")}
              </UIText>
            </View>

            {isSelected && (
              <View
                style={[
                  tw`w-5 h-5 rounded-full items-center justify-center`,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={12}
                  color={theme.colors.primary}
                />
              </View>
            )}

            {isCustom && onDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                style={[
                  tw`w-5 h-5 rounded-full items-center justify-center`,
                  { backgroundColor: "rgba(255, 255, 255, 0.2)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="delete"
                  size={10}
                  color={theme.colors.error}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Aperçu des couleurs */}
          <View style={tw`flex-row justify-start items-center`}>
            <View
              style={[
                tw`w-4 h-4 rounded-full mr-1`,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <View
              style={[
                tw`w-4 h-4 rounded-full mr-1`,
                { backgroundColor: theme.colors.secondary },
              ]}
            />
            <View
              style={[
                tw`w-4 h-4 rounded-full`,
                { backgroundColor: theme.colors.accent },
              ]}
            />
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

export default ThemeCard;
