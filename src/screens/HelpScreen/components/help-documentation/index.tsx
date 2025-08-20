import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import React, { useState } from "react";
import { Text, View } from "react-native";
import tw from "twrnc";
import { CategorySelector } from "./components/CategorySelector";
import { HelpItemDetail } from "./components/HelpItemDetail";
import { HelpItemList } from "./components/HelpItemList";
import { categories } from "./constants/categories";
import { helpItems } from "./constants/helpItems";
import { HelpDocumentationSectionProps, HelpItem } from "./types";

import { createOptimizedLogger } from '../../../../utils/optimizedLogger';
const logger = createOptimizedLogger('index');

export const HelpDocumentationSection: React.FC<
  HelpDocumentationSectionProps
> = () => {
  logger.debug("🔍 HelpDocumentationSection: Composant chargé");

  const { currentTheme } = useTheme();
  const {} = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>("basics");
  const [selectedItem, setSelectedItem] = useState<HelpItem | null>(null);

  const filteredItems = helpItems.filter(
    (item) => item.category === activeCategory
  );

  logger.debug("🔍 Données complètes:", {
    totalItems: helpItems.length,
    filteredItems: filteredItems.length,
    activeCategory,
    categories: categories.length,
  });

  if (selectedItem) {
    return (
      <HelpItemDetail
        item={selectedItem}
        onBack={() => setSelectedItem(null)}
        currentTheme={currentTheme}
      />
    );
  }

  return (
    <View style={tw`flex-1`}>
      {/* Header */}
      <View style={tw`p-4 border-b border-gray-200`}>
        <Text
          style={[
            tw`text-xl font-bold mb-2`,
            { color: currentTheme.colors.text },
          ]}
        >
          📚 Centre d'Aide Complet
        </Text>
        <Text
          style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}
        >
          Guides détaillés et solutions pour maîtriser Nyth
        </Text>
      </View>

      {/* Sélecteur de catégories */}
      <CategorySelector
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        currentTheme={currentTheme}
      />

      {/* Liste des éléments d'aide */}
      <HelpItemList
        items={filteredItems}
        onItemSelect={setSelectedItem}
        currentTheme={currentTheme}
      />
    </View>
  );
};
