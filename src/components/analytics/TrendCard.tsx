import React from "react";
import { View, Text } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";

interface TrendCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  icon: string;
  iconColor: string;
}

export default function TrendCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  iconColor,
}: TrendCardProps) {
  const { currentTheme } = useTheme();

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return currentTheme.colors.success;
      case "down":
        return currentTheme.colors.error;
      case "stable":
        return currentTheme.colors.textSecondary;
      default:
        return currentTheme.colors.textSecondary;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return "trending-up";
      case "down":
        return "trending-down";
      case "stable":
        return "minus";
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        tw`p-4 rounded-xl`,
        { backgroundColor: currentTheme.colors.surface },
      ]}
    >
      <View style={tw`flex-row items-start justify-between mb-3`}>
        <View
          style={[
            tw`w-10 h-10 rounded-lg items-center justify-center`,
            { backgroundColor: iconColor + "20" },
          ]}
        >
          <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
        </View>

        {trend && trendValue && (
          <View style={tw`flex-row items-center`}>
            <MaterialCommunityIcons
              name={getTrendIcon() || "minus"}
              size={16}
              color={getTrendColor()}
            />
            <Text
              style={[tw`text-xs ml-1 font-medium`, { color: getTrendColor() }]}
            >
              {trendValue}
            </Text>
          </View>
        )}
      </View>

      <Text
        style={[tw`text-xs mb-1`, { color: currentTheme.colors.textSecondary }]}
      >
        {title}
      </Text>

      <Text
        style={[tw`text-2xl font-bold`, { color: currentTheme.colors.text }]}
      >
        {value}
      </Text>

      {subtitle && (
        <Text
          style={[
            tw`text-xs mt-1`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
