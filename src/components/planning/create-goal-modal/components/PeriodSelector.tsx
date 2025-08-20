import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { Goal } from "../../../../types/planning";
import { PeriodOption } from "../types";

interface PeriodSelectorProps {
  selectedPeriod: Goal["period"];
  onPeriodChange: (period: Goal["period"]) => void;
  options: PeriodOption[];
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  options,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.fieldContainer,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      <Text style={[styles.fieldLabel, { color: currentTheme.colors.text }]}>
        {t("planning.goals.period", "Period")}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.optionsRow}>
          {options.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.optionButton,
                { backgroundColor: currentTheme.colors.surface },
                selectedPeriod === period.key && {
                  backgroundColor: currentTheme.colors.primary,
                },
              ]}
              onPress={() => onPeriodChange(period.key)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: currentTheme.colors.text },
                  selectedPeriod === period.key && { color: "white" },
                ]}
              >
                {t(`planning.goals.periods.${period.key}`, period.label)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 6,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  optionText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
