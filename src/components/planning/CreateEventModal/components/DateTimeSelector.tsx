import Ionicons from "react-native-vector-icons/Ionicons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";

interface DateTimeSelectorProps {
  startDate: Date;
  startTime: Date;
  showDatePicker: boolean;
  showTimePicker: boolean;
  onDateChange: (selectedDate: Date) => void;
  onTimeChange: (selectedTime: Date) => void;
  setShowDatePicker: (show: boolean) => void;
  setShowTimePicker: (show: boolean) => void;
}

export const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  startDate,
  startTime,
  showDatePicker,
  showTimePicker,
  onDateChange,
  onTimeChange,
  setShowDatePicker,
  setShowTimePicker,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const handleDateConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    onDateChange(selectedDate);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const handleTimeConfirm = (selectedTime: Date) => {
    setShowTimePicker(false);
    onTimeChange(selectedTime);
  };

  const handleTimeCancel = () => {
    setShowTimePicker(false);
  };

  return (
    <>
      <View
        style={[
          styles.fieldContainer,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <UIText size="base" weight="semibold" color={currentTheme.colors.text}>
          {t("planning.events.dateTimeLabel", "Date and Time")}
        </UIText>
        <View style={styles.dateTimeContainer}>
          <TouchableOpacity
            style={[
              styles.dateTimeButton,
              {
                backgroundColor: currentTheme.colors.background,
                borderColor: currentTheme.colors.border,
              },
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons
              name="calendar"
              size={20}
              color={currentTheme.colors.primary}
            />
            <UIText size="sm" color={currentTheme.colors.text}>
              {startDate.toLocaleDateString()}
            </UIText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dateTimeButton,
              {
                backgroundColor: currentTheme.colors.background,
                borderColor: currentTheme.colors.border,
              },
            ]}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons
              name="time"
              size={20}
              color={currentTheme.colors.primary}
            />
            <UIText size="sm" color={currentTheme.colors.text}>
              {startTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </UIText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={startDate}
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
        minimumDate={new Date()}
        locale="fr-FR"
        display={Platform.OS === "ios" ? "spinner" : "default"}
      />

      {/* Time Picker */}
      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        date={startTime}
        onConfirm={handleTimeConfirm}
        onCancel={handleTimeCancel}
        locale="fr-FR"
        display={Platform.OS === "ios" ? "spinner" : "default"}
      />
    </>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
});
