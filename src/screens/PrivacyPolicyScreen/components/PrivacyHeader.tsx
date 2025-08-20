import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as React from "react";
import { Text, TouchableOpacity, View, Animated } from "react-native";
import tw from "twrnc";
import { useTranslation } from "../../../hooks/useTranslation";
import { PrivacyHeaderProps } from "../types";

export const PrivacyHeader = ({
  currentTheme,
  showBackButton = false,
  onBackPress,
}: PrivacyHeaderProps & { onBackPress?: () => void }) => {
  const { t } = useTranslation();

  // Animations natives
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-30)).current;
  const iconScale = React.useRef(new Animated.Value(0.8)).current;
  const iconRotation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation continue de l'icône
    const rotateAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(iconRotation, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotation, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );

    rotateAnimation.start();

    return () => {
      rotateAnimation.stop();
    };
  }, []);

  const animatedIconStyle = {
    transform: [
      { scale: iconScale },
      {
        rotate: iconRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ] as const,
  };

  return (
    <Animated.View
      style={[
        tw`px-4 py-2 flex-row items-center`,
        showBackButton && tw`justify-between`,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {showBackButton && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [-30, 0],
                  outputRange: [-20, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity
            onPress={onBackPress}
            style={[
              tw`p-1.5 rounded-full`,
              {
                backgroundColor: "rgba(255,255,255,0.2)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              },
            ]}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color="#ffffff"
            />
          </TouchableOpacity>
        </Animated.View>
      )}

      <Animated.View
        style={[
          tw`items-center`,
          showBackButton ? tw`flex-1 mr-8` : tw`flex-1`,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            tw`w-12 h-12 rounded-full items-center justify-center mb-2`,
            {
              backgroundColor: "rgba(255,255,255,0.2)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 6,
            },
            animatedIconStyle,
          ]}
        >
          <MaterialCommunityIcons
            name="shield-check"
            size={24}
            color="#ffffff"
          />
        </Animated.View>

        <Animated.Text
          style={[
            tw`text-xl font-bold text-white text-center`,
            {
              textShadowColor: "rgba(0,0,0,0.5)",
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
              opacity: fadeAnim,
            },
          ]}
        >
          {t("privacy.title", "Politique de Confidentialité")}
        </Animated.Text>

        <Animated.Text
          style={[
            tw`text-sm text-white text-center mt-0.5 opacity-90`,
            {
              textShadowColor: "rgba(0,0,0,0.5)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.9],
              }),
            },
          ]}
        >
          {t("privacy.subtitle", "Nyth")}
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};
