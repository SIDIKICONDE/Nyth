import { CustomTheme as Theme } from "@/types/theme";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";
import { HelpItem } from "../types";

interface HelpItemListProps {
  items: HelpItem[];
  onItemSelect: (item: HelpItem) => void;
  currentTheme: Theme;
}

export const HelpItemList: React.FC<HelpItemListProps> = ({
  items,
  onItemSelect,
  currentTheme,
}) => {
  return (
    <ScrollView
      style={tw`flex-1`}
      contentContainerStyle={tw`p-4`}
      showsVerticalScrollIndicator={false}
    >
      {items.map((item, index) => (
        <Animated.View
          key={item.id}
          entering={FadeInDown.delay(index * 100).duration(600)}
        >
          <TouchableOpacity
            onPress={() => onItemSelect(item)}
            style={[
              tw`mb-3 p-4 rounded-xl flex-row items-center`,
              { backgroundColor: currentTheme.colors.surface },
            ]}
            activeOpacity={0.7}
          >
            <View
              style={[
                tw`w-12 h-12 rounded-xl items-center justify-center mr-4`,
                { backgroundColor: item.color + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={24}
                color={item.color}
              />
            </View>
            <View style={tw`flex-1`}>
              <Text
                style={[
                  tw`text-base font-semibold mb-1`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  tw`text-sm`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {item.description}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={currentTheme.colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>
      ))}
    </ScrollView>
  );
};
