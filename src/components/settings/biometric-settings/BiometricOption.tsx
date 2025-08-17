import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Switch, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { UIText } from "../../ui/Typography";
import { BiometricOptionProps } from "./types";

export const BiometricOption: React.FC<BiometricOptionProps> = ({
  icon,
  iconColor,
  title,
  description,
  value,
  onValueChange,
  disabled = false,
  isActive = false,
}) => {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        tw`p-4 rounded-2xl`,
        { backgroundColor: `${currentTheme.colors.surface}10` },
      ]}
    >
      <View style={tw`flex-row items-center justify-between`}>
        <View style={tw`flex-row items-center flex-1 mr-2`}>
          <View
            style={[
              tw`p-2 rounded-xl`,
              {
                backgroundColor: isActive
                  ? `${iconColor}20`
                  : `${currentTheme.colors.surface}20`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={icon as any}
              size={20}
              color={isActive ? iconColor : currentTheme.colors.textSecondary}
            />
          </View>
          <View style={tw`ml-3 flex-1`}>
            <UIText
              weight="medium"
              style={[{ color: currentTheme.colors.text }]}
            >
              {title}
            </UIText>
            <UIText
              size="xs"
              style={[tw`mt-0.5`, { color: currentTheme.colors.textSecondary }]}
            >
              {description}
            </UIText>
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          thumbColor={value ? iconColor : "#f4f3f4"}
          trackColor={{
            false: `${currentTheme.colors.surface}30`,
            true: `${iconColor}40`,
          }}
          style={{ opacity: disabled ? 0.5 : 1 }}
        />
      </View>
    </View>
  );
};
