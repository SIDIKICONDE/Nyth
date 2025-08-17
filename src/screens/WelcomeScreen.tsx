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

type WelcomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Welcome"
>;

const { width, height } = Dimensions.get("window");

const WelcomeScreen = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme.isDark;

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
        contentContainerStyle={tw`px-8 py-12`}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Skip button */}
        <TouchableOpacity
          onPress={handleSkip}
          style={tw`self-end mb-8`}
          activeOpacity={0.7}
        >
          <Text
            style={[
              tw`text-sm`,
              { color: isDarkMode ? "#666" : "#999" },
            ]}
          >
            Passer
          </Text>
        </TouchableOpacity>

        {/* Logo et titre principal */}
        <Animated.View
          style={[
            tw`items-center mb-12`,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View
            style={[
              tw`w-24 h-24 rounded-3xl items-center justify-center mb-8`,
              {
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F8F8F8",
                borderWidth: 1,
                borderColor: isDarkMode ? "#2A2A2A" : "#E5E5E5",
              },
            ]}
          >
            <MaterialCommunityIcons
              name="script-text-outline"
              size={48}
              color={currentTheme.colors.primary}
            />
          </View>

          <Text
            style={[
              tw`text-4xl font-light mb-4 text-center`,
              {
                color: isDarkMode ? "#FFFFFF" : "#000000",
                letterSpacing: 2,
              },
            ]}
          >
            ScriptFlow
          </Text>

          <Text
            style={[
              tw`text-base text-center px-4 leading-6`,
              {
                color: isDarkMode ? "#888" : "#666",
              },
            ]}
          >
            Votre compagnon intelligent pour la création et la gestion de scripts
          </Text>
        </Animated.View>

        {/* Fonctionnalités */}
        <Animated.View
          style={[
            tw`mb-12`,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              style={[
                tw`flex-row items-start mb-6`,
                {
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
                  tw`w-12 h-12 rounded-2xl items-center justify-center mr-4`,
                  {
                    backgroundColor: currentTheme.colors.primary + "15",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={feature.icon as any}
                  size={24}
                  color={currentTheme.colors.primary}
                />
              </View>
              <View style={tw`flex-1`}>
                <Text
                  style={[
                    tw`text-base font-medium mb-1`,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  {feature.title}
                </Text>
                <Text
                  style={[
                    tw`text-sm leading-5`,
                    { color: isDarkMode ? "#666" : "#999" },
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
              tw`py-4 rounded-2xl items-center justify-center mb-4`,
              {
                backgroundColor: currentTheme.colors.primary,
              },
            ]}
          >
            <Text style={tw`text-white font-medium text-base`}>
              Commencer
            </Text>
          </TouchableOpacity>

          {/* Bouton secondaire */}
          <TouchableOpacity
            onPress={() => navigation.navigate("RegisterScreen")}
            activeOpacity={0.7}
            style={[
              tw`py-4 rounded-2xl items-center justify-center`,
              {
                backgroundColor: isDarkMode ? "#1A1A1A" : "#F8F8F8",
                borderWidth: 1,
                borderColor: isDarkMode ? "#2A2A2A" : "#E5E5E5",
              },
            ]}
          >
            <Text
              style={[
                tw`font-medium text-base`,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              Créer un compte
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer minimaliste */}
        <View style={tw`items-center mt-12 mb-4`}>
          <Text
            style={[
              tw`text-xs`,
              { color: isDarkMode ? "#444" : "#BBB" },
            ]}
          >
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default WelcomeScreen;