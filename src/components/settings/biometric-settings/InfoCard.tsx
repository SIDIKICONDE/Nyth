import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { UIText } from "../../ui/Typography";

interface InfoCardProps {
  type: "warning" | "info" | "security";
  title?: string;
  message: string;
  description?: string;
  delay?: number;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  type,
  title,
  message,
  description,
  delay = 0,
}) => {
  const { currentTheme } = useTheme();

  const getConfig = () => {
    switch (type) {
      case "warning":
        return {
          colors: ["#f59e0b20", "#f59e0b10"] as [string, string],
          iconColor: "#f59e0b",
          icon: "information",
        };
      case "security":
        return {
          colors: [
            `${currentTheme.colors.primary}10`,
            `${currentTheme.colors.primary}05`,
          ] as [string, string],
          iconColor: currentTheme.colors.primary,
          icon: "shield-check",
        };
      default:
        return {
          colors: [
            `${currentTheme.colors.primary}10`,
            `${currentTheme.colors.primary}05`,
          ] as [string, string],
          iconColor: currentTheme.colors.primary,
          icon: "information",
        };
    }
  };

  const config = getConfig();
  const isGradient = type === "warning";

  const content = (
    <View style={tw`p-4 rounded-2xl flex-row`}>
      <MaterialCommunityIcons
        name={config.icon as any}
        size={20}
        color={config.iconColor}
        style={tw`mt-0.5`}
      />
      <View style={tw`ml-3 flex-1`}>
        {title && (
          <UIText
            size="sm"
            weight="medium"
            style={[tw`mb-1`, { color: currentTheme.colors.text }]}
          >
            {title}
          </UIText>
        )}
        <UIText
          size="xs"
          style={[tw`leading-5`, { color: currentTheme.colors.text }]}
        >
          {message}
        </UIText>
        {description && (
          <UIText
            size="xs"
            style={[tw`mt-1`, { color: currentTheme.colors.textSecondary }]}
          >
            {description}
          </UIText>
        )}
      </View>
    </View>
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={tw`mt-4`}
    >
      {isGradient ? (
        <LinearGradient colors={config.colors} style={tw`rounded-2xl`}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[tw`rounded-2xl`, { backgroundColor: config.colors[0] }]}>
          {content}
        </View>
      )}
    </Animated.View>
  );
};
