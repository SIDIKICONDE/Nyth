import { useTheme } from "@/contexts/ThemeContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";
import { TutorialCard as TutorialCardType } from "../types";

interface TutorialCardProps {
  tutorial: TutorialCardType;
  index: number;
}

export const TutorialCard: React.FC<TutorialCardProps> = ({
  tutorial,
  index,
}) => {
  const { currentTheme } = useTheme();

  return (
    <Animated.View
      key={tutorial.id}
      entering={FadeInDown.delay(index * 100).duration(600)}
    >
      <TouchableOpacity
        onPress={tutorial.action}
        style={[
          tw`mb-4 p-4 rounded-2xl`,
          { backgroundColor: currentTheme.colors.card },
        ]}
        activeOpacity={0.8}
      >
        <View style={tw`flex-row items-start`}>
          <View
            style={[
              tw`w-14 h-14 rounded-xl items-center justify-center mr-4`,
              { backgroundColor: `${tutorial.color}20` },
            ]}
          >
            <MaterialCommunityIcons
              name={tutorial.icon as any}
              size={28}
              color={tutorial.color}
            />
          </View>

          <View style={tw`flex-1`}>
            <Text
              style={[
                tw`text-lg font-bold mb-1`,
                { color: currentTheme.colors.text },
              ]}
            >
              {tutorial.title}
            </Text>
            <Text
              style={[
                tw`text-sm mb-2`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {tutorial.description}
            </Text>
            <View style={tw`flex-row items-center`}>
              <Ionicons
                name="time-outline"
                size={16}
                color={currentTheme.colors.textSecondary}
              />
              <Text
                style={[
                  tw`text-xs ml-1`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {tutorial.duration}
              </Text>
            </View>
          </View>

          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={currentTheme.colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
