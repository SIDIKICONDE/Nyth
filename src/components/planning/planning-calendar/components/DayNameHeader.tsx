import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../ui/Typography";
import { DayNameHeaderProps } from "../types";

export const DayNameHeader: React.FC<DayNameHeaderProps> = ({ dayNames }) => {
  const { currentTheme } = useTheme();

  return (
    <View style={styles.daysHeader}>
      {dayNames.map((day, index) => (
        <View key={index} style={styles.dayHeaderCell}>
          <UIText
            size="xs"
            weight="medium"
            style={[
              styles.dayHeaderText,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            {day}
          </UIText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  daysHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  dayHeaderText: {
    // fontSize et fontWeight gérés par UIText
  },
});
