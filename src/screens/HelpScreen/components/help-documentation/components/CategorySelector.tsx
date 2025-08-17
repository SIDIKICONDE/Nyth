import { CustomTheme as Theme } from "@/types/theme";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import tw from "twrnc";
import { Category } from "../types";

interface CategorySelectorProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  currentTheme: Theme;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  currentTheme,
}) => {
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
            onPress={() => onCategoryChange(category.id)}
            style={[
              tw`mr-3 px-4 py-2 rounded-full flex-row items-center`,
              {
                backgroundColor:
                  activeCategory === category.id
                    ? category.color + "20"
                    : currentTheme.colors.surface,
                borderWidth: 1,
                borderColor:
                  activeCategory === category.id
                    ? category.color
                    : currentTheme.colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={category.icon as any}
              size={16}
              color={
                activeCategory === category.id
                  ? category.color
                  : currentTheme.colors.textSecondary
              }
              style={tw`mr-2`}
            />
            <Text
              style={[
                tw`text-sm font-medium`,
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
          </TouchableOpacity>
        </Animated.View>
      ))}
    </ScrollView>
  );
};
