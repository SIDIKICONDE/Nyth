import React from "react";
import { Text, TextInput, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { LABELS, UI_CONFIG } from "../constants";
import { styles } from "../styles";
import { EventFormFieldsProps } from "../types";

export const EventFormFields: React.FC<EventFormFieldsProps> = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      {/* Title Field */}
      <View
        style={[
          styles.fieldContainer,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <Text style={[styles.fieldLabel, { color: currentTheme.colors.text }]}>
          {t("planning.events.titleLabel", LABELS.TITLE_REQUIRED)}
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              color: currentTheme.colors.text,
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
            },
          ]}
          value={title}
          onChangeText={onTitleChange}
          placeholder={t(
            "planning.events.titlePlaceholder",
            LABELS.TITLE_PLACEHOLDER
          )}
          placeholderTextColor={currentTheme.colors.textSecondary}
          multiline={false}
        />
      </View>

      {/* Description Field */}
      <View
        style={[
          styles.fieldContainer,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <Text style={[styles.fieldLabel, { color: currentTheme.colors.text }]}>
          {t("planning.events.descriptionLabel", LABELS.DESCRIPTION_LABEL)}
        </Text>
        <TextInput
          style={[
            styles.textInput,
            styles.textArea,
            {
              color: currentTheme.colors.text,
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
            },
          ]}
          value={description}
          onChangeText={onDescriptionChange}
          placeholder={t(
            "planning.events.descriptionPlaceholder",
            LABELS.DESCRIPTION_PLACEHOLDER
          )}
          placeholderTextColor={currentTheme.colors.textSecondary}
          multiline={true}
          numberOfLines={UI_CONFIG.TEXT_AREA_LINES}
        />
      </View>
    </>
  );
};
