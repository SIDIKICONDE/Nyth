import DateTimePickerModal from "react-native-modal-datetime-picker";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View, Platform } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";
import { DatePickerFieldProps } from "../types";

import { createOptimizedLogger } from '../../../../utils/optimizedLogger';
const logger = createOptimizedLogger('DatePickerField');

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onDateChange,
  placeholder = "Sélectionner une date",
  error,
  minimumDate,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const handleDateConfirm = (selectedDate: Date) => {
    logger.debug("DatePicker confirmed:", selectedDate);
    setShowPicker(false);
    onDateChange(selectedDate);
  };

  const handleDateCancel = () => {
    setShowPicker(false);
  };

  const handleClearDate = () => {
    onDateChange(undefined);
  };

  const handleOpenPicker = () => {
    setShowPicker(true);
  };

  const formatDate = (date: Date) => {
    logger.debug("Formatting date:", date);
    // Format plus compact : 15/03/2024
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isOverdue = value && new Date(value) < new Date();

  return (
    <View style={styles.container}>
      <UIText
        size="sm"
        weight="semibold"
        color={currentTheme.colors.text}
        style={styles.label}
      >
        {label}
      </UIText>

      <TouchableOpacity
        style={[
          styles.dateButton,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: error ? "#EF4444" : currentTheme.colors.border,
          },
        ]}
        onPress={handleOpenPicker}
        activeOpacity={0.7}
      >
        <View style={styles.dateContent}>
          {value && (
            <UIText
              size="sm"
              weight="medium"
              color={isOverdue ? "#EF4444" : currentTheme.colors.text}
            >
              {formatDate(value)}
            </UIText>
          )}
        </View>

        <View style={styles.actions}>
          <UIText size="sm" color={currentTheme.colors.textSecondary}>
            📅
          </UIText>
          {value && (
            <TouchableOpacity
              onPress={handleClearDate}
              style={styles.clearButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <UIText
                size="sm"
                weight="bold"
                color={currentTheme.colors.textSecondary}
              >
                ✕
              </UIText>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {error && (
        <UIText size="xs" color="#EF4444" style={styles.errorText}>
          {error}
        </UIText>
      )}

      <DateTimePickerModal
        isVisible={showPicker}
        mode="date"
        date={value || new Date()}
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
        minimumDate={minimumDate}
        locale="fr-FR"
        display={Platform.OS === "ios" ? "spinner" : "default"}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    marginBottom: 4,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 32,
  },
  dateContent: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clearButton: {
    padding: 2,
  },
  errorText: {
    marginTop: 2,
  },
  // Styles pour iOS Modal
  iosModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  iosModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
  },
  iosModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  iosModalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iosDatePicker: {
    backgroundColor: "white",
  },
});
