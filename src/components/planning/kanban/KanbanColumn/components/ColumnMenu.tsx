import Ionicons from "react-native-vector-icons/Ionicons";
import React, { useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";
import { UIText } from "../../../../../components/ui/Typography";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { styles } from "../styles";
import { ColumnMenuProps } from "../types";

export const ColumnMenu: React.FC<ColumnMenuProps> = ({
  onColumnEdit,
  onColumnDelete,
  onCycleColor,
  availableColors,
  onSelectColor,
  themeColors,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const { t } = useTranslation();

  if (!onColumnEdit && !onColumnDelete && !onCycleColor && !availableColors)
    return null;

  const handleEdit = () => {
    setShowMenu(false);
    onColumnEdit?.();
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert(
      t("planning.tasks.kanban.columnMenu.deleteTitle", "Supprimer la colonne"),
      t(
        "planning.tasks.kanban.columnMenu.deleteConfirmation",
        "Êtes-vous sûr de vouloir supprimer cette colonne ? Les tâches seront déplacées vers la première colonne."
      ),
      [
        {
          text: t("planning.tasks.kanban.columnMenu.cancel", "Annuler"),
          style: "cancel",
        },
        {
          text: t("planning.tasks.kanban.columnMenu.delete", "Supprimer"),
          style: "destructive",
          onPress: () => onColumnDelete?.(),
        },
      ]
    );
  };

  const handleCycleColor = () => {
    setShowMenu(false);
    onCycleColor?.();
  };

  return (
    <View style={{ position: "relative" }}>
      <TouchableOpacity
        style={styles.columnMenuButton}
        onPress={() => setShowMenu(!showMenu)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="ellipsis-vertical"
          size={14}
          color={themeColors.textSecondary}
        />
      </TouchableOpacity>

      {showMenu && (
        <View
          style={{
            position: "absolute",
            top: 30,
            right: 0,
            backgroundColor: themeColors.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: themeColors.border,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            zIndex: 1000,
            minWidth: 140,
          }}
        >
          {onCycleColor && (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 8,
              }}
              onPress={handleCycleColor}
              activeOpacity={0.7}
            >
              <Ionicons
                name="color-palette"
                size={16}
                color={themeColors.textSecondary}
              />
              <UIText size="sm" color={themeColors.text}>
                {t(
                  "planning.tasks.kanban.columnMenu.changeColor",
                  "Changer la couleur"
                )}
              </UIText>
            </TouchableOpacity>
          )}
          {onColumnEdit && (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 8,
              }}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <Ionicons
                name="create"
                size={16}
                color={themeColors.textSecondary}
              />
              <UIText size="sm" color={themeColors.text}>
                {t("planning.tasks.kanban.columnMenu.edit", "Modifier")}
              </UIText>
            </TouchableOpacity>
          )}

          {onColumnDelete && (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 8,
              }}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={16} color={themeColors.error} />
              <UIText size="sm" color={themeColors.error}>
                {t("planning.tasks.kanban.columnMenu.delete", "Supprimer")}
              </UIText>
            </TouchableOpacity>
          )}

          {availableColors && availableColors.length > 0 && onSelectColor && (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: themeColors.border,
                paddingHorizontal: 10,
                paddingVertical: 8,
                gap: 8,
              }}
            >
              <UIText size="xs" color={themeColors.textSecondary}>
                {t(
                  "planning.tasks.kanban.columnMenu.quickColors",
                  "Couleurs rapides"
                )}
              </UIText>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  paddingBottom: 8,
                }}
              >
                {availableColors.slice(0, 12).map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      setShowMenu(false);
                      onSelectColor(c);
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: c,
                      borderWidth: 1,
                      borderColor: "rgba(0,0,0,0.15)",
                    }}
                    activeOpacity={0.8}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};
