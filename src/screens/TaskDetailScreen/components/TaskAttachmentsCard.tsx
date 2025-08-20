import React from "react";
import { View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { Task } from "../../../types/planning";
import { styles } from "../styles";

import { TaskAttachmentsCardProps } from "../types";

export const TaskAttachmentsCard: React.FC<TaskAttachmentsCardProps> = ({
  task,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const hasAttachments =
    (task.attachments && task.attachments.length > 0) ||
    (task.images && task.images.length > 0) ||
    (task.tags && task.tags.length > 0);

  if (!hasAttachments) {
    return null;
  }

  return (
    <View
      style={[
        styles.footerCard,
        {
          backgroundColor: currentTheme.colors.surface,
          shadowColor: currentTheme.colors.text,
        },
      ]}
    >
      <View style={styles.footerContent}>
        {/* Section gauche - Fichiers */}
        <View style={styles.footerSection}>
          <UIText
            size="xs"
            weight="semibold"
            color={currentTheme.colors.textSecondary}
            style={styles.sectionTitle}
          >
            Fichiers
          </UIText>
          <View style={styles.footerLeftSection}>
            {(task.attachments && task.attachments.length > 0) ||
            (task.images && task.images.length > 0) ? (
              <>
                {task.attachments && task.attachments.length > 0 && (
                  <View
                    style={[
                      styles.footerBadge,
                      { backgroundColor: currentTheme.colors.primary + "15" },
                    ]}
                  >
                    <Ionicons
                      name="document"
                      size={14}
                      color={currentTheme.colors.primary}
                    />
                    <UIText
                      size="xs"
                      weight="semibold"
                      color={currentTheme.colors.primary}
                    >
                      {task.attachments.length}
                    </UIText>
                  </View>
                )}

                {task.images && task.images.length > 0 && (
                  <View
                    style={[
                      styles.footerBadge,
                      { backgroundColor: currentTheme.colors.success + "15" },
                    ]}
                  >
                    <Ionicons
                      name="image"
                      size={14}
                      color={currentTheme.colors.success}
                    />
                    <UIText
                      size="xs"
                      weight="semibold"
                      color={currentTheme.colors.success}
                    >
                      {task.images.length}
                    </UIText>
                  </View>
                )}
              </>
            ) : (
              <UIText
                size="xs"
                color={currentTheme.colors.textSecondary}
                style={styles.emptyText}
              >
                Aucun fichier
              </UIText>
            )}
          </View>
        </View>

        {/* Section droite - Tags */}
        <View style={styles.footerSection}>
          <UIText
            size="xs"
            weight="semibold"
            color={currentTheme.colors.textSecondary}
            style={styles.sectionTitle}
          >
            Tags
          </UIText>
          <View style={styles.footerRightSection}>
            {task.tags && task.tags.length > 0 ? (
              <View
                style={[
                  styles.footerBadge,
                  { backgroundColor: currentTheme.colors.warning + "15" },
                ]}
              >
                <Ionicons
                  name="pricetag"
                  size={14}
                  color={currentTheme.colors.warning}
                />
                <UIText
                  size="xs"
                  weight="semibold"
                  color={currentTheme.colors.warning}
                >
                  {task.tags.length}
                </UIText>
              </View>
            ) : (
              <UIText
                size="xs"
                color={currentTheme.colors.textSecondary}
                style={styles.emptyText}
              >
                Aucun tag
              </UIText>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};
