import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";
import {
  AdvancedOptions,
  ColumnFormFields,
  TipsSection,
  NativeColorPickerField,
} from "./components";
import { useColumnForm } from "./hooks/useColumnForm";
import { ColumnModalProps } from "./types";

export const ColumnModal: React.FC<ColumnModalProps> = ({
  visible,
  column,
  onClose,
  onSave,
  presetColors,
  suggestedColor,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { formData, isSaving, updateField, handleSave, isValid } =
    useColumnForm({
      visible,
      column,
      suggestedColor,
      onSave,
      onClose,
    });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View
          style={[
            styles.container,
            { backgroundColor: currentTheme.colors.background },
          ]}
        >
          {/* Header avec couleur */}
          <View
            style={[
              styles.headerGradient,
              {
                backgroundColor: formData.color || currentTheme.colors.primary,
              },
            ]}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>

              <View style={styles.headerCenter}>
                <UIText size="lg" weight="bold" color="white" align="center">
                  {column
                    ? t("planning.tasks.kanban.column.edit", "Edit Column")
                    : t("planning.tasks.kanban.column.create", "New Column")}
                </UIText>
                <UIText
                  size="sm"
                  color="rgba(255,255,255,0.8)"
                  align="center"
                  style={styles.headerSubtitle}
                >
                  {formData.title ||
                    t("planning.tasks.kanban.column.untitled", "Untitled")}
                </UIText>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: isValid
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255,255,255,0.3)",
                  },
                ]}
                onPress={handleSave}
                disabled={!isValid || isSaving}
                activeOpacity={0.7}
              >
                {isSaving ? (
                  <View style={styles.loadingContainer}>
                    <UIText size="sm" weight="semibold" color="white">
                      ...
                    </UIText>
                  </View>
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color="white" />
                    <UIText size="sm" weight="semibold" color="white">
                      {t("planning.tasks.kanban.column.save", "Save")}
                    </UIText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Contenu avec sections organisées */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Section Informations de base */}
            <View
              style={[
                styles.section,
                { backgroundColor: currentTheme.colors.surface },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={currentTheme.colors.primary}
                />
                <UIText
                  size="base"
                  weight="semibold"
                  color={currentTheme.colors.text}
                >
                  {t(
                    "planning.tasks.kanban.column.sections.basicInfo",
                    "Basic Information"
                  )}
                </UIText>
              </View>
              <ColumnFormFields
                title={formData.title}
                description={formData.description || ""}
                onTitleChange={(title) => updateField("title", title)}
                onDescriptionChange={(description) =>
                  updateField("description", description)
                }
              />
            </View>

            {/* Section Apparence */}
            <View
              style={[
                styles.section,
                { backgroundColor: currentTheme.colors.surface },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="color-palette"
                  size={20}
                  color={currentTheme.colors.primary}
                />
                <UIText
                  size="base"
                  weight="semibold"
                  color={currentTheme.colors.text}
                >
                  {t(
                    "planning.tasks.kanban.column.sections.appearance",
                    "Appearance"
                  )}
                </UIText>
              </View>
              <NativeColorPickerField
                value={formData.color}
                onChange={(color) => updateField("color", color)}
                label={t(
                  "planning.tasks.kanban.column.colorPicker.colorLabel",
                  "Choose a color"
                )}
              />
            </View>

            {/* Section Options avancées */}
            <View
              style={[
                styles.section,
                { backgroundColor: currentTheme.colors.surface },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="settings"
                  size={20}
                  color={currentTheme.colors.primary}
                />
                <UIText
                  size="base"
                  weight="semibold"
                  color={currentTheme.colors.text}
                >
                  {t(
                    "planning.tasks.kanban.column.sections.advanced",
                    "Advanced Options"
                  )}
                </UIText>
              </View>
              <AdvancedOptions
                maxTasks={formData.maxTasks}
                onMaxTasksChange={(maxTasks) =>
                  updateField("maxTasks", maxTasks)
                }
                icon={formData.icon || "list"}
                onIconChange={(icon) => updateField("icon", icon)}
                borderStyle={formData.borderStyle || "solid"}
                onBorderStyleChange={(borderStyle) =>
                  updateField(
                    "borderStyle",
                    borderStyle as "solid" | "dashed" | "gradient"
                  )
                }
                autoProgress={formData.autoProgress || false}
                onAutoProgressChange={(autoProgress) =>
                  updateField("autoProgress", autoProgress)
                }
                validationRules={formData.validationRules || ""}
                onValidationRulesChange={(validationRules) =>
                  updateField("validationRules", validationRules)
                }
                validationOptions={formData.validationOptions || {}}
                onValidationOptionsChange={(opts) =>
                  updateField("validationOptions", opts)
                }
              />
            </View>

            {/* Section Conseils */}
            <View
              style={[
                styles.section,
                { backgroundColor: currentTheme.colors.surface },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="bulb"
                  size={20}
                  color={currentTheme.colors.warning}
                />
                <UIText
                  size="base"
                  weight="semibold"
                  color={currentTheme.colors.text}
                >
                  {t(
                    "planning.tasks.kanban.column.sections.tips",
                    "Usage Tips"
                  )}
                </UIText>
              </View>
              <TipsSection />
            </View>

            {/* Espace supplémentaire pour le clavier */}
            <View style={styles.keyboardSpacer} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 10 : 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerSubtitle: {
    marginTop: 2,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  loadingContainer: {
    paddingHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  keyboardSpacer: {
    height: 50,
  },
});
