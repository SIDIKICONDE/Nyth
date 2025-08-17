import React from "react";
import { TouchableOpacity, View } from "react-native";
import { IconButton } from "react-native-paper";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { Caption, UIText } from "../ui/Typography";

interface SettingRowProps {
  icon: string;
  iconColor: string;
  iconBgColor: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isLast?: boolean;
}

export default function SettingRow({
  icon,
  iconColor,
  iconBgColor,
  title,
  subtitle,
  onPress,
  rightElement,
  isLast = false,
}: SettingRowProps) {
  const { currentTheme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        tw`flex-row items-center py-1 px-3`,
        { backgroundColor: currentTheme.colors.surface },
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: currentTheme.colors.border,
        },
      ]}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={[
          tw`w-6 h-6 rounded-lg items-center justify-center mr-2`,
          {
            backgroundColor: iconBgColor,
            shadowColor: iconBgColor,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
            elevation: 1,
          },
        ]}
      >
        <IconButton
          icon={icon}
          size={15}
          iconColor={iconColor}
          style={tw`m-0`}
        />
      </View>

      <View style={tw`flex-1`}>
        <UIText size={12} weight="600" color={currentTheme.colors.text}>
          {title}
        </UIText>
        {subtitle && (
          <Caption
            style={[tw`mt-0.5`, { color: currentTheme.colors.textSecondary }]}
          >
            {subtitle}
          </Caption>
        )}
      </View>

      {rightElement ||
        (onPress && (
          <IconButton
            icon="chevron-right"
            size={15}
            iconColor={currentTheme.colors.primary}
            style={tw`m-0`}
          />
        ))}
    </TouchableOpacity>
  );
}
