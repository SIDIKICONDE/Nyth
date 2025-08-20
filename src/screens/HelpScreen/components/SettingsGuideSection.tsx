import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import React, { useState } from "react";
import { ScrollView, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";
import {
  CategoryId,
  CategorySelector,
  SettingDetailView,
  SettingItem,
  SettingsList,
  getCategories,
  getSettingsData,
} from "./settings-guide";

export const SettingsGuideSection: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<CategoryId>("display");
  const [selectedSetting, setSelectedSetting] = useState<SettingItem | null>(
    null
  );

  const categories = getCategories(t);
  const settingsData = getSettingsData(t);

  const filteredSettings = settingsData.filter(
    (item) => item.category === activeCategory
  );

  if (selectedSetting) {
    return (
      <SettingDetailView
        setting={selectedSetting}
        onBack={() => setSelectedSetting(null)}
      />
    );
  }

  return (
    <ScrollView
      style={tw`flex-1`}
      contentContainerStyle={tw`pb-6`}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(600)} style={tw`p-4`}>
        <Text
          style={[
            tw`text-xl font-bold mb-2`,
            { color: currentTheme.colors.text },
          ]}
        >
          ⚙️ Guide des Réglages
        </Text>
        <Text
          style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}
        >
          Instructions détaillées pour configurer chaque paramètre
        </Text>
      </Animated.View>

      {/* Sélecteur de catégories */}
      <CategorySelector
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Liste des réglages */}
      <SettingsList
        settings={filteredSettings}
        onSettingPress={setSelectedSetting}
      />
    </ScrollView>
  );
};
