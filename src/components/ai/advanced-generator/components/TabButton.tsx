import React from "react";
import { TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useCentralizedFont } from "../../../../hooks/useCentralizedFont";
import { UIText } from "../../../ui/Typography";

interface TabButtonProps {
  label: string;
  isActive: boolean;
  icon: string;
  onPress: () => void;
}

export const TabButton: React.FC<TabButtonProps> = ({
  label,
  isActive,
  icon,
  onPress,
}) => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        tw`flex-1 py-3 rounded-lg items-center justify-center flex-row`,
        {
          backgroundColor: isActive
            ? `${currentTheme.colors.primary}15`
            : "transparent",
          borderBottomWidth: isActive ? 2 : 0,
          borderBottomColor: currentTheme.colors.primary,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={isActive ? "#ffffff" : "#9ca3af"}
        style={tw`mb-1`}
      />
      <UIText
        size="sm"
        weight={isActive ? "semibold" : "normal"}
        style={[
          ui,
          {
            color: isActive
              ? currentTheme.colors.primary
              : currentTheme.colors.textSecondary,
          },
        ]}
      >
        {label}
      </UIText>
    </TouchableOpacity>
  );
};
