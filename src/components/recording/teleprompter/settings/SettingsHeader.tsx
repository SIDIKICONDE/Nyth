import React from "react";
import { View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { HeadingText } from "../../../../components/ui/Typography";

export function SettingsHeader(): React.JSX.Element {
  const { currentTheme } = useTheme();
  return (
    <View style={tw`flex-row items-center justify-center mb-6`}>
      <MaterialCommunityIcons
        name="tune"
        size={28}
        color={currentTheme.colors.accent}
      />
      <HeadingText
        size="2xl"
        weight="bold"
        style={[tw`ml-3`, { color: currentTheme.colors.text }]}
      >
        Réglages
      </HeadingText>
    </View>
  );
}
