import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomTheme } from "@/types/theme";
import { useTranslation } from "../../hooks/useTranslation";
import { Achievement } from "../../types/achievements";
import { ContentText, H4, UIText } from "../ui/Typography";

interface AchievementNotificationProps {
  achievement: Achievement;
  onDismiss: () => void;
}

const { width } = Dimensions.get("window");

export default function AchievementNotification({
  achievement,
  onDismiss,
}: AchievementNotificationProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const slideAnim = useRef(new Animated.Value(-200)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const getRarityColor = (rarity: string): [string, string] => {
    switch (rarity) {
      case "common":
        return ["#718096", "#4A5568"];
      case "rare":
        return ["#3182CE", "#2C5282"];
      case "epic":
        return ["#805AD5", "#6B46C1"];
      case "legendary":
        return ["#D69E2E", "#B7791F"];
      default:
        return [currentTheme.colors.primary, currentTheme.colors.secondary];
    }
  };

  const getXPReward = (rarity: string) => {
    switch (rarity) {
      case "common":
        return 50;
      case "rare":
        return 100;
      case "epic":
        return 200;
      case "legendary":
        return 500;
      default:
        return 50;
    }
  };

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 20,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de rotation de l'icône
    const rotationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    rotationLoop.start();

    // Auto-dismiss après 5 secondes
    const timer = setTimeout(() => {
      dismissAnimation();
    }, 5000);

    return () => {
      clearTimeout(timer);
      rotationLoop.stop();
    };
  }, []);

  const dismissAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        tw`absolute top-0 left-0 right-0 z-50`,
        {
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <LinearGradient
        colors={getRarityColor(achievement.rarity)}
        style={[
          tw`mx-4 p-4 rounded-2xl`,
          {
            shadowColor: getRarityColor(achievement.rarity)[0],
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 10,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Effet de brillance en arrière-plan */}
        <View style={tw`absolute inset-0 overflow-hidden rounded-2xl`}>
          {[...Array(5)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                tw`absolute w-2 h-2 rounded-full`,
                {
                  backgroundColor: "rgba(255,255,255,0.5)",
                  left: `${20 + i * 15}%`,
                  top: `${10 + i * 10}%`,
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1, 0.3],
                  }),
                  transform: [
                    {
                      scale: scaleAnim.interpolate({
                        inputRange: [0.8, 1],
                        outputRange: [0, 1.5],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>

        <View style={tw`flex-row items-center`}>
          {/* Icône animée */}
          <Animated.View
            style={[
              tw`w-16 h-16 rounded-full items-center justify-center mr-4`,
              {
                backgroundColor: "rgba(255,255,255,0.2)",
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <MaterialCommunityIcons
              name={achievement.icon}
              size={32}
              color="white"
            />
          </Animated.View>

          {/* Contenu */}
          <View style={tw`flex-1`}>
            <UIText
              size={12}
              weight="500"
              style={[tw`opacity-90`, { color: "white" }]}
            >
              {t("achievements.unlocked", "NOUVEAU BADGE DÉBLOQUÉ!")}
            </UIText>
            <H4 style={[tw`mt-1`, { color: "white" }]}>{achievement.name}</H4>
            <ContentText
              size={14}
              style={[tw`opacity-90 mt-0.5`, { color: "white" }]}
            >
              {achievement.description}
            </ContentText>
            <View style={tw`flex-row items-center mt-2`}>
              <View
                style={[
                  tw`px-2 py-1 rounded-full flex-row items-center`,
                  { backgroundColor: "rgba(255,255,255,0.2)" },
                ]}
              >
                <MaterialCommunityIcons name="star" size={14} color="white" />
                <UIText
                  size={12}
                  weight="700"
                  style={[tw`ml-1`, { color: "white" }]}
                >
                  +{getXPReward(achievement.rarity)} XP
                </UIText>
              </View>
            </View>
          </View>

          {/* Bouton de fermeture */}
          <MaterialCommunityIcons
            name="close"
            size={24}
            color="rgba(255,255,255,0.8)"
            onPress={dismissAnimation}
            style={tw`ml-2`}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
