import { useTheme } from "@/contexts/ThemeContext";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";
import { SettingItem } from "./types";

interface SettingsListProps {
  settings: SettingItem[];
  onSettingPress: (setting: SettingItem) => void;
}

export const SettingsList: React.FC<SettingsListProps> = ({
  settings,
  onSettingPress,
}) => {
  const { currentTheme } = useTheme();

  return (
    <View style={tw`px-4`}>
      {settings.map((setting, index) => (
        <Animated.View
          key={setting.id}
          entering={FadeInDown.delay(index * 100).duration(600)}
        >
          <TouchableOpacity
            onPress={() => onSettingPress(setting)}
            style={[
              tw`mb-3 p-4 rounded-xl flex-row items-center`,
              { backgroundColor: currentTheme.colors.surface },
            ]}
            activeOpacity={0.7}
          >
            <View
              style={[
                tw`w-12 h-12 rounded-xl items-center justify-center mr-4`,
                { backgroundColor: setting.color + "20" },
              ]}
            >
              <MaterialCommunityIcons
                name={setting.icon as any}
                size={24}
                color={setting.color}
              />
            </View>
            <View style={tw`flex-1`}>
              <Text
                style={[
                  tw`text-base font-semibold mb-1`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {setting.title}
              </Text>
              <Text
                style={[
                  tw`text-sm`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {setting.description}
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
    </View>
  );
};
