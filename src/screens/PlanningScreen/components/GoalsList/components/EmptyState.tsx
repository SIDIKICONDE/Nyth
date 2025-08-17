import React from "react";
import { StyleSheet, View } from "react-native";
import { UIText } from "../../../../../components/ui/Typography";
import { useTheme } from "../../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../../hooks/useCentralizedFont";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { EmptyStateProps } from "../types";

export const EmptyState: React.FC<EmptyStateProps> = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  return (
    <View style={styles.container}>
      <UIText
        size="2xl"
        style={[ui, styles.icon, { color: currentTheme.colors.textSecondary }]}
      >
        🎯
      </UIText>
      <UIText
        size="lg"
        weight="semibold"
        style={[ui, styles.title, { color: currentTheme.colors.text }]}
      >
        {t("planning.goals.empty.title", "Aucun objectif")}
      </UIText>
      <UIText
        size="sm"
        style={[
          ui,
          styles.subtitle,
          { color: currentTheme.colors.textSecondary },
        ]}
      >
        {t("planning.goals.empty.subtitle", "Créez votre premier objectif")}
      </UIText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
  },
});
