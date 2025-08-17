import { CustomTheme as Theme } from "@/types/theme";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";
import { HelpItem } from "../types";
import { HelpContent } from "./HelpContent";

interface HelpItemDetailProps {
  item: HelpItem;
  onBack: () => void;
  currentTheme: Theme;
}

export const HelpItemDetail: React.FC<HelpItemDetailProps> = ({
  item,
  onBack,
  currentTheme,
}) => {
  return (
    <View style={tw`flex-1`}>
      {/* Header avec titre */}
      <View
        style={[
          tw`p-4 border-b`,
          { borderBottomColor: currentTheme.colors.border },
        ]}
      >
        <View style={tw`flex-1`}>
          <Text
            style={[tw`text-lg font-bold`, { color: currentTheme.colors.text }]}
          >
            {item.title}
          </Text>
          <Text
            style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}
          >
            {item.description}
          </Text>
        </View>
      </View>

      {/* Bouton de retour flottant */}
      <TouchableOpacity
        onPress={onBack}
        style={[
          tw`absolute top-8 left-4 z-50 w-10 h-10 rounded-full items-center justify-center`,
          {
            backgroundColor: currentTheme.colors.surface,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={currentTheme.colors.text}
        />
      </TouchableOpacity>

      {/* Contenu détaillé */}
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4`}
        showsVerticalScrollIndicator={false}
      >
        {item.content.map((contentItem, index) => (
          <Animated.View
            key={index}
            entering={FadeInDown.delay(index * 100).duration(600)}
          >
            <HelpContent content={contentItem} currentTheme={currentTheme} />
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};
