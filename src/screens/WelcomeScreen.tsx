import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTheme } from "../contexts/ThemeContext";
import { RootStackParamList } from "../types";
import { responsiveFontSize, responsiveSpacing, isTablet, responsiveBreakpoints, getScreenWidth, getScreenHeight } from "../utils/responsive";

type WelcomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

const { width, height } = Dimensions.get("window");

const WelcomeScreen = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme.isDark;
  const isTabletDevice = isTablet();
  
  // Responsive values
  const titleFontSize = responsiveFontSize(36);
  const subtitleFontSize = responsiveFontSize(16);
  const baseFontSize = responsiveFontSize(16);
  const smallFontSize = responsiveFontSize(14);
  const extraSmallFontSize = responsiveFontSize(12);
  
  const logoSize = responsiveSpacing(96);
  const logoIconSize = responsiveSpacing(48);
  const featureIconSize = responsiveSpacing(48);
  const featureIconInnerSize = responsiveSpacing(24);
  
  const containerPadding = responsiveSpacing(32);
  const sectionMargin = responsiveSpacing(48);
  const itemMargin = responsiveSpacing(24);
  const buttonHeight = responsiveSpacing(56);
  
  const maxContentWidth = responsiveBreakpoints({
    lg: 600,
    xl: 800,
    default: '100%',
  });

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
      style={[
        tw`flex-1`,
        { backgroundColor: isDarkMode ? "#0A0A0A" : "#FFFFFF" },
      ]}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Gradient de fond subtil */}
      <LinearGradient
        colors={
          isDarkMode
            ? ["#0A0A0A", "#0F0F0F", "#0A0A0A"]
            : ["#FFFFFF", "#FAFAFA", "#F5F5F5"]
        }
        style={tw`absolute inset-0`}
      />

      {/* Forme décorative animée */}
      <Animated.View
        style={[
          tw`absolute -top-60 -right-60`,
          {
            width: width * 1.2,
            height: width * 1.2,
            borderRadius: width * 0.6,
            backgroundColor: currentTheme.colors.primary + "05",
            transform: [
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          },
        ]}
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={[
          tw`py-12`,
          {
            paddingHorizontal: containerPadding,
            alignItems: 'center',
          }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[tw`w-full`, { maxWidth: maxContentWidth }]}>
          {/* Skip button */}
          <TouchableOpacity
            onPress={handleSkip}
            style={[tw`self-end mb-8`, { marginBottom: itemMargin }]}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[
                { 
                  color: isDarkMode ? "#666" : "#999",
                  fontSize: smallFontSize,
                },
              ]}
            >
              Passer
            </Text>
          </TouchableOpacity>

          {/* Logo et titre principal */}
          <Animated.View
            style={[
              tw`items-center`,
              {
                marginBottom: sectionMargin,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View
              style={[
                tw`rounded-3xl items-center justify-center`,
                {
                  width: logoSize,
                  height: logoSize,
                  marginBottom: itemMargin,
                  backgroundColor: isDarkMode ? "#1A1A1A" : "#F8F8F8",
                  borderWidth: 1,
                  borderColor: isDarkMode ? "#2A2A2A" : "#E5E5E5",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="script-text-outline"
                size={logoIconSize}
                color={currentTheme.colors.primary}
              />
            </View>

            <Text
              style={[
                tw`font-light mb-4 text-center`,
                {
                  fontSize: titleFontSize,
                  color: isDarkMode ? "#FFFFFF" : "#000000",
                  letterSpacing: 2,
                  marginBottom: responsiveSpacing(16),
                },
              ]}
            >
              ScriptFlow
            </Text>

            <Text
              style={[
                tw`text-center px-4 leading-6`,
                {
                  fontSize: subtitleFontSize,
                  color: isDarkMode ? "#888" : "#666",
                  paddingHorizontal: responsiveSpacing(16),
                  lineHeight: responsiveFontSize(24),
                },
              ]}
            >
              Votre compagnon intelligent pour la création et la gestion de scripts
            </Text>
          </Animated.View>

          {/* Fonctionnalités */}
          <Animated.View
            style={[
              {
                marginBottom: sectionMargin,
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
          {features.map((feature, index) => (
              <Animated.View
                key={index}
                style={[
                  tw`flex-row items-start`,
                  {
                    marginBottom: itemMargin,
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateX: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-30, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View
                  style={[
                    tw`rounded-2xl items-center justify-center`,
                    {
                      width: featureIconSize,
                      height: featureIconSize,
                      marginRight: responsiveSpacing(16),
                      backgroundColor: currentTheme.colors.primary + "15",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={feature.icon as any}
                    size={featureIconInnerSize}
                    color={currentTheme.colors.primary}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text
                    style={[
                      tw`font-medium mb-1`,
                      { 
                        fontSize: baseFontSize,
                        color: isDarkMode ? "#FFFFFF" : "#000000",
                        marginBottom: responsiveSpacing(4),
                      },
                    ]}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    style={[
                      tw`leading-5`,
                      { 
                        fontSize: smallFontSize,
                        color: isDarkMode ? "#666" : "#999",
                        lineHeight: responsiveFontSize(20),
                      },
                    ]}
                  >
                    {feature.description}
                  </Text>
                </View>
              </Animated.View>
          ))}
          </Animated.View>

          {/* Boutons d'action */}
          <Animated.View
            style={[
              tw`w-full`,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            {/* Bouton principal */}
            <TouchableOpacity
              onPress={handleGetStarted}
              activeOpacity={0.9}
              style={[
                tw`rounded-2xl items-center justify-center mb-4`,
                {
                  height: buttonHeight,
                  backgroundColor: currentTheme.colors.primary,
                  marginBottom: responsiveSpacing(16),
                },
              ]}
            >
              <Text style={[
                tw`text-white font-medium`,
                { fontSize: baseFontSize }
              ]}>
                Commencer
              </Text>
            </TouchableOpacity>

            {/* Bouton secondaire */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Register")}
              activeOpacity={0.7}
              style={[
                tw`rounded-2xl items-center justify-center`,
                {
                  height: buttonHeight,
                  backgroundColor: isDarkMode ? "#1A1A1A" : "#F8F8F8",
                  borderWidth: 1,
                  borderColor: isDarkMode ? "#2A2A2A" : "#E5E5E5",
                },
              ]}
            >
              <Text
                style={[
                  tw`font-medium`,
                  { 
                    fontSize: baseFontSize,
                    color: isDarkMode ? "#FFFFFF" : "#000000",
                  },
                ]}
              >
                Créer un compte
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer minimaliste */}
          <View style={[
            tw`items-center mb-4`,
            { marginTop: sectionMargin }
          ]}>
            <Text
              style={[
                { 
                  fontSize: extraSmallFontSize,
                  color: isDarkMode ? "#444" : "#BBB",
                },
              ]}
            >
              Version 1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default WelcomeScreen;