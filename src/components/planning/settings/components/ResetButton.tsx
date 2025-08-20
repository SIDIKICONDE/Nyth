import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";
import { UIText } from "../../../ui/Typography";

interface ResetButtonProps {
  onReset: () => void;
}

export const ResetButton: React.FC<ResetButtonProps> = ({ onReset }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.resetButton,
          {
            backgroundColor: currentTheme.colors.error + "10",
            borderColor: currentTheme.colors.error + "30",
          },
        ]}
        onPress={onReset}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh" size={18} color={currentTheme.colors.error} />
        <UIText
          style={[styles.resetText, { color: currentTheme.colors.error }]}
          size="sm"
          weight="medium"
        >
          {t("planning.settings.reset", "Réinitialiser")}
        </UIText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  resetText: {},
});
