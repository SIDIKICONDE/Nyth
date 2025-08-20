import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";

import { useTheme } from "../../../../contexts/ThemeContext";
import { CustomTheme } from "@/types/theme";
import { useContrastOptimization } from "../../../../hooks/useContrastOptimization";
import { FABAction } from "../types";

interface StackedCardsDesignProps {
  actions: FABAction[];
}

// Configuration simplifiée
const CONFIG = {
  BUTTON_SIZE: 70,
  CARD_SIZE: { width: 70, height: 85 },
  SPACING: {
    CARD_SPACING: 80,
    BOTTOM_OFFSET: 40,
  },
  ANIMATION: {
    DURATION: 200,
    STAGGER: 60,
  },
};

// Hook pour les animations
const useAnimations = (actions: FABAction[], isExpanded: boolean) => {
  const cardAnimations = useRef(
    actions.map(() => new Animated.Value(0))
  ).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animation de pulsation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Animation d'expansion/fermeture
  useEffect(() => {
    if (isExpanded) {
      // Expansion avec cascade
      Animated.stagger(CONFIG.ANIMATION.STAGGER, [
        ...cardAnimations.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          })
        ),
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: CONFIG.ANIMATION.DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fermeture rapide
      Animated.parallel([
        ...cardAnimations.map((anim) =>
          Animated.timing(anim, {
            toValue: 0,
            duration: CONFIG.ANIMATION.DURATION,
            useNativeDriver: true,
          })
        ),
        Animated.timing(rotationAnim, {
          toValue: 0,
          duration: CONFIG.ANIMATION.DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isExpanded]);

  return { cardAnimations, rotationAnim, pulseAnim };
};

// Composant de carte individuelle
const Card: React.FC<{
  action: FABAction;
  index: number;
  totalCards: number;
  animation: Animated.Value;
  onPress: () => void;
  currentTheme: CustomTheme;
  getOptimizedButtonColors: () => { background: string; text: string };
}> = ({
  action,
  index,
  totalCards,
  animation,
  onPress,
  currentTheme,
  getOptimizedButtonColors,
}) => {
  // Calculs de transformation
  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(index + 1) * CONFIG.SPACING.CARD_SPACING],
  });

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      0,
      Math.sin((index * Math.PI) / Math.max(totalCards - 1, 1)) * 35,
    ],
  });

  const rotate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${(index - totalCards / 2) * 6}deg`],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.8, 1],
  });

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <Animated.View
      style={[
        tw`absolute`,
        {
          transform: [{ translateY }, { translateX }, { rotate }, { scale }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={[
          tw`rounded-2xl items-center overflow-hidden`,
          {
            width: CONFIG.CARD_SIZE.width,
            height: CONFIG.CARD_SIZE.height,
            backgroundColor: currentTheme.colors.surface,
            borderWidth: 2,
            borderColor: `${action.color}40`,
            shadowColor: action.color,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          },
        ]}
        activeOpacity={0.8}
      >
        {/* Fond coloré subtil */}
        <View
          style={[
            tw`absolute inset-0`,
            {
              backgroundColor: `${action.color}10`,
            },
          ]}
        />

        {/* Container de l'icône */}
        <View style={tw`flex-1 justify-center items-center pt-1`}>
          <View
            style={[
              tw`w-8 h-8 rounded-xl items-center justify-center`,
              {
                backgroundColor: currentTheme.isDark
                  ? `${action.color}30`
                  : `${action.color}20`,
              },
            ]}
          >
            {action.iconComponent ? (
              <View style={tw`w-5 h-5 items-center justify-center`}>
                {action.iconComponent}
              </View>
            ) : (
              <MaterialCommunityIcons
                name={action.icon || "dots-horizontal"}
                size={18}
                color={
                  currentTheme.isDark
                    ? getOptimizedButtonColors().text
                    : action.color
                }
              />
            )}
          </View>
        </View>

        {/* Label */}
        <View style={tw`px-1 pb-2`}>
          <Text
            style={[
              tw`text-xs font-bold text-center`,
              {
                color: currentTheme.colors.text,
                lineHeight: 12,
              },
            ]}
            numberOfLines={2}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
          >
            {action.label}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Bouton principal
const MainButton: React.FC<{
  isExpanded: boolean;
  onPress: () => void;
  pulseAnim: Animated.Value;
  rotationAnim: Animated.Value;
  currentTheme: CustomTheme;
  getOptimizedButtonColors: () => { background: string; text: string };
}> = ({
  isExpanded,
  onPress,
  pulseAnim,
  rotationAnim,
  currentTheme,
  getOptimizedButtonColors,
}) => {
  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "135deg"],
  });

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          tw`rounded-2xl items-center justify-center overflow-hidden`,
          {
            width: CONFIG.BUTTON_SIZE,
            height: CONFIG.BUTTON_SIZE,
            backgroundColor: getOptimizedButtonColors().background,
            shadowColor: getOptimizedButtonColors().background,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 12,
          },
        ]}
        activeOpacity={0.9}
      >
        {/* Effet de profondeur avec des couches */}
        <View
          style={[
            tw`absolute w-14 h-14 rounded-xl`,
            {
              backgroundColor: `${getOptimizedButtonColors().background}80`,
              top: 2,
              left: 2,
            },
          ]}
        />
        <View
          style={[
            tw`absolute w-12 h-12 rounded-lg`,
            {
              backgroundColor: `${getOptimizedButtonColors().background}60`,
              top: 4,
              left: 4,
            },
          ]}
        />

        {/* Surbrillance */}
        <View
          style={[
            tw`absolute top-1 left-1 right-1 h-3 rounded-t-xl`,
            { backgroundColor: "rgba(255,255,255,0.25)" },
          ]}
        />

        {/* Icône avec rotation */}
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <MaterialCommunityIcons
            name={isExpanded ? "close" : "cards-outline"}
            size={26}
            color={getOptimizedButtonColors().text}
          />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Composant principal
export const StackedCardsDesign: React.FC<StackedCardsDesignProps> = ({
  actions,
}) => {
  const { currentTheme } = useTheme();
  const { getOptimizedButtonColors } = useContrastOptimization();
  const [isExpanded, setIsExpanded] = useState(false);
  const screenWidth = Dimensions.get("window").width;

  const { cardAnimations, rotationAnim, pulseAnim } = useAnimations(
    actions,
    isExpanded
  );

  const handleCardPress = (action: FABAction) => {
    setIsExpanded(false);
    action.onPress();
  };

  const handleMainButtonPress = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View>
      {/* Cartes empilées */}
      {isExpanded && (
        <View
          style={[
            tw`absolute`,
            {
              bottom: CONFIG.SPACING.BOTTOM_OFFSET + CONFIG.BUTTON_SIZE / 2,
              left: -CONFIG.BUTTON_SIZE / 2 + 15, // Décalage de 15px vers la droite
            },
          ]}
        >
          {actions.map((action, index) => (
            <Card
              key={action.id}
              action={action}
              index={index}
              totalCards={actions.length}
              animation={cardAnimations[index]}
              onPress={() => handleCardPress(action)}
              currentTheme={currentTheme}
              getOptimizedButtonColors={getOptimizedButtonColors}
            />
          ))}
        </View>
      )}

      {/* Bouton principal */}
      <MainButton
        isExpanded={isExpanded}
        onPress={handleMainButtonPress}
        pulseAnim={pulseAnim}
        rotationAnim={rotationAnim}
        currentTheme={currentTheme}
        getOptimizedButtonColors={getOptimizedButtonColors}
      />
    </View>
  );
};
