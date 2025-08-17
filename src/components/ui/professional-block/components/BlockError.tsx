import React from "react";
import { View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../Typography";

interface BlockErrorProps {
  error: string;
  padding: number;
}

export const BlockError: React.FC<BlockErrorProps> = ({ error, padding }) => {
  const { currentTheme } = useTheme();

  return (
    <View style={tw`px-${padding} pb-2`}>
      <View
        style={[
          tw`flex-row items-center p-3 rounded-lg`,
          { backgroundColor: currentTheme.colors.error + "20" },
        ]}
      >
        <MaterialCommunityIcons
          name="alert-circle"
          size={16}
          color={currentTheme.colors.error}
          style={tw`mr-2`}
        />
        <UIText size="sm" color={currentTheme.colors.error} style={tw`flex-1`}>
          {error}
        </UIText>
      </View>
    </View>
  );
};
