import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { UIText } from "../../Typography";

interface BlockContentProps {
  children: React.ReactNode;
  loading?: boolean;
  padding: number;
  contentStyle?: StyleProp<ViewStyle>;
}

export const BlockContent: React.FC<BlockContentProps> = ({
  children,
  loading = false,
  padding,
  contentStyle,
}) => {
  const { currentTheme } = useTheme();

  return (
    <View style={[tw`px-${padding} pb-${padding}`, contentStyle]}>
      {loading ? (
        <View style={tw`items-center py-8`}>
          <MaterialCommunityIcons
            name="loading"
            size={32}
            color={currentTheme.colors.primary}
          />
          <UIText
            size="sm"
            color={currentTheme.colors.textSecondary}
            style={tw`mt-2`}
          >
            Chargement...
          </UIText>
        </View>
      ) : (
        children
      )}
    </View>
  );
};
