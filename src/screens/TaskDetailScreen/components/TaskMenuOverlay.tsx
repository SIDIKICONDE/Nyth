import React from "react";
import { TouchableOpacity, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { styles } from "../styles";

import { TaskMenuOverlayProps } from "../types";

export const TaskMenuOverlay: React.FC<TaskMenuOverlayProps> = ({
  visible,
  showStatusSection,
  onClose,
  onEdit,
  onDelete,
  onToggleStatusSection,
}) => {
  const { currentTheme } = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.menuOverlay}>
      <TouchableOpacity
        style={styles.menuBackdrop}
        onPress={onClose}
        activeOpacity={1}
      />
      <View
        style={[
          styles.menuContainer,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            onClose();
            onEdit();
          }}
        >
          <Ionicons
            name="pencil"
            size={20}
            color={currentTheme.colors.primary}
          />
          <UIText size="base" style={styles.menuItemText}>
            Modifier
          </UIText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            onClose();
            onDelete();
          }}
        >
          <Ionicons name="trash" size={20} color={currentTheme.colors.error} />
          <UIText size="base" style={styles.menuItemText}>
            Supprimer
          </UIText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            onClose();
            onToggleStatusSection();
          }}
        >
          <Ionicons
            name={showStatusSection ? "eye-off" : "eye"}
            size={20}
            color={currentTheme.colors.textSecondary}
          />
          <UIText size="base" style={styles.menuItemText}>
            {showStatusSection ? "Masquer le statut" : "Afficher le statut"}
          </UIText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
