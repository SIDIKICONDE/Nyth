import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useUnifiedMemory } from "../../hooks/useUnifiedMemory";
import { useTranslation } from "../../hooks/useTranslation";
import { useContrastOptimization } from "../../hooks/useContrastOptimization";
import { RootStackParamList } from "../../types/navigation";
import { UIText } from "../ui/Typography";
import Card from "./Card";
import SectionHeader from "./SectionHeader";

type NavigationProp = StackNavigationProp<RootStackParamList>;

const AIMemorySettingsSection: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { getOptimizedButtonColors } = useContrastOptimization();
  const navigation = useNavigation<NavigationProp>();
  const {
    memories,
    refreshMemory: loadMemory,
    stats: memoryStats,
  } = useUnifiedMemory();

  useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  const handleNavigateToMemory = () => {
    navigation.navigate("AIMemory");
  };

  return (
    <View>
      <SectionHeader title={t("aiMemory.settings.sectionTitle")} />

      <Card>
        <TouchableOpacity
          onPress={handleNavigateToMemory}
          style={tw`flex-row items-center justify-between p-4`}
          activeOpacity={0.7}
        >
          <View style={tw`flex-row items-center flex-1`}>
            <View
              style={[
                tw`w-10 h-10 rounded-xl items-center justify-center mr-4`,
                {
                  backgroundColor: currentTheme.isDark
                    ? "#a78bfa" + "20"
                    : "#8B5CF6" + "20",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="brain"
                size={24}
                color={currentTheme.isDark ? "#a78bfa" : "#8B5CF6"}
              />
            </View>

            <View style={tw`flex-1`}>
              <UIText
                size="base"
                weight="semibold"
                color={currentTheme.colors.text}
                style={tw`mb-1`}
              >
                {t("aiMemory.manage")}
              </UIText>

              <UIText size="sm" color={currentTheme.colors.textSecondary}>
                {memoryStats
                  ? t("aiMemory.stats.totalEntries", {
                      count: memoryStats.totalEntries,
                    })
                  : t("aiMemory.description")}
              </UIText>
            </View>
          </View>

          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={currentTheme.colors.textSecondary}
          />
        </TouchableOpacity>
      </Card>
    </View>
  );
};

export default AIMemorySettingsSection;
