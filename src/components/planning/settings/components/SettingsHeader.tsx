import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { H3, UIText } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useTranslation } from "../../../../hooks/useTranslation";

interface SettingsHeaderProps {
  onClose: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  onClose,
  onSave,
  isSaving = false,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[styles.header, { backgroundColor: currentTheme.colors.surface }]}
    >
      <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={isSaving}>
        <Ionicons 
          name="close" 
          size={24} 
          color={isSaving ? currentTheme.colors.textSecondary : currentTheme.colors.text} 
        />
      </TouchableOpacity>
      <H3 style={[styles.headerTitle, { color: currentTheme.colors.text }]}>
        {t("planning.settings.title", "Paramètres de planification")}
      </H3>
      <TouchableOpacity onPress={onSave} style={styles.saveButton} disabled={isSaving}>
        {isSaving ? (
          <ActivityIndicator size="small" color={currentTheme.colors.primary} />
        ) : (
          <UIText
            size={16}
            weight="600"
            style={{ color: currentTheme.colors.primary }}
          >
            {t("common.save", "Sauvegarder")}
          </UIText>
        )}
      </TouchableOpacity>
    </View>
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
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  saveButton: {
    padding: 4,
  },
});
