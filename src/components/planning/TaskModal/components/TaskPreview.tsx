import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { Task, TaskCustomization } from "../../../../types/planning";
import { UIText } from "../../../ui/Typography";
import { TaskCard } from "../../kanban/TaskCard";

interface TaskPreviewProps {
  customization: TaskCustomization;
}

const SAMPLE_TASK: Task & { customization?: TaskCustomization } = {
  id: "preview-task",
  userId: "preview-user",
  title: "", // Sera défini dynamiquement avec traduction
  description: "", // Sera défini dynamiquement avec traduction
  status: "in_progress",
  priority: "medium",
  estimatedHours: 2.5,
  tags: ["Design", "UI/UX", "Figma"],
  category: "creative",
  dependencies: [],
  blockedBy: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
};

export const TaskPreview: React.FC<TaskPreviewProps> = ({ customization }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const previewTask = {
    ...SAMPLE_TASK,
    title: t(
      "planning.tasks.taskModal.customization.preview.sampleTitle",
      "Exemple de tâche personnalisée"
    ),
    description: t(
      "planning.tasks.taskModal.customization.preview.sampleDescription",
      "This is a preview of your task card with the applied customization."
    ),
    customization,
  };

  const getStyleLabel = (style: string) => {
    switch (style) {
      case "default":
        return t(
          "planning.tasks.taskModal.customization.preview.styles.default",
          "Standard"
        );
      case "minimal":
        return t(
          "planning.tasks.taskModal.customization.preview.styles.minimal",
          "Minimaliste"
        );
      case "detailed":
        return t(
          "planning.tasks.taskModal.customization.preview.styles.detailed",
          "Détaillé"
        );
      case "creative":
        return t(
          "planning.tasks.taskModal.customization.preview.styles.creative",
          "Créatif"
        );
      default:
        return t(
          "planning.tasks.taskModal.customization.preview.styles.default",
          "Standard"
        );
    }
  };

  return (
    <View style={styles.container}>
      <UIText
        size="base"
        weight="bold"
        color={currentTheme.colors.text}
        align="center"
        style={styles.title}
      >
        {t(
          "planning.tasks.taskModal.customization.preview.title",
          "📱 Aperçu de la carte"
        )}
      </UIText>

      <View style={styles.previewContainer}>
        <TaskCard
          task={previewTask}
          onPress={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          isDragging={false}
        />
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <UIText
            size="sm"
            weight="medium"
            color={currentTheme.colors.textSecondary}
          >
            {t(
              "planning.tasks.taskModal.customization.preview.styleLabel",
              "Style:"
            )}
          </UIText>
          <UIText size="sm" weight="semibold" color={currentTheme.colors.text}>
            {getStyleLabel(customization.cardStyle || "default")}
          </UIText>
        </View>

        <View style={styles.infoRow}>
          <UIText
            size="sm"
            weight="medium"
            color={currentTheme.colors.textSecondary}
          >
            {t(
              "planning.tasks.taskModal.customization.preview.colorLabel",
              "Couleur:"
            )}
          </UIText>
          <View style={styles.colorInfo}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: customization.cardColor || "#3B82F6" },
              ]}
            />
            <UIText
              size="sm"
              weight="semibold"
              color={currentTheme.colors.text}
            >
              {customization.cardColor || "#3B82F6"}
            </UIText>
          </View>
        </View>

        <View style={styles.infoRow}>
          <UIText
            size="sm"
            weight="medium"
            color={currentTheme.colors.textSecondary}
          >
            {t(
              "planning.tasks.taskModal.customization.preview.iconLabel",
              "Icône:"
            )}
          </UIText>
          <UIText size="sm" weight="semibold" color={currentTheme.colors.text}>
            {customization.cardIcon || "💼"}
          </UIText>
        </View>

        <View style={styles.featuresContainer}>
          <UIText
            size="sm"
            weight="semibold"
            color={currentTheme.colors.text}
            style={styles.featuresTitle}
          >
            {t(
              "planning.tasks.taskModal.customization.preview.featuresTitle",
              "Fonctionnalités activées:"
            )}
          </UIText>
          <View style={styles.featuresList}>
            {[
              {
                key: "showEstimatedTime",
                label: t(
                  "planning.tasks.taskModal.customization.preview.features.estimatedTime",
                  "Temps estimé"
                ),
                enabled: customization.showEstimatedTime,
              },
              {
                key: "showProgress",
                label: t(
                  "planning.tasks.taskModal.customization.preview.features.progress",
                  "Progression"
                ),
                enabled: customization.showProgress,
              },
              {
                key: "showAttachments",
                label: t(
                  "planning.tasks.taskModal.customization.preview.features.attachments",
                  "Pièces jointes"
                ),
                enabled: customization.showAttachments,
              },
              {
                key: "showSubtasks",
                label: t(
                  "planning.tasks.taskModal.customization.preview.features.subtasks",
                  "Sous-tâches"
                ),
                enabled: customization.showSubtasks,
              },
            ].map((feature) => (
              <View key={feature.key} style={styles.featureItem}>
                <View
                  style={[
                    styles.featureIndicator,
                    {
                      backgroundColor: feature.enabled
                        ? currentTheme.colors.primary
                        : currentTheme.colors.border,
                    },
                  ]}
                >
                  <UIText style={styles.featureIndicatorText}>
                    {feature.enabled ? "✓" : "✗"}
                  </UIText>
                </View>
                <UIText
                  size="xs"
                  weight="medium"
                  color={
                    feature.enabled
                      ? currentTheme.colors.text
                      : currentTheme.colors.textSecondary
                  }
                >
                  {feature.label}
                </UIText>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  previewContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  infoContainer: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  colorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featuresTitle: {
    marginBottom: 8,
  },
  featuresList: {
    gap: 6,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIndicatorText: {
    color: "white",
  },
});
