import Ionicons from "react-native-vector-icons/Ionicons";
import React, { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { UIText } from "../../../../ui/Typography";
import { ColumnFormFieldsProps } from "../types";

export const ColumnFormFields: React.FC<ColumnFormFieldsProps> = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();
  const [titleFocused, setTitleFocused] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);

  return (
    <View style={styles.container}>
      {/* Champ Titre */}
      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <UIText
            size="sm"
            weight="semibold"
            color={currentTheme.colors.text}
            style={styles.inputLabel}
          >
            {t("planning.tasks.kanban.column.fields.title", "Column Title")}
          </UIText>
          <UIText
            size="sm"
            weight="semibold"
            color={currentTheme.colors.error}
            style={styles.required}
          >
            *
          </UIText>
        </View>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: titleFocused
                ? currentTheme.colors.primary
                : title
                ? currentTheme.colors.border
                : currentTheme.colors.border,
              borderWidth: titleFocused ? 2 : 1,
            },
          ]}
        >
          <Ionicons
            name="text"
            size={18}
            color={
              titleFocused
                ? currentTheme.colors.primary
                : currentTheme.colors.textSecondary
            }
            style={styles.inputIcon}
          />
          <TextInput
            style={[
              styles.textInput,
              ui,
              {
                color: currentTheme.colors.text,
                flex: 1,
              },
            ]}
            value={title}
            onChangeText={onTitleChange}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
            placeholder={t(
              "planning.tasks.kanban.column.fields.titlePlaceholder",
              "e.g., To Do, In Progress, Done..."
            )}
            placeholderTextColor={currentTheme.colors.textSecondary}
            maxLength={50}
            returnKeyType="next"
          />
          <UIText
            size="xs"
            weight="medium"
            color={currentTheme.colors.textSecondary}
            style={styles.charCount}
          >
            {title.length}/50
          </UIText>
        </View>
      </View>

      {/* Champ Description */}
      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <UIText
            size="sm"
            weight="semibold"
            color={currentTheme.colors.text}
            style={styles.inputLabel}
          >
            {t(
              "planning.tasks.kanban.column.fields.description",
              "Description"
            )}
          </UIText>
          <UIText
            size="xs"
            color={currentTheme.colors.textSecondary}
            style={styles.optional}
          >
            (optionnelle)
          </UIText>
        </View>
        <View
          style={[
            styles.inputContainer,
            styles.textAreaContainer,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: descriptionFocused
                ? currentTheme.colors.primary
                : description
                ? currentTheme.colors.border
                : currentTheme.colors.border,
              borderWidth: descriptionFocused ? 2 : 1,
            },
          ]}
        >
          <Ionicons
            name="document-text"
            size={18}
            color={
              descriptionFocused
                ? currentTheme.colors.primary
                : currentTheme.colors.textSecondary
            }
            style={[styles.inputIcon, styles.textAreaIcon]}
          />
          <TextInput
            style={[
              styles.textInput,
              styles.textArea,
              ui,
              {
                color: currentTheme.colors.text,
                flex: 1,
              },
            ]}
            value={description || ""}
            onChangeText={onDescriptionChange}
            onFocus={() => setDescriptionFocused(true)}
            onBlur={() => setDescriptionFocused(false)}
            placeholder={t(
              "planning.tasks.kanban.column.fields.descriptionPlaceholder",
              "Optional column description"
            )}
            placeholderTextColor={currentTheme.colors.textSecondary}
            multiline
            numberOfLines={3}
            maxLength={200}
            returnKeyType="done"
          />
          <UIText
            size="xs"
            weight="medium"
            color={currentTheme.colors.textSecondary}
            style={[styles.charCount, styles.textAreaCharCount]}
          >
            {(description || "").length}/200
          </UIText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  inputLabel: {
    // fontSize et fontWeight supprimés - gérés par UIText
  },
  required: {
    // fontSize et fontWeight supprimés - gérés par UIText
  },
  optional: {
    // fontSize supprimé - géré par UIText
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  textAreaContainer: {
    alignItems: "flex-start",
    minHeight: 100,
  },
  inputIcon: {
    marginTop: 2,
  },
  textAreaIcon: {
    marginTop: 8,
  },
  textInput: {
    // fontSize supprimé - géré par useCentralizedFont
    minHeight: 24,
  },
  textArea: {
    textAlignVertical: "top",
    minHeight: 60,
  },
  charCount: {
    // fontSize et fontWeight supprimés - gérés par UIText
  },
  textAreaCharCount: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
});
