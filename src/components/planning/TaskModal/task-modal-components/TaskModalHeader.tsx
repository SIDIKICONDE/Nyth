import React from "react";
import { TouchableOpacity, View } from "react-native";
import { H3, UIText } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { COLORS } from "../task-modal-constants";
import { styles } from "../task-modal-styles";
import { TaskModalHeaderProps } from "../task-modal-types";

export const TaskModalHeader: React.FC<TaskModalHeaderProps> = ({
  title,
  isValid,
  hasChanges,
  isSubmitting,
  onClose,
  onSave,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[styles.header, { borderBottomColor: currentTheme.colors.border }]}
    >
      <TouchableOpacity onPress={onClose} style={styles.headerButton}>
        <UIText
          size={16}
          style={[
            styles.headerButtonText,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {t("planning.tasks.taskModal.cancel", "Annuler")}
        </UIText>
      </TouchableOpacity>

      <H3 style={[styles.title, { color: currentTheme.colors.text }]}>
        {title}
      </H3>

      <TouchableOpacity
        onPress={onSave}
        style={[
          styles.headerButton,
          styles.saveButton,
          {
            backgroundColor:
              isValid && hasChanges
                ? currentTheme.colors.primary
                : currentTheme.colors.border,
          },
        ]}
        disabled={!isValid || !hasChanges || isSubmitting}
      >
        <UIText
          size={14}
          weight="600"
          style={[
            styles.headerButtonText,
            styles.saveButtonText,
            {
              color:
                isValid && hasChanges
                  ? COLORS.WHITE
                  : currentTheme.colors.textSecondary,
            },
          ]}
        >
          {isSubmitting
            ? t("planning.tasks.taskModal.saving", "...")
            : t("planning.tasks.taskModal.save", "Sauvegarder")}
        </UIText>
      </TouchableOpacity>
    </View>
  );
};
