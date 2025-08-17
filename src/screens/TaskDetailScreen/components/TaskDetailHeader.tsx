import React from "react";
import { TouchableOpacity, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { Task } from "../../../types/planning";
import { styles } from "../styles";

import { TaskDetailHeaderProps } from "../types";

export const TaskDetailHeader: React.FC<TaskDetailHeaderProps> = ({
  task,
  onGoBack,
  onMenuPress,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.modernHeader,
        {
          backgroundColor: currentTheme.colors.background,
        },
      ]}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={onGoBack} style={styles.modernBackButton}>
          <Ionicons
            name="chevron-back"
            size={28}
            color={currentTheme.colors.primary}
          />
        </TouchableOpacity>

        <View style={styles.modernHeaderTitle}>
          <UIText
            size="xl"
            weight="bold"
            numberOfLines={1}
            style={styles.taskTitle}
          >
            {task.title}
          </UIText>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: currentTheme.colors.primary },
              ]}
            />
            <UIText
              size="xs"
              color={currentTheme.colors.textSecondary}
              style={styles.statusText}
            >
              {t("planning.tasks.taskDetails", "Détails de la tâche")}
            </UIText>
          </View>
        </View>

        <TouchableOpacity
          onPress={onMenuPress}
          style={styles.modernActionButton}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={currentTheme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
