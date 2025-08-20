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

interface TaskStatusModalProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onStatusChange: (newStatus: string) => void;
}

export const TaskStatusModal: React.FC<TaskStatusModalProps> = ({
  task,
  visible,
  onClose,
  onStatusChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // Définir les options de statut avec traductions
  const STATUS_OPTIONS = React.useMemo(
    () => [
      {
        value: "todo",
        label: t("planning.tasks.kanban.statusOptions.todo.label", "To Do"),
        icon: "📋",
        color: "#6b7280",
        description: t(
          "planning.tasks.kanban.statusOptions.todo.description",
          "Task not started"
        ),
      },
      {
        value: "in_progress",
        label: t(
          "planning.tasks.kanban.statusOptions.inProgress.label",
          "In Progress"
        ),
        icon: "⏳",
        color: "#f59e0b",
        description: t(
          "planning.tasks.kanban.statusOptions.inProgress.description",
          "Work in progress"
        ),
      },
      {
        value: "review",
        label: t("planning.tasks.kanban.statusOptions.review.label", "Review"),
        icon: "👀",
        color: "#8b5cf6",
        description: t(
          "planning.tasks.kanban.statusOptions.review.description",
          "Awaiting validation"
        ),
      },
      {
        value: "completed",
        label: t("planning.tasks.kanban.statusOptions.done.label", "Done"),
        icon: "✅",
        color: "#10b981",
        description: t(
          "planning.tasks.kanban.statusOptions.done.description",
          "Task completed"
        ),
      },
      {
        value: "blocked",
        label: t(
          "planning.tasks.kanban.statusOptions.blocked.label",
          "Blocked"
        ),
        icon: "🚫",
        color: "#ef4444",
        description: t(
          "planning.tasks.kanban.statusOptions.blocked.description",
          "Task is blocked"
        ),
      },
    ],
    [t]
  );

  if (!task) return null;

  const handleStatusSelect = (newStatus: string) => {
    onStatusChange(newStatus);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContainer}>
          <Pressable
            style={[
              styles.modalContent,
              {
                backgroundColor: currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
              },
            ]}
            onPress={() => {}} // Empêcher la propagation
          >
            {/* En-tête du modal */}
            <View
              style={[
                styles.header,
                { borderBottomColor: currentTheme.colors.border },
              ]}
            >
              <UIText
                size="lg"
                weight="bold"
                color={currentTheme.colors.text}
                style={styles.title}
              >
                {t("planning.tasks.kanban.statusModal.title", "Change Status")}
              </UIText>
              <UIText
                size="sm"
                color={currentTheme.colors.textSecondary}
                style={styles.taskTitle}
                numberOfLines={2}
              >
                {task.title}
              </UIText>
            </View>

            {/* Statut actuel */}
            <View style={styles.currentStatus}>
              <UIText
                size="xs"
                weight="semibold"
                color={currentTheme.colors.textSecondary}
                style={styles.currentStatusLabel}
              >
                {t(
                  "planning.tasks.kanban.statusModal.currentStatus",
                  "Current Status"
                )}
              </UIText>
              <View
                style={[
                  styles.currentStatusBadge,
                  {
                    backgroundColor:
                      STATUS_OPTIONS.find((opt) => opt.value === task.status)
                        ?.color + "20",
                  },
                ]}
              >
                <UIText size="base" style={styles.currentStatusIcon}>
                  {
                    STATUS_OPTIONS.find((opt) => opt.value === task.status)
                      ?.icon
                  }
                </UIText>
                <UIText
                  size="sm"
                  weight="semibold"
                  color={
                    STATUS_OPTIONS.find((opt) => opt.value === task.status)
                      ?.color
                  }
                  style={styles.currentStatusText}
                >
                  {
                    STATUS_OPTIONS.find((opt) => opt.value === task.status)
                      ?.label
                  }
                </UIText>
              </View>
            </View>

            {/* Options de statut */}
            <View style={styles.statusOptions}>
              <UIText
                size="xs"
                weight="semibold"
                color={currentTheme.colors.textSecondary}
                style={styles.optionsLabel}
              >
                {t(
                  "planning.tasks.kanban.statusModal.chooseNewStatus",
                  "Choose new status"
                )}
              </UIText>

              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusOption,
                    {
                      backgroundColor:
                        option.value === task.status
                          ? option.color + "20"
                          : "transparent",
                      borderColor:
                        option.value === task.status
                          ? option.color
                          : currentTheme.colors.border,
                    },
                  ]}
                  onPress={() => handleStatusSelect(option.value)}
                  disabled={option.value === task.status}
                  activeOpacity={0.7}
                >
                  <View style={styles.statusOptionContent}>
                    <UIText size="lg" align="center" style={styles.statusIcon}>
                      {option.icon}
                    </UIText>
                    <View style={styles.statusInfo}>
                      <UIText
                        size="base"
                        weight="semibold"
                        color={
                          option.value === task.status
                            ? option.color
                            : currentTheme.colors.text
                        }
                        style={styles.statusLabel}
                      >
                        {option.label}
                      </UIText>
                      <UIText
                        size="xs"
                        color={currentTheme.colors.textSecondary}
                        style={styles.statusDescription}
                      >
                        {option.description}
                      </UIText>
                    </View>
                    {option.value === task.status && (
                      <UIText
                        size="xs"
                        weight="bold"
                        color={option.color}
                        style={styles.currentBadge}
                      >
                        {t(
                          "planning.tasks.kanban.statusModal.current",
                          "Current"
                        )}
                      </UIText>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bouton Annuler */}
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { borderColor: currentTheme.colors.border },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <UIText
                size="base"
                weight="semibold"
                color={currentTheme.colors.textSecondary}
              >
                {t("planning.tasks.kanban.statusModal.cancel", "Cancel")}
              </UIText>
            </TouchableOpacity>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 0,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    // fontSize et fontWeight supprimés - gérés par UIText
    marginBottom: 8,
  },
  taskTitle: {
    // fontSize supprimé - géré par UIText
    lineHeight: 20,
  },
  currentStatus: {
    padding: 20,
    paddingBottom: 16,
  },
  currentStatusLabel: {
    // fontSize et fontWeight supprimés - gérés par UIText
    textTransform: "uppercase",
    marginBottom: 8,
  },
  currentStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 8,
  },
  currentStatusIcon: {
    // fontSize supprimé - géré par UIText
  },
  currentStatusText: {
    // fontSize et fontWeight supprimés - gérés par UIText
  },
  statusOptions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  optionsLabel: {
    // fontSize et fontWeight supprimés - gérés par UIText
    textTransform: "uppercase",
    marginBottom: 12,
  },
  statusOption: {
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
    overflow: "hidden",
  },
  statusOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  statusIcon: {
    // fontSize supprimé - géré par UIText
    width: 24,
    // textAlign supprimé - géré par UIText
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    // fontSize et fontWeight supprimés - gérés par UIText
    marginBottom: 2,
  },
  statusDescription: {
    // fontSize supprimé - géré par UIText
    lineHeight: 16,
  },
  currentBadge: {
    // fontSize et fontWeight supprimés - gérés par UIText
    textTransform: "uppercase",
  },
  cancelButton: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  cancelButtonText: {
    // fontSize et fontWeight supprimés - gérés par UIText
  },
});
