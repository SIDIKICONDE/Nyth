import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { ActionButton } from "./ActionButton";
import { TeleprompterSelectionModalProps } from "./types";
import { getActionButtonConfigs } from "./utils/getActionButtonConfig";

interface ActionGridProps
  extends Omit<TeleprompterSelectionModalProps, "visible" | "onClose"> {}

export const ActionGrid: React.FC<ActionGridProps> = ({
  onSelectTeleprompterWithCamera,
  onEdit,
  onToggleFavorite,
  isFavorite,
  onDuplicate,
  onDelete,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const buttonConfigs = getActionButtonConfigs(currentTheme.isDark);

  // Organiser les boutons par priorité
  const primaryActions = [
    {
      ...buttonConfigs.camera.config,
      onPress: onSelectTeleprompterWithCamera,
      title: t(buttonConfigs.camera.translationKey),
      show: true,
    },
    {
      ...buttonConfigs.edit.config,
      onPress: onEdit || (() => {}),
      title: t(buttonConfigs.edit.translationKey),
      show: !!onEdit,
    },
  ].filter((action) => action.show);

  const secondaryActions = [
    {
      ...(isFavorite
        ? buttonConfigs.unfavorite.config
        : buttonConfigs.favorite.config),
      onPress: onToggleFavorite || (() => {}),
      title: t(
        isFavorite
          ? buttonConfigs.unfavorite.translationKey
          : buttonConfigs.favorite.translationKey,
        isFavorite ? "Retirer" : "Favori"
      ),
      show: !!onToggleFavorite,
    },
    {
      ...buttonConfigs.duplicate.config,
      onPress: onDuplicate || (() => {}),
      title: t(buttonConfigs.duplicate.translationKey),
      show: !!onDuplicate,
    },
    {
      ...buttonConfigs.delete.config,
      onPress: onDelete || (() => {}),
      title: t(buttonConfigs.delete.translationKey),
      show: !!onDelete,
    },
  ].filter((action) => action.show);

  return (
    <View style={tw`items-center`}>
      {/* Actions principales */}
      {primaryActions.length > 0 && (
        <View style={tw`flex-row justify-center flex-wrap mb-2`}>
          {primaryActions.map((action, index) => (
            <ActionButton
              key={`primary-${index}`}
              {...action}
              textColor={currentTheme.colors.text}
            />
          ))}
        </View>
      )}

      {/* Actions secondaires */}
      {secondaryActions.length > 0 && (
        <View style={tw`flex-row justify-center flex-wrap`}>
          {secondaryActions.map((action, index) => (
            <ActionButton
              key={`secondary-${index}`}
              {...action}
              textColor={currentTheme.colors.text}
            />
          ))}
        </View>
      )}
    </View>
  );
};
