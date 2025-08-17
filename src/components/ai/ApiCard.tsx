import React, { useState } from "react";
import { View, TextInput, Pressable, Switch } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Animated, {
  FadeInDown,
  Layout,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  useDerivedValue,
  interpolate,
} from "react-native-reanimated";
import tw from "twrnc";

import { UIText } from "../ui/Typography";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";

interface ApiCardProps {
  title: string;
  description: string;
  apiName: string;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  placeholder: string;
  color: string;
  icon: string;
  isLoading?: boolean;
}

const ApiCard: React.FC<ApiCardProps> = ({
  title,
  description,
  apiName,
  isEnabled,
  setEnabled,
  apiKey,
  setApiKey,
  placeholder,
  color,
  icon,
  isLoading = false,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [showKey, setShowKey] = useState(false);

  const hasKey = apiKey && apiKey.trim() !== "";

  // Animation pour le collapse - collapsed par défaut si désactivé
  const isCollapsed = useSharedValue(!isEnabled ? 1 : 0);

  React.useEffect(() => {
    isCollapsed.value = withSpring(!isEnabled ? 1 : 0, {
      damping: 15,
      stiffness: 100,
    });
  }, [isEnabled]);

  const animatedContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(isCollapsed.value, [0, 1], [1, 0.6]);
    const height = interpolate(isCollapsed.value, [0, 1], [1, 0.4]);

    return {
      opacity,
      transform: [{ scaleY: height }],
    };
  });

  const animatedDescriptionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(isCollapsed.value, [0, 1], [1, 0]);
    const height = interpolate(isCollapsed.value, [0, 1], [1, 0]);

    return {
      opacity,
      maxHeight: height * 100,
      overflow: "hidden",
    };
  });

  const animatedInputStyle = useAnimatedStyle(() => {
    const opacity = interpolate(isCollapsed.value, [0, 1], [1, 0]);
    const height = interpolate(isCollapsed.value, [0, 1], [1, 0]);

    return {
      opacity,
      maxHeight: height * 200,
      overflow: "hidden",
    };
  });

  // Animation pour l'espacement entre les cartes
  const animatedContainerStyle = useAnimatedStyle(() => {
    const marginBottom = interpolate(isCollapsed.value, [0, 1], [12, 6]); // De mb-3 (12px) à mb-1.5 (6px)
    const marginHorizontal = interpolate(isCollapsed.value, [0, 1], [16, 16]); // Garde mx-4 (16px)

    return {
      marginBottom,
      marginHorizontal,
    };
  });

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(100)}
      layout={Layout.springify()}
      style={animatedContainerStyle}
    >
      <Animated.View
        style={[
          animatedContentStyle,
          tw`p-4 rounded-lg`,
          {
            backgroundColor: currentTheme.colors.surface,
            borderWidth: 1,
            borderColor: isEnabled ? color : currentTheme.colors.border,
            borderLeftWidth: 4,
            borderLeftColor: color,
          },
        ]}
      >
        {/* Header */}
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center flex-1`}>
            <View
              style={[
                tw`w-8 h-8 rounded-lg items-center justify-center mr-3`,
                { backgroundColor: `${color}15` },
              ]}
            >
              <MaterialCommunityIcons name={icon} size={18} color={color} />
            </View>
            <View style={tw`flex-1`}>
              <UIText
                size="base"
                weight="semibold"
                color={currentTheme.colors.text}
              >
                {title}
              </UIText>
              {hasKey && (
                <View style={tw`flex-row items-center mt-1`}>
                  <View
                    style={[
                      tw`w-2 h-2 rounded-full mr-2`,
                      { backgroundColor: "#10b981" },
                    ]}
                  />
                  <UIText size="xs" color="#10b981" weight="medium">
                    {t("common.configured", "Configuré")}
                  </UIText>
                </View>
              )}
            </View>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={setEnabled}
            trackColor={{
              false: currentTheme.colors.border,
              true: color,
            }}
            thumbColor={currentTheme.colors.surface}
            ios_backgroundColor={currentTheme.colors.border}
          />
        </View>

        {/* Description */}
        <Animated.View style={animatedDescriptionStyle}>
          <UIText
            size="sm"
            color={currentTheme.colors.textSecondary}
            style={tw`mb-3 leading-5`}
          >
            {description}
          </UIText>
        </Animated.View>

        {/* Input clé API - collapse quand désactivé */}
        <Animated.View style={animatedInputStyle}>
          <UIText
            size="sm"
            weight="medium"
            color={currentTheme.colors.text}
            style={tw`mb-2`}
          >
            {t("aiSettings.apiKey", "Clé API")}
          </UIText>
          <View style={tw`flex-row items-center gap-2`}>
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder={placeholder}
              placeholderTextColor={currentTheme.colors.textSecondary}
              secureTextEntry={!showKey}
              style={[
                tw`flex-1 p-3 rounded-lg text-sm`,
                {
                  backgroundColor: currentTheme.colors.background,
                  borderWidth: 1,
                  borderColor: hasKey ? color : currentTheme.colors.border,
                  color: currentTheme.colors.text,
                },
              ]}
            />
            <Pressable
              onPress={() => setShowKey(!showKey)}
              style={[
                tw`p-3 rounded-lg`,
                { backgroundColor: currentTheme.colors.background },
              ]}
            >
              <MaterialCommunityIcons
                name={showKey ? "eye-off" : "eye"}
                size={18}
                color={currentTheme.colors.textSecondary}
              />
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

export default ApiCard;
