import React from "react";
import { View, Text, Animated, Platform } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { BlurView } from "@react-native-community/blur";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";

interface RegisterHeaderProps {
  title: string;
  subtitle: string;
}

export default function RegisterHeader({
  title,
  subtitle,
}: RegisterHeaderProps) {
  const { currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
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
    <View
      style={[tw`mb-6`, Platform.OS === "ios" && { marginTop: insets.top }]}
    >
      {/* Gradient Background */}
      <LinearGradient
        colors={
          currentTheme.isDark
            ? ["#1a1a2e", "#16213e", "#0f3460"]
            : [
                currentTheme.colors.secondary,
                currentTheme.colors.primary,
                currentTheme.colors.accent,
              ]
        }
        style={[
          tw`absolute inset-0 h-56 -left-4 -right-4`,
          Platform.OS === "ios" ? { top: -insets.top - 20 } : tw`-top-20`,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Glass Effect Overlay */}
      <BlurView
        blurAmount={20}
        blurType="dark"
        style={[
          tw`pb-4`,
          Platform.OS === "ios" ? { paddingTop: 24 } : tw`pt-6`,
        ]}
      >
        <View
          style={[
            tw`items-center`,
            { backgroundColor: `${currentTheme.colors.background}10` },
          ]}
        >
          {/* Icon Container */}
          <Animated.View
            style={[
              tw`mb-3`,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View
              style={[
                tw`w-16 h-16 rounded-full items-center justify-center`,
                {
                  backgroundColor: `${currentTheme.colors.background}30`,
                  borderWidth: 2,
                  borderColor: `${currentTheme.colors.primary}50`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="account-plus"
                size={32}
                color={currentTheme.colors.primary}
              />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text
              style={[
                tw`text-xl font-bold mb-1 text-center`,
                { color: currentTheme.colors.text },
              ]}
            >
              {title}
            </Text>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text
              style={[
                tw`text-sm text-center px-6`,
                { color: currentTheme.colors.text + "80" },
              ]}
            >
              {subtitle}
            </Text>
          </Animated.View>
        </View>
      </BlurView>
    </View>
  );
}
