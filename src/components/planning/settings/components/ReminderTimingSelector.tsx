import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../ui/Typography";

interface ReminderTimingSelectorProps {
  selectedTiming: number[]; // Minutes avant l'événement
  onTimingChange: (timing: number[]) => void;
  title: string;
}

// Présets de timing en minutes
const TIMING_PRESETS = [
  { label: "5 minutes avant", value: 5 },
  { label: "15 minutes avant", value: 15 },
  { label: "30 minutes avant", value: 30 },
  { label: "1 heure avant", value: 60 },
  { label: "2 heures avant", value: 120 },
  { label: "4 heures avant", value: 240 },
  { label: "1 jour avant", value: 1440 },
  { label: "2 jours avant", value: 2880 },
  { label: "1 semaine avant", value: 10080 },
];

export const ReminderTimingSelector: React.FC<ReminderTimingSelectorProps> = ({
  selectedTiming,
  onTimingChange,
  title,
}) => {
  const { currentTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [tempSelection, setTempSelection] = useState<number[]>(selectedTiming);

  const formatSelectedTiming = () => {
    if (selectedTiming.length === 0) return "Aucun rappel";
    if (selectedTiming.length === 1) {
      const preset = TIMING_PRESETS.find((p) => p.value === selectedTiming[0]);
      return preset ? preset.label : `${selectedTiming[0]} min avant`;
    }
    return `${selectedTiming.length} rappels configurés`;
  };

  const toggleTiming = (value: number) => {
    const newSelection = tempSelection.includes(value)
      ? tempSelection.filter((t) => t !== value)
      : [...tempSelection, value].sort((a, b) => a - b);
    setTempSelection(newSelection);
  };

  const handleConfirm = () => {
    onTimingChange(tempSelection);
    setIsVisible(false);
  };

  const handleCancel = () => {
    setTempSelection(selectedTiming);
    setIsVisible(false);
  };

  const renderModal = () => (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: currentTheme.colors.surface },
          ]}
        >
          <View style={styles.modalHeader}>
            <UIText
              size="lg"
              weight="semibold"
              style={{ color: currentTheme.colors.text }}
            >
              {title}
            </UIText>
            <UIText
              size="sm"
              style={{
                color: currentTheme.colors.textSecondary,
                textAlign: "center",
                marginTop: 4,
              }}
            >
              Sélectionnez quand recevoir les rappels
            </UIText>
          </View>

          <ScrollView
            style={styles.optionsContainer}
            showsVerticalScrollIndicator={false}
          >
            {TIMING_PRESETS.map((preset) => {
              const isSelected = tempSelection.includes(preset.value);
              return (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor: isSelected
                        ? currentTheme.colors.primary + "15"
                        : "transparent",
                      borderColor: isSelected
                        ? currentTheme.colors.primary
                        : currentTheme.colors.border,
                    },
                  ]}
                  onPress={() => toggleTiming(preset.value)}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: isSelected
                            ? currentTheme.colors.primary
                            : "transparent",
                          borderColor: currentTheme.colors.border,
                        },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                    <UIText
                      size="base"
                      style={{
                        color: isSelected
                          ? currentTheme.colors.primary
                          : currentTheme.colors.text,
                      }}
                    >
                      {preset.label}
                    </UIText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.selectedSummary}>
            <UIText
              size="sm"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              {tempSelection.length === 0
                ? "Aucun rappel sélectionné"
                : `${tempSelection.length} rappel${
                    tempSelection.length > 1 ? "s" : ""
                  } sélectionné${tempSelection.length > 1 ? "s" : ""}`}
            </UIText>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: currentTheme.colors.border },
              ]}
              onPress={handleCancel}
            >
              <UIText size="base" style={{ color: currentTheme.colors.text }}>
                Annuler
              </UIText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: currentTheme.colors.primary },
              ]}
              onPress={handleConfirm}
            >
              <UIText size="base" style={{ color: "#fff" }}>
                Confirmer
              </UIText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selectorButton,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          },
        ]}
        onPress={() => setIsVisible(true)}
      >
        <View style={styles.selectorContent}>
          <UIText size="base" style={{ color: currentTheme.colors.text }}>
            {formatSelectedTiming()}
          </UIText>
          {selectedTiming.length > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: currentTheme.colors.primary },
              ]}
            >
              <UIText size="xs" style={{ color: "#fff" }}>
                {selectedTiming.length}
              </UIText>
            </View>
          )}
        </View>
        <Ionicons
          name="chevron-down"
          size={16}
          color={currentTheme.colors.textSecondary}
        />
      </TouchableOpacity>

      {renderModal()}
    </>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
  },
  selectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  optionsContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedSummary: {
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
