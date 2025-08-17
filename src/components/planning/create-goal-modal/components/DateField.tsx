import Ionicons from "react-native-vector-icons/Ionicons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";

interface DateFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const DateField: React.FC<DateFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder = "DD/MM/YYYY",
  required = false,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Convertir la string en Date ou utiliser aujourd'hui par défaut
  const dateValue = value
    ? new Date(value.split("/").reverse().join("-"))
    : new Date();

  const handleDateConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    // Formater en DD/MM/YYYY
    const formatted = selectedDate.toLocaleDateString("fr-FR");
    onChangeText(formatted);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const handleOpenPicker = () => {
    setShowDatePicker(true);
  };

  return (
    <>
      <View
        style={[
          styles.fieldContainer,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <Text style={[styles.fieldLabel, { color: currentTheme.colors.text }]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>

        <TouchableOpacity
          style={[
            styles.dateButton,
            {
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
            },
          ]}
          onPress={handleOpenPicker}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={currentTheme.colors.primary}
          />
          <Text
            style={[
              styles.dateText,
              {
                color: value
                  ? currentTheme.colors.text
                  : currentTheme.colors.textSecondary,
              },
            ]}
          >
            {value || placeholder}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={dateValue}
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
        locale="fr-FR"
        display={Platform.OS === "ios" ? "spinner" : "default"}
      />
    </>
  );
};

interface DateRangeFieldsProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export const DateRangeFields: React.FC<DateRangeFieldsProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.dateRangeContainer}>
      <DateField
        label={t("planning.goals.startDateLabel", "Date de début")}
        value={startDate}
        onChangeText={onStartDateChange}
        placeholder="Sélectionner une date"
        required
      />

      <DateField
        label={t("planning.goals.endDateLabel", "Date de fin")}
        value={endDate}
        onChangeText={onEndDateChange}
        placeholder="Sélectionner une date"
        required
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  required: {
    color: "#EF4444",
    fontWeight: "700",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    flex: 1,
  },
  dateRangeContainer: {
    gap: 0,
  },
});
