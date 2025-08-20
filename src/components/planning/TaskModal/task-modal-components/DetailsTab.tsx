import React from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "../../../../hooks/useTranslation";
import {
  AttachmentPicker,
  CategoryPickerContainer,
  DatePickerField,
  PriorityPickerContainer,
  SubtasksManager,
  TagInput,
  TaskFormField,
} from "../components";
import { FORM_FIELDS } from "../task-modal-constants";
import { styles } from "../task-modal-styles";
import { DetailsTabProps } from "../task-modal-types";

export const DetailsTab: React.FC<DetailsTabProps> = ({
  formState,
  updateField,
}) => {
  const { t } = useTranslation();

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets={true}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Titre */}
      <TaskFormField
        label={t("planning.tasks.taskModal.titleLabel", "Titre")}
        value={formState.title}
        onChangeText={(text) => updateField(FORM_FIELDS.TITLE, text)}
        placeholder={t(
          "planning.tasks.taskModal.titlePlaceholder",
          "Entrez le titre de la tâche"
        )}
        required
        error={formState.errors.title}
      />

      {/* Description */}
      <TaskFormField
        label={t("planning.tasks.taskModal.descriptionLabel", "Description")}
        value={formState.description}
        onChangeText={(text) => updateField(FORM_FIELDS.DESCRIPTION, text)}
        placeholder={t(
          "planning.tasks.taskModal.descriptionPlaceholder",
          "Décrivez la tâche (optionnel)"
        )}
        multiline
        error={formState.errors.description}
      />

      {/* Sous-tâches */}
      <SubtasksManager
        subtasks={formState.subtasks || []}
        onSubtasksChange={(subtasks) =>
          updateField(FORM_FIELDS.SUBTASKS, subtasks)
        }
      />

      {/* Section Priorité et Catégorie - Horizontal */}
      <View style={styles.horizontalSection}>
        <View style={styles.halfWidth}>
          <PriorityPickerContainer
            value={formState.priority}
            onValueChange={(priority) =>
              updateField(FORM_FIELDS.PRIORITY, priority)
            }
            error={formState.errors.priority}
          />
        </View>
        <View style={styles.halfWidth}>
          <CategoryPickerContainer
            value={formState.category}
            onCategoryChange={(category) =>
              updateField(FORM_FIELDS.CATEGORY, category)
            }
            error={formState.errors.category}
          />
        </View>
      </View>

      {/* Section Dates - Horizontal */}
      <View style={styles.horizontalSection}>
        <View style={styles.halfWidth}>
          <DatePickerField
            label={t(
              "planning.tasks.taskModal.startDateLabel",
              "Date de début"
            )}
            value={formState.startDate || new Date()}
            onDateChange={(date) => updateField(FORM_FIELDS.START_DATE, date)}
            error={formState.errors.startDate}
            minimumDate={new Date()}
          />
        </View>
        <View style={styles.halfWidth}>
          <DatePickerField
            label={t(
              "planning.tasks.taskModal.dueDateLabel",
              "Date d'échéance"
            )}
            value={formState.dueDate}
            onDateChange={(date) => updateField(FORM_FIELDS.DUE_DATE, date)}
            error={formState.errors.dueDate}
            minimumDate={formState.startDate || new Date()}
          />
        </View>
      </View>

      {/* Heures estimées - Pleine largeur */}
      <TaskFormField
        label={t(
          "planning.tasks.taskModal.estimatedHoursLabel",
          "Heures estimées"
        )}
        value={
          formState.estimatedHours !== undefined &&
          formState.estimatedHours !== null
            ? formState.estimatedHours.toString()
            : ""
        }
        onChangeText={(text) => {
          const cleanText = text.trim();
          if (cleanText === "") {
            updateField(FORM_FIELDS.ESTIMATED_HOURS, undefined);
            return;
          }

          const hours = parseFloat(cleanText);
          if (!isNaN(hours) && hours >= 0) {
            updateField(FORM_FIELDS.ESTIMATED_HOURS, hours);
          }
        }}
        placeholder={t(
          "planning.tasks.taskModal.estimatedHoursPlaceholder",
          "Ex: 2.5"
        )}
        error={formState.errors.estimatedHours}
      />

      {/* Étiquettes */}
      <TagInput
        value={formState.tags}
        onTagsChange={(tags) => updateField(FORM_FIELDS.TAGS, tags)}
        placeholder={t(
          "planning.tasks.taskModal.tagsPlaceholder",
          "Ajouter des étiquettes"
        )}
        error={formState.errors.tags}
        category={formState.category}
      />

      {/* Pièces jointes */}
      <AttachmentPicker
        attachments={formState.attachments || []}
        images={formState.images || []}
        onAttachmentsChange={(attachments) =>
          updateField(FORM_FIELDS.ATTACHMENTS, attachments)
        }
        onImagesChange={(images) => updateField(FORM_FIELDS.IMAGES, images)}
      />

      <View style={styles.spacer} />
    </ScrollView>
  );
};
