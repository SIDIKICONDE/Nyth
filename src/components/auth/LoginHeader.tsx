import { BlurView } from "@react-native-community/blur";
import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { Animated, Text, View, Image } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";

export default function LoginHeader() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={tw`relative`}>
      {/* Gradient Background */}
      <LinearGradient
        colors={
          currentTheme.isDark
            ? ["#1a1a2e", "#16213e", "#0f3460"]
            : [
                currentTheme.colors.primary,
                currentTheme.colors.secondary,
                currentTheme.colors.accent,
              ]
        }
        style={tw`absolute inset-0 h-80`}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Glass Effect Overlay */}
      <BlurView blurAmount={20} blurType="dark" style={tw`h-80`}>
        <View
          style={[
            tw`flex-1 items-center justify-center px-6`,
            { backgroundColor: `${currentTheme.colors.background}10` },
          ]}
        >
          {/* Logo Container */}
          <Animated.View
            style={[
              tw`mb-4`,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View
              style={[
                tw`w-24 h-24 rounded-full items-center justify-center`,
                {
                  backgroundColor: "transparent",
                  borderWidth: 2,
                  borderColor: `${currentTheme.colors.primary}30`,
                },
              ]}
            >
              <Image
                source={require("../../../assets/icon.png")}
                style={tw`w-20 h-20 rounded-2xl`}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* App Title */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text
              style={[
                tw`text-3xl font-bold mb-2`,
                { color: currentTheme.colors.background },
              ]}
            >
              Visions
            </Text>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text
              style={[
                tw`text-base text-center`,
                { color: `${currentTheme.colors.background}90` },
              ]}
            >
              {t("login.subtitle")}
            </Text>
          </Animated.View>
        </View>
      </BlurView>

      {/* Wave Shape at Bottom */}
      <View style={tw`absolute bottom-0 left-0 right-0`}>
        <View
          style={[
            tw`h-8`,
            {
              backgroundColor: currentTheme.colors.background,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
            },
          ]}
        />
      </View>
    </View>
  );
}
