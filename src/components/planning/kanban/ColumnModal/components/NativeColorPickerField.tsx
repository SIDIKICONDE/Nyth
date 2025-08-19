import React, { useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import WheelColorPicker from "react-native-wheel-color-picker";
import { UIText } from "../../../../ui/Typography";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../../hooks/useTranslation";

interface NativeColorPickerFieldProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export const NativeColorPickerField: React.FC<NativeColorPickerFieldProps> = ({
  value,
  onChange,
  label,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [draftColor, setDraftColor] = useState<string>(value || "#3B82F6");
  const [sessionKey, setSessionKey] = useState<string>("picker-session");

  const labelText = useMemo(
    () =>
      label ||
      t(
        "planning.tasks.kanban.column.colorPicker.colorLabel",
        "Choose a color"
      ),
    [label, t]
  );

  const open = () => {
    setDraftColor(value || "#3B82F6");
    setSessionKey(`picker-${Date.now()}`);
    setVisible(true);
  };
  const close = () => setVisible(false);
  const confirm = () => {
    onChange(draftColor);
    setVisible(false);
  };

  useEffect(() => {
    if (visible) {
      setDraftColor(value || "#3B82F6");
    }
  }, [value, visible]);

  return (
    <View style={styles.container}>
      <UIText
        size="sm"
        weight="medium"
        color={currentTheme.colors.textSecondary}
        style={styles.label}
      >
        {labelText}
      </UIText>

      <TouchableOpacity
        style={[styles.preview, { borderColor: currentTheme.colors.border }]}
        onPress={open}
        activeOpacity={0.8}
      >
        <View style={[styles.swatch, { backgroundColor: value }]} />
        <UIText size="sm" color={currentTheme.colors.text} style={styles.hex}>
          {value}
        </UIText>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={currentTheme.colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={close}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: currentTheme.colors.background },
          ]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={[
                styles.headerButton,
                { borderColor: currentTheme.colors.border },
              ]}
              onPress={close}
              activeOpacity={0.8}
            >
              <UIText size="sm" color={currentTheme.colors.textSecondary}>
                Annuler
              </UIText>
            </TouchableOpacity>
            <UIText
              size="base"
              weight="semibold"
              color={currentTheme.colors.text}
            >
              {t(
                "planning.tasks.kanban.column.sections.appearance",
                "Appearance"
              )}
            </UIText>
            <TouchableOpacity
              style={[
                styles.headerButtonPrimary,
                { backgroundColor: currentTheme.colors.primary },
              ]}
              onPress={confirm}
              activeOpacity={0.8}
            >
              <UIText size="sm" color="white">
                OK
              </UIText>
            </TouchableOpacity>
          </View>

          <View style={[styles.pickerArea, styles.wheel]}>
            <WheelColorPicker
              key={sessionKey}
              color={draftColor}
              onColorChange={setDraftColor}
              onColorChangeComplete={setDraftColor}
              swatchesOnly={false}
              thumbSize={28}
              sliderSize={28}
              noSnap={true}
              row={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {},
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  hex: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  headerButtonPrimary: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pickerArea: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  wheel: {
    alignSelf: "stretch",
    width: "100%",
    height: 320,
  },
});
