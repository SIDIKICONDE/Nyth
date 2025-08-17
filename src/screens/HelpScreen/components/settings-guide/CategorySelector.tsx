import { useTheme } from "@/contexts/ThemeContext";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import tw from "twrnc";
import { CategoryId, SettingCategory } from "./types";

interface CategorySelectorProps {
  categories: SettingCategory[];
  activeCategory: CategoryId;
  onCategoryChange: (categoryId: CategoryId) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  const { currentTheme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={tw`px-4 py-3`}
    >
      {categories.map((category, index) => (
        <Animated.View
          key={category.id}
          entering={FadeInRight.delay(index * 100).duration(600)}
        >
          <TouchableOpacity
            onPress={() => onCategoryChange(category.id as CategoryId)}
            style={[
              tw`mr-3 p-4 rounded-xl min-w-[140px]`,
              {
                backgroundColor:
                  activeCategory === category.id
                    ? category.color + "20"
                    : currentTheme.colors.surface,
                borderWidth: 2,
                borderColor:
                  activeCategory === category.id
                    ? category.color
                    : currentTheme.colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={category.icon as any}
              size={24}
              color={
                activeCategory === category.id
                  ? category.color
                  : currentTheme.colors.textSecondary
              }
              style={tw`mb-2`}
            />
            <Text
              style={[
                tw`text-sm font-bold mb-1`,
                {
                  color:
                    activeCategory === category.id
                      ? category.color
                      : currentTheme.colors.text,
                },
              ]}
            >
              {category.title}
            </Text>
            <Text
              style={[
                tw`text-xs leading-4`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {category.description}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </ScrollView>
  );
};
