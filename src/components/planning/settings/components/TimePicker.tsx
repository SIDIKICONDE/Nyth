import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../../ui/Typography";

interface TimePickerProps {
  value: string; // Format "HH:MM"
  onValueChange: (time: string) => void;
  title: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onValueChange,
  title,
}) => {
  const { currentTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  // Générer les heures (0-23)
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  // Générer les minutes (00, 15, 30, 45)
  const minutes = ["00", "15", "30", "45"];

  const [selectedHour, setSelectedHour] = useState(value.split(":")[0]);
  const [selectedMinute, setSelectedMinute] = useState(value.split(":")[1]);

  const handleConfirm = () => {
    onValueChange(`${selectedHour}:${selectedMinute}`);
    setIsVisible(false);
  };

  const renderTimeSelector = () => (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsVisible(false)}
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
          </View>

          <View style={styles.timeContainer}>
            {/* Sélecteur d'heures */}
            <View style={styles.timeColumn}>
              <UIText
                size="base"
                weight="medium"
                style={{
                  color: currentTheme.colors.text,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Heures
              </UIText>
              <FlatList
                data={hours}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                style={styles.timeList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.timeItem,
                      {
                        backgroundColor:
                          item === selectedHour
                            ? currentTheme.colors.primary + "15"
                            : "transparent",
                        borderColor:
                          item === selectedHour
                            ? currentTheme.colors.primary
                            : currentTheme.colors.border,
                      },
                    ]}
                    onPress={() => setSelectedHour(item)}
                  >
                    <UIText
                      size="base"
                      style={{
                        color:
                          item === selectedHour
                            ? currentTheme.colors.primary
                            : currentTheme.colors.text,
                      }}
                    >
                      {item}
                    </UIText>
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* Séparateur */}
            <View style={styles.separator}>
              <UIText
                size="xl"
                weight="bold"
                style={{ color: currentTheme.colors.text }}
              >
                :
              </UIText>
            </View>

            {/* Sélecteur de minutes */}
            <View style={styles.timeColumn}>
              <UIText
                size="base"
                weight="medium"
                style={{
                  color: currentTheme.colors.text,
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Minutes
              </UIText>
              <FlatList
                data={minutes}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                style={styles.timeList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.timeItem,
                      {
                        backgroundColor:
                          item === selectedMinute
                            ? currentTheme.colors.primary + "15"
                            : "transparent",
                        borderColor:
                          item === selectedMinute
                            ? currentTheme.colors.primary
                            : currentTheme.colors.border,
                      },
                    ]}
                    onPress={() => setSelectedMinute(item)}
                  >
                    <UIText
                      size="base"
                      style={{
                        color:
                          item === selectedMinute
                            ? currentTheme.colors.primary
                            : currentTheme.colors.text,
                      }}
                    >
                      {item}
                    </UIText>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: currentTheme.colors.border },
              ]}
              onPress={() => setIsVisible(false)}
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
          styles.timePickerButton,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          },
        ]}
        onPress={() => setIsVisible(true)}
      >
        <UIText size="base" style={{ color: currentTheme.colors.text }}>
          {value}
        </UIText>
        <Ionicons
          name="chevron-down"
          size={16}
          color={currentTheme.colors.textSecondary}
        />
      </TouchableOpacity>

      {renderTimeSelector()}
    </>
  );
};

const styles = StyleSheet.create({
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
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
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  timeColumn: {
    flex: 1,
    alignItems: "center",
  },
  separator: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  timeList: {
    height: 150,
  },
  timeItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
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
