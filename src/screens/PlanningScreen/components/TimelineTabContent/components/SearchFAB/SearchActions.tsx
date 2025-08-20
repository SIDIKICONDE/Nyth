import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { UIText } from "../../../../../../components/ui/Typography";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../../../hooks/useTranslation";

interface SearchActionsProps {
  onClear: () => void;
  onSearch: () => void;
}

export const SearchActions: React.FC<SearchActionsProps> = ({
  onClear,
  onSearch,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  return (
    <View style={styles.searchActions}>
      <TouchableOpacity
        style={[
          styles.actionButton,
          styles.clearButton,
          { borderColor: currentTheme.colors.border },
        ]}
        onPress={onClear}
      >
        <UIText
          size="sm"
          weight="medium"
          color={currentTheme.colors.textSecondary}
          style={[ui, styles.actionButtonText]}
        >
          {t("search.clear", "Effacer")}
        </UIText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.actionButton,
          styles.searchButton,
          { backgroundColor: currentTheme.colors.primary },
        ]}
        onPress={onSearch}
      >
        <Ionicons name="search" size={16} color="white" />
        <UIText
          size="sm"
          weight="medium"
          color="white"
          style={[ui, styles.searchButtonText]}
        >
          {t("search.search", "Rechercher")}
        </UIText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 0,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  clearButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  searchButton: {
    flexDirection: "row",
    gap: 8,
  },
  actionButtonText: {},
  searchButtonText: {},
});
