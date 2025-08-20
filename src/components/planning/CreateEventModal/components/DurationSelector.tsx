import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";
import { DURATIONS } from "../constants";

interface DurationSelectorProps {
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
}

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  selectedDuration,
  onDurationChange,
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
      <UIText size="base" weight="semibold" color={currentTheme.colors.text}>
        {t("planning.events.durationLabel", "Duration")}
      </UIText>
      <View style={styles.durationContainer}>
        {DURATIONS.map((d) => (
          <TouchableOpacity
            key={d.value}
            style={[
              styles.durationButton,
              {
                backgroundColor:
                  selectedDuration === d.value
                    ? currentTheme.colors.primary + "20"
                    : currentTheme.colors.background,
                borderColor:
                  selectedDuration === d.value
                    ? currentTheme.colors.primary
                    : currentTheme.colors.border,
              },
            ]}
            onPress={() => onDurationChange(d.value)}
          >
            <UIText
              size="sm"
              weight="medium"
              color={
                selectedDuration === d.value
                  ? currentTheme.colors.primary
                  : currentTheme.colors.text
              }
            >
              {d.label}
            </UIText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  durationContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});
