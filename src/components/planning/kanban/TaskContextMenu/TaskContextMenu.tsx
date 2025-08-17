import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { Task } from "../../../../types/planning";
import { UIText } from "../../../ui/Typography";
import { FLOATING_Z_INDEX } from "../../../../constants/floatingStyles";

interface TaskContextMenuProps {
  task: Task | null;
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
  onChangeStatus: () => void;
  onDelete: () => void;
  onCancelReminders?: () => void;
}

export const TaskContextMenu: React.FC<TaskContextMenuProps> = ({
  task,
  visible,
  position,
  onClose,
  onEdit,
  onChangeStatus,
  onDelete,
  onCancelReminders,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  if (!task) return null;

  const canCancel = !!onCancelReminders && !!task?.id;
  const menuItems = [
    {
      icon: "✏️",
      label: t("planning.tasks.kanban.taskContextMenu.edit", "Éditer"),
      action: () => {
        onEdit();
        onClose();
      },
      color: currentTheme.colors.primary,
    },
    {
      icon: "🛠️",
      label: t(
        "planning.tasks.kanban.taskContextMenu.changeStatus",
        "Modifier le statut"
      ),
      action: () => {
        onChangeStatus();
        // Ne pas appeler onClose() ici car onChangeStatus() gère déjà la fermeture du menu
        // et nous devons garder selectedTask pour le modal de statut
      },
      color: currentTheme.colors.warning || "#f59e0b",
    },
    canCancel && {
      icon: "🔕",
      label: t(
        "planning.tasks.kanban.taskContextMenu.cancelReminders",
        "Annuler les rappels"
      ),
      action: () => {
        onCancelReminders?.();
        onClose();
      },
      color: currentTheme.colors.text,
    },
    {
      icon: "🗑️",
      label: t("planning.tasks.kanban.taskContextMenu.delete", "Supprimer"),
      action: () => {
        onDelete();
        onClose();
      },
      color: currentTheme.colors.error || "#ef4444",
    },
  ].filter(Boolean) as Array<{
    icon: string;
    label: string;
    action: () => void;
    color: string;
  }>;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Overlay pour fermer le menu */}
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.menuContainer,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
              shadowColor: "#000",
              top: position.y,
              left: position.x,
            },
          ]}
          onPress={() => {}} // Empêcher la propagation
        >
          {/* Items du menu */}
          <View style={styles.menuItems}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && {
                    borderBottomColor: currentTheme.colors.border,
                    borderBottomWidth: 0.5,
                  },
                ]}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <UIText size="base" align="center" style={styles.menuIcon}>
                  {item.icon}
                </UIText>
                <UIText
                  size="base"
                  weight="medium"
                  color={item.color}
                  style={styles.menuLabel}
                >
                  {item.label}
                </UIText>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: FLOATING_Z_INDEX.CONTEXT_MENU,
  },
  menuContainer: {
    position: "absolute",
    minWidth: 200,
    maxWidth: 250,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    overflow: "hidden",
    zIndex: FLOATING_Z_INDEX.CONTEXT_MENU,
  },

  menuItems: {
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIcon: {
    // fontSize supprimé - géré par UIText
    width: 20,
    // textAlign supprimé - géré par UIText
  },
  menuLabel: {
    // fontSize et fontWeight supprimés - gérés par UIText
    flex: 1,
  },
});
