import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, { useMemo } from "react";
import { Dimensions, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { Script } from "../../types";
import { ContentText, UIText } from "../ui/Typography";

interface ScriptCardProps {
  script: Script;
  numColumns: number;
  index?: number;
  stackMode?: boolean;
  onPress: () => void;
  onDelete: () => void;
  isSelected?: boolean | null;
  onToggleSelection?: () => void;
  onLongPress?: () => void;
  onToggleFavorite?: () => void;
}

export default function ScriptCard({
  script,
  numColumns,
  index = 0,
  stackMode = false,
  onPress,
  onDelete,
  isSelected = null,
  onToggleSelection,
  onLongPress,
  onToggleFavorite,
}: ScriptCardProps) {
  const { currentTheme } = useTheme();
  const { t, currentLanguage } = useTranslation();
  const isSelectionMode = isSelected !== null;

  const formatDate = (date: Date) => {
    // Utilise la langue courante de l'utilisateur pour le formatage
    const locale = currentLanguage === "fr" ? "fr-FR" : "en-US";
    return new Date(date).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  const formatTime = (date: Date) => {
    // Utilise la langue courante de l'utilisateur pour le formatage
    const locale = currentLanguage === "fr" ? "fr-FR" : "en-US";
    return new Date(date).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cardStyle = numColumns > 1 ? tw`flex-1 mx-1 mb-3` : tw`mx-3 mb-3`;

  // Style pour l'effet Stack
  const stackStyle = stackMode
    ? {
        zIndex: 100 - index,
        marginBottom: index === 0 ? 16 : 4,
      }
    : {};

  // Ombre renforcée pour l'effet Stack
  const stackShadow = stackMode
    ? {
        shadowOpacity: 0.15 + index * 0.03,
        shadowRadius: 4 + index * 2,
        shadowOffset: { width: 0, height: 2 + index },
        elevation: 3 + index,
      }
    : {
        shadowOpacity: 0.08,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      };

  const handlePress = () => {
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection();
    } else {
      onPress();
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
    }
  };

  // Calcul dynamique de la longueur d'aperçu du contenu
  const contentPreviewLength = useMemo(() => {
    const screenWidth = Dimensions.get("window").width;
    // Adapte la longueur en fonction de la largeur d'écran et du nombre de colonnes
    if (numColumns > 1) {
      return Math.floor(screenWidth / (numColumns * 8)); // Environ 8 pixels par caractère pour les grilles
    } else {
      return Math.floor(screenWidth / 6); // Environ 6 pixels par caractère pour la vue liste
    }
  }, [numColumns]);

  // Préparation du contenu pour l'affichage (gestion des sauts de ligne)
  const prepareContentPreview = (content: string, maxLength: number) => {
    // Remplacer les sauts de ligne par des espaces pour l'aperçu
    const flattenedContent = content.replace(/\n/g, " ");

    // Tronquer à la longueur maximale
    return flattenedContent.length > maxLength
      ? `${flattenedContent.substring(0, maxLength)}...`
      : flattenedContent;
  };

  return (
    <TouchableOpacity
      style={[
        cardStyle,
        tw`rounded-lg p-3`,
        {
          backgroundColor: isSelected
            ? `${currentTheme.colors.primary}10`
            : currentTheme.colors.surface,
          borderWidth: 1,
          borderColor: isSelected
            ? currentTheme.colors.primary
            : currentTheme.colors.border,
          shadowColor: currentTheme.colors.primary,
          ...stackShadow,
          // Assurer une hauteur minimale pour éviter les problèmes d'affichage
          minHeight: 90,
        },
        stackStyle,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={tw`flex-1`}>
        <View style={tw`flex-row justify-between items-start mb-2`}>
          <View style={tw`flex-row items-center flex-1 mr-2`}>
            {isSelectionMode ? (
              <MaterialCommunityIcons
                name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
                size={22}
                color={
                  isSelected
                    ? currentTheme.colors.primary
                    : currentTheme.colors.textSecondary
                }
                style={tw`mr-1`}
              />
            ) : (
              <UIText>📝 </UIText>
            )}
            <UIText size={16} weight="500" style={tw`flex-1`} numberOfLines={1}>
              {script.title}
            </UIText>
            {/* Indicateur de favori */}
            {script.isFavorite && !isSelectionMode && (
              <MaterialCommunityIcons
                name="star"
                size={16}
                color="#FFD700"
                style={tw`ml-1`}
              />
            )}
          </View>

          <UIText
            size={11}
            color={currentTheme.colors.textSecondary}
            style={tw`flex-shrink-0`}
            numberOfLines={1}
          >
            {formatDate(new Date(script.updatedAt))}
          </UIText>
        </View>

        <ContentText
          size={12}
          color={currentTheme.colors.textMuted}
          numberOfLines={2}
          style={tw`mt-1`}
        >
          {prepareContentPreview(script.content, contentPreviewLength)}
        </ContentText>
      </View>
    </TouchableOpacity>
  );
}
