import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { TimeRange, TIME_RANGES } from "../types";
import { ExportButton } from "../../ExportButton";

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  exportData: unknown[];
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  exportData,
}) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={[styles.rangeSelector, { backgroundColor: colors.surface }]}>
        {TIME_RANGES.map((range) => (
          <TouchableOpacity
            key={range.value}
            style={[
              styles.rangeButton,
              selectedRange.value === range.value && {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => onRangeChange(range)}
          >
            <Text
              style={[
                styles.rangeText,
                {
                  color:
                    selectedRange.value === range.value
                      ? colors.background
                      : colors.textSecondary,
                  fontWeight:
                    selectedRange.value === range.value ? "600" : "400",
                },
              ]}
            >
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ExportButton
        data={exportData}
        filename="analytics_report"
        headers={[
          { key: "type", label: "Type" },
          { key: "date", label: "Date" },
          { key: "valeur", label: "Valeur" },
          { key: "periode", label: "Période" },
        ]}
        compact
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  rangeSelector: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 2,
    gap: 2,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0.5 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  rangeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rangeText: {
    fontSize: 12,
  },
});
