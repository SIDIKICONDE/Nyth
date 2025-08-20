import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { GOAL_TYPES, PERIODS, PRIORITIES } from "../constants";
import { DateRangeFields } from "./DateField";
import { GoalTypeSelector } from "./GoalTypeSelector";
import { PeriodSelector } from "./PeriodSelector";
import { PrioritySelector } from "./PrioritySelector";
import { TargetUnitRow } from "./TargetUnitRow";
import { TextInputField } from "./TextInputField";

interface ModalContentProps {
  formData: any;
  updateFormData: (data: any) => void;
  isEditMode: boolean;
}

export const ModalContent: React.FC<ModalContentProps> = ({
  formData,
  updateFormData,
  isEditMode,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Informations de base */}
      <View
        style={[
          styles.section,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <TextInputField
          label={t("planning.goals.titleLabel", "Titre")}
          required
          value={formData.title}
          onChangeText={(text) => updateFormData({ title: text })}
          placeholder={t(
            "planning.goals.titlePlaceholder",
            "ex: Créer 5 nouveaux scripts cette semaine"
          )}
        />

        <TextInputField
          label={t("planning.goals.descriptionLabel", "Description")}
          value={formData.description}
          onChangeText={(text) => updateFormData({ description: text })}
          placeholder={t(
            "planning.goals.descriptionPlaceholder",
            "Décrivez votre objectif..."
          )}
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Détails de l'objectif */}
      <View
        style={[
          styles.section,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <GoalTypeSelector
          selectedType={formData.type}
          onTypeChange={(type) => updateFormData({ type })}
          options={GOAL_TYPES}
        />

        <TargetUnitRow
          target={formData.target}
          unit={formData.unit}
          onTargetChange={(target) => updateFormData({ target })}
          onUnitChange={(unit) => updateFormData({ unit })}
        />

        <PrioritySelector
          selectedPriority={formData.priority}
          onPriorityChange={(priority) => updateFormData({ priority })}
          options={PRIORITIES}
        />

        {/* Champ de progression actuelle en mode édition */}
        {isEditMode && (
          <TextInputField
            label={t("planning.goals.currentProgress", "Progression actuelle")}
            value={formData.current}
            onChangeText={(text) => updateFormData({ current: text })}
            placeholder="0"
            keyboardType="numeric"
          />
        )}
      </View>

      {/* Planification */}
      <View
        style={[
          styles.section,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <TextInputField
          label={t("planning.goals.categoryLabel", "Catégorie")}
          value={formData.category}
          onChangeText={(text) => updateFormData({ category: text })}
          placeholder={t(
            "planning.goals.categoryPlaceholder",
            "ex: Travail, Personnel, Créatif..."
          )}
        />

        <PeriodSelector
          selectedPeriod={formData.period}
          onPeriodChange={(period) => updateFormData({ period })}
          options={PERIODS}
        />

        <DateRangeFields
          startDate={formData.startDate}
          endDate={formData.endDate}
          onStartDateChange={(startDate) => updateFormData({ startDate })}
          onEndDateChange={(endDate) => updateFormData({ endDate })}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
