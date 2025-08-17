import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";

export default function LoadingState() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    scale.value = withRepeat(
      withTiming(1.2, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scale.value, [1, 1.2], [0.3, 0.1]);
    return {
      opacity,
      transform: [{ scale: scale.value * 1.5 }],
    };
  });

  return (
    <View
      style={[
        tw`flex-1 justify-center items-center`,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      <View style={tw`relative items-center`}>
        {/* Cercle de pulse en arrière-plan */}
        <Animated.View
          style={[
            tw`absolute w-24 h-24 rounded-full`,
            {
              backgroundColor: currentTheme.colors.primary,
            },
            pulseStyle,
          ]}
        />

        {/* Icône animée */}
        <Animated.View
          style={[
            tw`w-16 h-16 rounded-full items-center justify-center`,
            {
              backgroundColor: currentTheme.colors.primary,
            },
            animatedStyle,
          ]}
        >
          <MaterialCommunityIcons
            name="cog"
            size={32}
            color={currentTheme.colors.surface}
          />
        </Animated.View>
      </View>

      <Text
        style={[
          tw`text-lg font-semibold mt-6`,
          { color: currentTheme.colors.text },
        ]}
      >
        {t("settings.loading.title", "Chargement des réglages...")}
      </Text>

      <Text
        style={[
          tw`text-sm mt-2 text-center`,
          { color: currentTheme.colors.textSecondary },
        ]}
      >
        {t("settings.loading.subtitle", "Veuillez patienter")}
      </Text>
    </View>
  );
}
