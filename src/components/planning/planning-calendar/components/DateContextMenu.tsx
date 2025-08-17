import React, { useMemo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";
import Ionicons from "react-native-vector-icons/Ionicons";

interface DateContextMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onCreateEvent: (date: Date) => void;
  onCreateGoal: (date: Date) => void;
  onCreateTask: (date: Date) => void;
  selectedDate: Date;
}

export const DateContextMenu: React.FC<DateContextMenuProps> = React.memo(
  ({
    isVisible,
    onClose,
    onCreateEvent,
    onCreateGoal,
    onCreateTask,
    selectedDate,
  }) => {
    const { currentTheme } = useTheme();
    const { t } = useTranslation();

    const handleCreateEvent = useCallback(() => {
      onClose();
      // Ajouter un petit délai pour permettre la fermeture du modal
      setTimeout(() => onCreateEvent(selectedDate), 100);
    }, [onClose, onCreateEvent, selectedDate]);

    const handleCreateGoal = useCallback(() => {
      onClose();
      setTimeout(() => onCreateGoal(selectedDate), 100);
    }, [onClose, onCreateGoal, selectedDate]);

    const handleCreateTask = useCallback(() => {
      onClose();
      setTimeout(() => onCreateTask(selectedDate), 100);
    }, [onClose, onCreateTask, selectedDate]);

    const menuItems = useMemo(
      () => [
        {
          icon: "calendar-outline" as const,
          label: t("planning.contextMenu.createEvent", "Créer un événement"),
          onPress: handleCreateEvent,
          color: currentTheme.colors.primary,
        },
        {
          icon: "flag-outline" as const,
          label: t("planning.contextMenu.createGoal", "Créer un objectif"),
          onPress: handleCreateGoal,
          color: "#10B981", // Vert pour les objectifs
        },
        {
          icon: "checkmark-circle-outline" as const,
          label: t("planning.contextMenu.createTask", "Créer une tâche"),
          onPress: handleCreateTask,
          color: "#F59E0B", // Orange pour les tâches
        },
      ],
      [
        currentTheme.colors.primary,
        t,
        handleCreateEvent,
        handleCreateGoal,
        handleCreateTask,
      ]
    );

    if (!isVisible) {
      return null;
    }

    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            style={[
              styles.menuContainer,
              { backgroundColor: currentTheme.colors.surface },
            ]}
            activeOpacity={1}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={`menu-item-${index}`}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.menuItemBorder,
                  { borderBottomColor: currentTheme.colors.border },
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <Ionicons name={item.icon} size={24} color={item.color} />
                <UIText
                  size="base"
                  style={styles.menuItemText}
                  color={currentTheme.colors.text}
                >
                  {item.label}
                </UIText>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }
);

DateContextMenu.displayName = "DateContextMenu";

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    width: "80%",
    maxWidth: 300,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
  },
  menuItemText: {
    marginLeft: 12,
  },
});
