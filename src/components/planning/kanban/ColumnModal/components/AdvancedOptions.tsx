import React from "react";
import { StyleSheet, TextInput, View, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { UIText } from "../../../../ui/Typography";
import { AdvancedOptionsProps } from "../types";

// Icônes disponibles pour les colonnes (toutes valides dans Ionicons)
const COLUMN_ICONS = [
  "list",
  "checkmark-circle",
  "time",
  "flag",
  "star",
  "heart",
  "flame",
  "rocket",
  "bulb",
  "settings",
  "person",
  "people",
  "folder",
  "document",
  "calendar",
  "alarm",
  "notifications",
  "trending-up",
  "trophy",
  "ribbon",
];

// Styles de bordure disponibles
const BORDER_STYLES = [
  { id: "solid", name: "Solid", icon: "remove" },
  { id: "dashed", name: "Dashed", icon: "ellipsis-horizontal" },
  { id: "gradient", name: "Gradient", icon: "color-palette" },
];

export const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  maxTasks,
  onMaxTasksChange,
  icon,
  onIconChange,
  borderStyle,
  onBorderStyleChange,
  autoProgress,
  onAutoProgressChange,
  validationRules,
  onValidationRulesChange,
  validationOptions = {},
  onValidationOptionsChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  const [showIconPicker, setShowIconPicker] = React.useState(false);
  const [showBorderPicker, setShowBorderPicker] = React.useState(false);

  const safeIcon = COLUMN_ICONS.includes(icon || "") ? icon : "list";

  const toggleOption = (key: keyof NonNullable<typeof validationOptions>) => {
    const next = {
      ...validationOptions,
      [key]: !validationOptions[key],
    } as any;
    onValidationOptionsChange?.(next);
  };

  const setPriority = (p: "none" | "medium" | "high" | "urgent") => {
    const next = { ...validationOptions, minPriority: p } as any;
    onValidationOptionsChange?.(next);
  };

  return (
    <View style={styles.container}>
      {/* Limite de tâches */}
      <View style={styles.section}>
        <UIText
          size="sm"
          weight="medium"
          color={currentTheme.colors.text}
          style={styles.sectionTitle}
        >
          {t("planning.tasks.kanban.column.advanced.limits", "Limits & Rules")}
        </UIText>

        <View style={styles.inputGroup}>
          <UIText
            size="xs"
            weight="medium"
            color={currentTheme.colors.text}
            style={styles.inputLabel}
          >
            {t(
              "planning.tasks.kanban.column.advanced.maxTasksLabel",
              "Task limit (optional)"
            )}
          </UIText>
          <TextInput
            style={[
              styles.textInput,
              ui,
              {
                backgroundColor: currentTheme.colors.surface,
                color: currentTheme.colors.text,
                borderColor: currentTheme.colors.border,
              },
            ]}
            placeholder={t(
              "planning.tasks.kanban.column.advanced.maxTasksPlaceholder",
              "Maximum number of tasks"
            )}
            placeholderTextColor={currentTheme.colors.textSecondary}
            value={maxTasks?.toString() || ""}
            onChangeText={(text) => {
              const num = parseInt(text);
              onMaxTasksChange?.(isNaN(num) ? undefined : num);
            }}
            keyboardType="numeric"
          />
          <UIText
            size="xs"
            color={currentTheme.colors.textSecondary}
            style={styles.helperText}
          >
            {t(
              "planning.tasks.kanban.column.advanced.maxTasksHint",
              "Leave empty for no limit"
            )}
          </UIText>
        </View>
      </View>

      {/* Icône de la colonne */}
      <View style={styles.section}>
        <UIText
          size="sm"
          weight="medium"
          color={currentTheme.colors.text}
          style={styles.sectionTitle}
        >
          {t("planning.tasks.kanban.column.advanced.icon", "Column Icon")}
        </UIText>

        <TouchableOpacity
          style={[
            styles.iconPickerButton,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            },
          ]}
          onPress={() => setShowIconPicker(!showIconPicker)}
        >
          <View style={styles.iconPickerHeader}>
            <Ionicons
              name={safeIcon as string}
              size={20}
              color={currentTheme.colors.primary}
            />
            <UIText
              size="sm"
              color={currentTheme.colors.text}
              style={styles.iconPickerText}
            >
              {t(
                "planning.tasks.kanban.column.advanced.selectIcon",
                "Select icon"
              )}
            </UIText>
            <Ionicons
              name={showIconPicker ? "chevron-up" : "chevron-down"}
              size={16}
              color={currentTheme.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {showIconPicker && (
          <View style={styles.iconGrid}>
            {COLUMN_ICONS.map((iconName) => (
              <TouchableOpacity
                key={iconName}
                style={[
                  styles.iconOption,
                  {
                    backgroundColor:
                      safeIcon === iconName
                        ? currentTheme.colors.primary + "20"
                        : currentTheme.colors.surface,
                    borderColor:
                      safeIcon === iconName
                        ? currentTheme.colors.primary
                        : currentTheme.colors.border,
                  },
                ]}
                onPress={() => {
                  onIconChange?.(iconName);
                  setShowIconPicker(false);
                }}
              >
                <Ionicons
                  name={iconName}
                  size={18}
                  color={
                    safeIcon === iconName
                      ? currentTheme.colors.primary
                      : currentTheme.colors.textSecondary
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Style de bordure */}
      <View style={styles.section}>
        <UIText
          size="sm"
          weight="medium"
          color={currentTheme.colors.text}
          style={styles.sectionTitle}
        >
          {t(
            "planning.tasks.kanban.column.advanced.borderStyle",
            "Border Style"
          )}
        </UIText>

        <TouchableOpacity
          style={[
            styles.borderPickerButton,
            {
              backgroundColor: currentTheme.colors.surface,
              borderColor: currentTheme.colors.border,
            },
          ]}
          onPress={() => setShowBorderPicker(!showBorderPicker)}
        >
          <View style={styles.borderPickerHeader}>
            <Ionicons
              name={
                BORDER_STYLES.find((s) => s.id === borderStyle)?.icon ||
                "remove"
              }
              size={20}
              color={currentTheme.colors.primary}
            />
            <UIText
              size="sm"
              color={currentTheme.colors.text}
              style={styles.borderPickerText}
            >
              {BORDER_STYLES.find((s) => s.id === borderStyle)?.name || "Solid"}
            </UIText>
            <Ionicons
              name={showBorderPicker ? "chevron-up" : "chevron-down"}
              size={16}
              color={currentTheme.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {showBorderPicker && (
          <View style={styles.borderGrid}>
            {BORDER_STYLES.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.borderOption,
                  {
                    backgroundColor:
                      borderStyle === style.id
                        ? currentTheme.colors.primary + "20"
                        : currentTheme.colors.surface,
                    borderColor:
                      borderStyle === style.id
                        ? currentTheme.colors.primary
                        : currentTheme.colors.border,
                  },
                ]}
                onPress={() => {
                  onBorderStyleChange?.(style.id);
                  setShowBorderPicker(false);
                }}
              >
                <Ionicons
                  name={style.icon}
                  size={16}
                  color={
                    borderStyle === style.id
                      ? currentTheme.colors.primary
                      : currentTheme.colors.textSecondary
                  }
                />
                <UIText
                  size="xs"
                  color={
                    borderStyle === style.id
                      ? currentTheme.colors.primary
                      : currentTheme.colors.textSecondary
                  }
                  style={styles.borderOptionText}
                >
                  {style.name}
                </UIText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Progression automatique */}
      <View style={styles.section}>
        <UIText
          size="sm"
          weight="medium"
          color={currentTheme.colors.text}
          style={styles.sectionTitle}
        >
          {t(
            "planning.tasks.kanban.column.advanced.autoProgress",
            "Auto Progress"
          )}
        </UIText>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: autoProgress
                ? currentTheme.colors.primary + "20"
                : currentTheme.colors.surface,
              borderColor: autoProgress
                ? currentTheme.colors.primary
                : currentTheme.colors.border,
            },
          ]}
          onPress={() => onAutoProgressChange?.(!autoProgress)}
        >
          <Ionicons
            name={autoProgress ? "play-circle" : "pause-circle"}
            size={20}
            color={
              autoProgress
                ? currentTheme.colors.primary
                : currentTheme.colors.textSecondary
            }
          />
          <UIText
            size="sm"
            color={
              autoProgress
                ? currentTheme.colors.primary
                : currentTheme.colors.text
            }
            style={styles.toggleText}
          >
            {t(
              "planning.tasks.kanban.column.advanced.autoProgressLabel",
              "Auto-progress tasks"
            )}
          </UIText>
        </TouchableOpacity>

        {autoProgress && (
          <UIText
            size="xs"
            color={currentTheme.colors.textSecondary}
            style={styles.helperText}
          >
            {t(
              "planning.tasks.kanban.column.advanced.autoProgressHint",
              "Tasks will automatically move to next column when completed"
            )}
          </UIText>
        )}
      </View>

      {/* Règles structurées */}
      <View style={styles.section}>
        <UIText
          size="sm"
          weight="medium"
          color={currentTheme.colors.text}
          style={styles.sectionTitle}
        >
          {t(
            "planning.tasks.kanban.column.advanced.structuredRules",
            "Structured Rules"
          )}
        </UIText>

        {[
          {
            key: "requireAssignee",
            icon: "person",
            label: "Assignee required",
          },
          {
            key: "requireDueDate",
            icon: "calendar",
            label: "Due date required",
          },
          {
            key: "requireAttachments",
            icon: "attach",
            label: "Attachment required",
          },
          {
            key: "requireSubtasks",
            icon: "list",
            label: "At least one subtask",
          },
          {
            key: "requireDescription",
            icon: "document-text",
            label: "Description required",
          },
          { key: "requireTags", icon: "pricetags", label: "At least one tag" },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.toggleButton,
              {
                backgroundColor: (validationOptions as any)[opt.key]
                  ? currentTheme.colors.primary + "20"
                  : currentTheme.colors.surface,
                borderColor: (validationOptions as any)[opt.key]
                  ? currentTheme.colors.primary
                  : currentTheme.colors.border,
              },
            ]}
            onPress={() => toggleOption(opt.key as any)}
          >
            <Ionicons
              name={
                (validationOptions as any)[opt.key]
                  ? "checkmark-circle"
                  : (opt.icon as any)
              }
              size={18}
              color={
                (validationOptions as any)[opt.key]
                  ? currentTheme.colors.primary
                  : currentTheme.colors.textSecondary
              }
            />
            <UIText
              size="sm"
              color={
                (validationOptions as any)[opt.key]
                  ? currentTheme.colors.primary
                  : currentTheme.colors.text
              }
              style={styles.toggleText}
            >
              {t(`planning.tasks.kanban.column.advanced.${opt.key}`, opt.label)}
            </UIText>
          </TouchableOpacity>
        ))}

        {/* Priorité minimale */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(
            [
              { id: "none", label: "Any" },
              { id: "medium", label: "Medium" },
              { id: "high", label: "High" },
              { id: "urgent", label: "Urgent" },
            ] as const
          ).map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.priorityPill,
                {
                  backgroundColor:
                    validationOptions.minPriority === p.id
                      ? currentTheme.colors.primary
                      : currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                },
              ]}
              onPress={() => setPriority(p.id)}
            >
              <UIText
                size="xs"
                weight="semibold"
                color={
                  validationOptions.minPriority === p.id
                    ? "white"
                    : currentTheme.colors.text
                }
              >
                {t(
                  `planning.tasks.kanban.column.advanced.minPriority.${p.id}`,
                  p.label
                )}
              </UIText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Règles texte libre (optionnel) */}
      <View style={styles.section}>
        <UIText
          size="sm"
          weight="medium"
          color={currentTheme.colors.text}
          style={styles.sectionTitle}
        >
          {t(
            "planning.tasks.kanban.column.advanced.validation",
            "Validation Rules"
          )}
        </UIText>

        <TextInput
          style={[
            styles.textArea,
            ui,
            {
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text,
              borderColor: currentTheme.colors.border,
            },
          ]}
          placeholder={t(
            "planning.tasks.kanban.column.advanced.validationPlaceholder",
            "e.g., Must have assignee, Due date required..."
          )}
          placeholderTextColor={currentTheme.colors.textSecondary}
          value={validationRules}
          onChangeText={onValidationRulesChange}
          multiline
          numberOfLines={3}
        />
        <UIText
          size="xs"
          color={currentTheme.colors.textSecondary}
          style={styles.helperText}
        >
          {t(
            "planning.tasks.kanban.column.advanced.validationHint",
            "Optional rules that tasks must meet to enter this column"
          )}
        </UIText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },
  helperText: {
    marginTop: 4,
  },
  iconPickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  iconPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconPickerText: {
    flex: 1,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 8,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  borderPickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  borderPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  borderPickerText: {
    flex: 1,
  },
  borderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 8,
  },
  borderOption: {
    width: 60,
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    gap: 4,
  },
  borderOptionText: {
    textAlign: "center",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  toggleText: {
    flex: 1,
  },
  priorityPill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
