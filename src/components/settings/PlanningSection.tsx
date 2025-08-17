import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";
import { RootStackParamList } from "../../types";
import Card from "./Card";
import SectionHeader from "./SectionHeader";
import SettingRow from "./SettingRow";

type PlanningNavigationProp = StackNavigationProp<RootStackParamList>;

export const PlanningSection: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<PlanningNavigationProp>();

  const handlePlanningPress = () => {
    navigation.navigate("Planning");
  };

  return (
    <View>
      <SectionHeader title={t("planning.title")} />
      <Card>
        <SettingRow
          icon="calendar-outline"
          iconColor="#3B82F6"
          iconBgColor={`${currentTheme.colors.primary}20`}
          title={t("planning.settings.openPlanning")}
          subtitle={t("planning.settings.managePlanning")}
          onPress={handlePlanningPress}
          isLast={true}
        />
      </Card>
    </View>
  );
};
