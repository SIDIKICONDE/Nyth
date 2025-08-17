import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { UIText } from "../../../../../components/ui/Typography";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { ActionMenuProps } from "../types";
import { goalUtils } from "../utils/goalUtils";

export const ActionMenu: React.FC<ActionMenuProps> = ({
  goal,
  visible,
  onClose,
  onEdit,
  onComplete,
  onReactivate,
  onDelete,
  onCancelReminders,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.menu,
            { backgroundColor: currentTheme.colors.surface },
          ]}
        >
          {/* Modifier */}
          <TouchableOpacity style={styles.menuItem} onPress={onEdit}>
            <UIText
              size="sm"
              weight="medium"
              style={[ui, styles.menuText, { color: currentTheme.colors.text }]}
            >
              ✏️ {t("planning.goals.actions.edit", "Modifier")}
            </UIText>
          </TouchableOpacity>

          {/* Marquer accompli (si actif) */}
          {goal.status === "active" && (
            <TouchableOpacity style={styles.menuItem} onPress={onComplete}>
              <UIText
                size="sm"
                weight="medium"
                style={[ui, styles.menuText, { color: "#10B981" }]}
              >
                ✓ {t("planning.goals.actions.complete", "Marquer accompli")}
              </UIText>
            </TouchableOpacity>
          )}

          {/* Réactiver (si accompli) */}
          {goalUtils.canReactivate(goal) && (
            <TouchableOpacity style={styles.menuItem} onPress={onReactivate}>
              <UIText
                size="sm"
                weight="medium"
                style={[ui, styles.menuText, { color: "#F59E0B" }]}
              >
                🔄 {t("planning.goals.actions.reactivate", "Réactiver")}
              </UIText>
            </TouchableOpacity>
          )}

          {/* Supprimer */}
          <TouchableOpacity style={styles.menuItem} onPress={onDelete}>
            <UIText
              size="sm"
              weight="medium"
              style={[ui, styles.menuText, { color: "#EF4444" }]}
            >
              🗑️ {t("planning.goals.actions.delete", "Supprimer")}
            </UIText>
          </TouchableOpacity>

          {/* Annuler les rappels */}
          <TouchableOpacity style={styles.menuItem} onPress={onCancelReminders}>
            <UIText
              size="sm"
              weight="medium"
              style={[ui, styles.menuText, { color: currentTheme.colors.text }]}
            >
              🔕{" "}
              {t(
                "planning.goals.actions.cancelReminders",
                "Annuler les rappels"
              )}
            </UIText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menu: {
    minWidth: 200,
    padding: 8,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuText: {},
});
