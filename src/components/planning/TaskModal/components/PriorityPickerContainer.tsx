import React, { useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";
import { PriorityPickerProps } from "../types";

interface PriorityPickerContainerProps extends PriorityPickerProps {
  // Props supplémentaires si nécessaire
}

const PRIORITY_CONFIG = [
  {
    key: "low",
    color: "#10B981",
    label: "Faible",
  },
  {
    key: "medium",
    color: "#F59E0B",
    label: "Moyen",
  },
  {
    key: "high",
    color: "#EF4444",
    label: "Élevé",
  },
  {
    key: "urgent",
    color: "#DC2626",
    label: "Urgent",
  },
] as const;

const CARD_WIDTH = 70;
const CARD_SPACING = 8;

export const PriorityPickerContainer: React.FC<
  PriorityPickerContainerProps
> = ({ value, onValueChange, error }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const handlePrioritySelect = (priority: string) => {
    onValueChange(priority as any);
  };

  const renderPriorityCard = (
    priorityConfig: (typeof PRIORITY_CONFIG)[number],
    index: number
  ) => {
    const isSelected = priorityConfig.key === (value || "low");

    return (
      <TouchableOpacity
        key={priorityConfig.key}
        style={[
          styles.priorityCard,
          {
            backgroundColor: isSelected
              ? priorityConfig.color + "15"
              : currentTheme.colors.surface,
            borderColor: isSelected
              ? priorityConfig.color
              : currentTheme.colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => handlePrioritySelect(priorityConfig.key)}
        activeOpacity={0.7}
      >
        {/* Label */}
        <UIText
          size="sm"
          weight={isSelected ? "bold" : "medium"}
          color={
            isSelected
              ? priorityConfig.color
              : currentTheme.colors.textSecondary
          }
          style={styles.priorityLabel}
        >
          {priorityConfig.label}
        </UIText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <UIText
        size="sm"
        weight="semibold"
        color={currentTheme.colors.text}
        style={styles.header}
      >
        {t("planning.tasks.priority", "Priorité")}
      </UIText>

      {/* Compact Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {PRIORITY_CONFIG.map((priorityConfig, index) =>
          renderPriorityCard(priorityConfig, index)
        )}
      </ScrollView>

      {/* Error message */}
      {error && (
        <UIText size="xs" color="#EF4444" style={styles.errorText}>
          {error}
        </UIText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    marginBottom: 8,
  },
  scrollView: {
    marginHorizontal: -4,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  priorityCard: {
    width: CARD_WIDTH,
    height: 40,
    marginHorizontal: CARD_SPACING / 2,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityLabel: {
    textAlign: "center",
    fontSize: 12,
  },
  errorText: {
    marginTop: 4,
    textAlign: "center",
  },
});
