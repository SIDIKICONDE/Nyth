import React from "react";
import { SafeAreaView, View } from "react-native";
import { UIText } from "../../../components/ui/Typography";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { styles } from "../styles";

export const TaskErrorView: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      <View style={styles.errorContainer}>
        <UIText size="lg" weight="semibold">
          {t("planning.tasks.taskNotFound", "Tâche introuvable")}
        </UIText>
      </View>
    </SafeAreaView>
  );
};
