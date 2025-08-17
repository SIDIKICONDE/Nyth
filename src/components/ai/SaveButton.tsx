import * as React from "react";
import { Pressable, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  interpolateColor,
  Easing,
  FadeInRight,
  SlideInRight,
} from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";

import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { useTranslation } from "../../hooks/useTranslation";
import { UIText } from "../ui/Typography";

interface SaveButtonProps {
  onPress: () => Promise<void> | void;
  isSaving: boolean;
}

const SaveButton: React.FC<SaveButtonProps> = ({ onPress, isSaving }) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  // Animations Reanimated
  const scale = useSharedValue(1);
  const progress = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const buttonWidth = useSharedValue(120);

  React.useEffect(() => {
    if (isSaving) {
      // Animation de sauvegarde
      scale.value = withSequence(
        withTiming(0.95, { duration: 150 }),
        withSpring(1.05, { damping: 12 }),
        withSpring(1, { damping: 15 })
      );

      progress.value = withTiming(1, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
      iconRotation.value = withTiming(360, { duration: 1000 });
      glowOpacity.value = withSequence(
        withTiming(0.8, { duration: 300 }),
        withTiming(0.4, { duration: 700 })
      );
      buttonWidth.value = withSpring(140, { damping: 15 });
    } else {
      // Animation de fin
      progress.value = withTiming(0, { duration: 300 });
      iconRotation.value = withTiming(0, { duration: 300 });
      glowOpacity.value = withTiming(0, { duration: 200 });
      buttonWidth.value = withSpring(120, { damping: 15 });
    }
  }, [isSaving]);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [currentTheme.colors.primary, "#10b981"]
    );

    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
      width: buttonWidth.value,
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );
    runOnJS(onPress)();
  };

  return (
    <Animated.View
      entering={FadeInRight.duration(500).delay(300)}
      style={tw`relative ml-2`}
    >
      {/* Effet de glow */}
      <Animated.View
        style={[
          tw`absolute -inset-1 rounded-full`,
          { backgroundColor: `${currentTheme.colors.primary}40` },
          glowAnimatedStyle,
        ]}
      />

      {/* Bouton principal */}
      <Pressable
        onPress={handlePress}
        disabled={isSaving}
        style={({ pressed }) => [
          tw`overflow-hidden rounded-full`,
          {
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <Animated.View
          style={[
            tw`rounded-full`,
            {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 6,
            },
            buttonAnimatedStyle,
          ]}
        >
          {/* Gradient de fond */}
          <LinearGradient
            colors={
              isSaving
                ? ["#10b981", "#059669", "#047857"]
                : [
                    `${currentTheme.colors.primary}FF`,
                    `${currentTheme.colors.primary}DD`,
                  ]
            }
            style={tw`absolute inset-0 rounded-full`}
          />

          {/* Barre de progression */}
          <View
            style={tw`absolute bottom-0 left-0 h-1 bg-white bg-opacity-20 w-full rounded-full`}
          >
            <Animated.View
              style={[
                tw`h-full bg-white bg-opacity-60 rounded-full`,
                progressAnimatedStyle,
              ]}
            />
          </View>

          {/* Contenu */}
          <View style={tw`flex-row items-center justify-center px-5 py-3`}>
            {isSaving ? (
              <>
                {/* Icône de sauvegarde animée */}
                <Animated.View style={iconAnimatedStyle}>
                  <MaterialCommunityIcons
                    name="cloud-upload"
                    size={16}
                    color="#FFFFFF"
                  />
                </Animated.View>

                <Animated.View
                  entering={SlideInRight.duration(300)}
                  style={tw`ml-2`}
                >
                  <UIText
                    size="sm"
                    weight="semibold"
                    style={[ui, { color: "#FFFFFF" }]}
                    children={t("settings.actions.saving", "Enregistrement...")}
                  />
                </Animated.View>
              </>
            ) : (
              <Animated.View
                entering={SlideInRight.duration(300)}
                style={tw`flex-row items-center`}
              >
                <MaterialCommunityIcons
                  name="content-save"
                  size={16}
                  color="#FFFFFF"
                  style={tw`mr-2`}
                />
                <UIText
                  size="sm"
                  weight="semibold"
                  style={[ui, { color: "#FFFFFF" }]}
                  children={t("common.save", "Enregistrer")}
                />
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export default SaveButton;
