import React, { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTheme } from "../contexts/ThemeContext";
import { RootStackParamList } from "../types";
import { useResponsive } from "../hooks/useResponsive";
import { ResponsiveView } from "../components/common/ResponsiveView";
import { ResponsiveText } from "../components/common/ResponsiveText";
import { ResponsiveButton } from "../components/common/ResponsiveButton";
import { ResponsiveGrid, ResponsiveColumn } from "../components/common/ResponsiveGrid";
import { dimensions } from "../utils/responsive";

type WelcomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

const WelcomeScreenResponsive = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme.isDark;
  const { 
    screenWidth, 
    screenHeight, 
    moderateScale, 
    isTablet,
    wp,
    hp 
  } = useResponsive();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation d'entrée en cascade
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de rotation douce continue
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const features = [
    {
      icon: "script-text",
      title: "Scripts Intelligents",
      description: "Créez et gérez vos scripts avec une interface intuitive",
    },
    {
      icon: "brain",
      title: "IA Intégrée",
      description: "Assistant IA pour vous aider dans vos projets",
    },
    {
      icon: "palette",
      title: "Personnalisable",
      description: "Thèmes et préférences adaptés à vos besoins",
    },
    {
      icon: "shield-check",
      title: "Sécurisé",
      description: "Vos données sont protégées et chiffrées",
    },
  ];

  const handleGetStarted = () => {
    navigation.navigate("Login");
  };

  const handleSkip = () => {
    navigation.navigate("Home");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? "#0A0A0A" : "#FFFFFF",
      }}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Gradient de fond subtil */}
      <LinearGradient
        colors={
          isDarkMode
            ? ["#0A0A0A", "#0F0F0F", "#0A0A0A"]
            : ["#FFFFFF", "#FAFAFA", "#F5F5F5"]
        }
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      {/* Forme décorative animée responsive */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -hp(20),
          right: -wp(20),
          width: wp(120),
          height: wp(120),
          borderRadius: wp(60),
          backgroundColor: currentTheme.colors.primary + "05",
          transform: [
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
          ],
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: dimensions.padding.large,
          paddingVertical: dimensions.padding.xlarge,
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Skip button */}
        <TouchableOpacity
          onPress={handleSkip}
          style={{
            alignSelf: 'flex-end',
            marginBottom: dimensions.margin.large,
          }}
          activeOpacity={0.7}
        >
          <ResponsiveText
            variant="caption"
            color={isDarkMode ? "#666" : "#999"}
          >
            Passer
          </ResponsiveText>
        </TouchableOpacity>

        {/* Logo et titre principal */}
        <Animated.View
          style={{
            alignItems: 'center',
            marginBottom: hp(5),
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View
            style={{
              width: moderateScale(96),
              height: moderateScale(96),
              borderRadius: dimensions.borderRadius.xlarge,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: dimensions.margin.large,
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F8F8F8",
              borderWidth: 1,
              borderColor: isDarkMode ? "#2A2A2A" : "#E5E5E5",
            }}
          >
            <MaterialCommunityIcons
              name="script-text-outline"
              size={moderateScale(48)}
              color={currentTheme.colors.primary}
            />
          </View>

          <ResponsiveText
            variant="h1"
            align="center"
            weight="light"
            style={{
              marginBottom: dimensions.margin.medium,
              letterSpacing: 2,
            }}
          >
            ScriptFlow
          </ResponsiveText>

          <ResponsiveText
            variant="body"
            align="center"
            color={isDarkMode ? "#888" : "#666"}
            style={{
              paddingHorizontal: dimensions.padding.medium,
              lineHeight: moderateScale(24),
            }}
          >
            Votre compagnon intelligent pour la création et la gestion de scripts
          </ResponsiveText>
        </Animated.View>

        {/* Fonctionnalités - Responsive Grid */}
        <Animated.View
          style={{
            marginBottom: hp(5),
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
        >
          <ResponsiveGrid columns={isTablet ? 2 : 1} gap={moderateScale(20)}>
            {features.map((feature, index) => (
              <Animated.View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateX: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 0],
                      }),
                    },
                  ],
                }}
              >
                <View
                  style={{
                    width: moderateScale(48),
                    height: moderateScale(48),
                    borderRadius: dimensions.borderRadius.large,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: dimensions.margin.medium,
                    backgroundColor: currentTheme.colors.primary + "15",
                  }}
                >
                  <MaterialCommunityIcons
                    name={feature.icon}
                    size={moderateScale(24)}
                    color={currentTheme.colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ResponsiveText
                    variant="h4"
                    weight="medium"
                    style={{ marginBottom: moderateScale(4) }}
                  >
                    {feature.title}
                  </ResponsiveText>
                  <ResponsiveText
                    variant="caption"
                    color={isDarkMode ? "#666" : "#999"}
                  >
                    {feature.description}
                  </ResponsiveText>
                </View>
              </Animated.View>
            ))}
          </ResponsiveGrid>
        </Animated.View>

        {/* Boutons d'action */}
        <ResponsiveColumn gap={moderateScale(12)}>
          <ResponsiveButton
            title="Commencer"
            onPress={handleGetStarted}
            variant="primary"
            size="large"
            fullWidth
            style={{
              shadowColor: currentTheme.colors.primary,
              shadowOffset: { width: 0, height: moderateScale(4) },
              shadowOpacity: 0.3,
              shadowRadius: moderateScale(8),
              elevation: 5,
            }}
          />
          
          <ResponsiveButton
            title="Se connecter"
            onPress={() => navigation.navigate("Login")}
            variant="outline"
            size="large"
            fullWidth
          />
        </ResponsiveColumn>

        {/* Footer */}
        <View style={{ marginTop: hp(5), alignItems: 'center' }}>
          <ResponsiveText
            variant="small"
            color={isDarkMode ? "#444" : "#BBB"}
            align="center"
          >
            En continuant, vous acceptez nos conditions d'utilisation
          </ResponsiveText>
        </View>
      </ScrollView>
    </View>
  );
};

export default WelcomeScreenResponsive;