import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import * as React from "react";
import {
  Platform,
  StatusBar,
  View,
  Animated,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../hooks/useTranslation";

// Imports locaux
import { PrivacyContent, PrivacyFooter, PrivacyHeader } from "./components";
import { usePrivacyPolicy } from "./hooks";
import { PrivacyPolicyScreenProps } from "./types";

const { height: screenHeight } = Dimensions.get("window");

export default function PrivacyPolicyScreen({
  onAccept,
  onDecline,
  showActions = true,
}: PrivacyPolicyScreenProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasScrolledToBottom, handleScroll } = usePrivacyPolicy();

  // Animations natives
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  // Si pas de callback, on est en mode consultation depuis les paramètres
  const isConsultationMode = !onAccept && !onDecline;

  React.useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <View style={tw`flex-1`}>
        {/* Background avec gradient */}
        <LinearGradient
          colors={[
            currentTheme.colors.primary,
            currentTheme.colors.secondary || currentTheme.colors.primary,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`absolute inset-0`}
        />

        {/* Cercles décoratifs animés */}
        <Animated.View
          style={[
            tw`absolute -top-20 -right-20 w-60 h-60 rounded-full`,
            {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, -20],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            tw`absolute -bottom-20 -left-20 w-80 h-80 rounded-full`,
            {
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 20],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Overlay pour adoucir le gradient */}
        <Animated.View
          style={[
            tw`absolute inset-0`,
            {
              backgroundColor: "rgba(0,0,0,0.2)",
              opacity: fadeAnim,
            },
          ]}
        />

        <Animated.View
          style={[
            tw`flex-1 pt-8`,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <PrivacyHeader
            currentTheme={currentTheme}
            showBackButton={isConsultationMode}
            onBackPress={handleBackPress}
          />

          {/* Contenu principal avec effet glassmorphism natif */}
          <Animated.View
            style={[
              tw`flex-1 mx-4 mb-4`,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View
              style={[
                tw`flex-1 rounded-3xl overflow-hidden`,
                {
                  backgroundColor: currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(255, 255, 255, 0.9)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.15,
                  shadowRadius: 16,
                  elevation: 10,
                  borderWidth: 1,
                  borderColor: currentTheme.isDark
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(255, 255, 255, 0.3)",
                },
              ]}
            >
              {/* Effet de glassmorphism avec View natif */}
              <View
                style={[
                  tw`absolute inset-0`,
                  {
                    backgroundColor: currentTheme.isDark
                      ? "rgba(0, 0, 0, 0.3)"
                      : "rgba(255, 255, 255, 0.8)",
                  },
                ]}
              />

              <View style={tw`flex-1 relative`}>
                <PrivacyContent
                  onScroll={handleScroll}
                  hasScrolledToBottom={hasScrolledToBottom}
                  currentTheme={currentTheme}
                />

                {/* Boutons d'action - seulement si showActions est true */}
                {showActions && (onAccept || onDecline) && (
                  <PrivacyFooter
                    hasScrolledToBottom={hasScrolledToBottom}
                    onAccept={onAccept}
                    onDecline={onDecline}
                    currentTheme={currentTheme}
                    showActions={showActions}
                  />
                )}
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </>
  );
}
