import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { UIText } from "../../../../../../components/ui/Typography";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../../../hooks/useTranslation";

interface SearchHeaderProps {
  onClose: () => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({ onClose }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  return (
    <View style={styles.searchHeader}>
      <UIText
        size="base"
        weight="semibold"
        style={[ui, styles.searchTitle, { color: currentTheme.colors.text }]}
      >
        🔍 {t("search.events.title", "Rechercher")}
      </UIText>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons
          name="close"
          size={24}
          color={currentTheme.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  searchTitle: {},
  closeButton: {
    padding: 4,
  },
});
