import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { HeadingText, UIText } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { CalendarHeaderProps } from "../types";
import { formatMonthYear } from "../utils";

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onNavigateMonth,
  onGoToToday,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <View
        style={[
          styles.header,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <TouchableOpacity
          onPress={() => onNavigateMonth("prev")}
          style={[
            styles.navButton,
            { backgroundColor: currentTheme.colors.primary + "20" },
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentTheme.colors.primary}
          />
        </TouchableOpacity>

        <View style={styles.monthYearContainer}>
          <HeadingText
            style={{ color: currentTheme.colors.text }}
            size="lg"
            weight="semibold"
          >
            {formatMonthYear(currentDate)}
          </HeadingText>
        </View>

        <TouchableOpacity
          onPress={() => onNavigateMonth("next")}
          style={[
            styles.navButton,
            { backgroundColor: currentTheme.colors.primary + "20" },
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={currentTheme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={onGoToToday}
        style={[
          styles.todayButton,
          { backgroundColor: currentTheme.colors.primary },
        ]}
      >
        <UIText
          style={{ color: currentTheme.colors.surface }}
          size="sm"
          weight="medium"
        >
          {t("planning.calendar.today", "Today")}
        </UIText>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  monthYearContainer: {
    flex: 1,
    alignItems: "center",
  },
  todayButton: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 8,
  },
});
