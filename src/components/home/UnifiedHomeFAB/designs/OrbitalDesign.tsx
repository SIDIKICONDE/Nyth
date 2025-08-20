import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, TouchableOpacity, View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import { CustomTheme } from "@/types/theme";
import { FABAction } from "../types";

interface OrbitalDesignProps {
  actions: FABAction[];
}

// Configuration simplifiée
const CONFIG = {
  MAIN_BUTTON_SIZE: 64,
  ORBITAL_BUTTON_SIZE: 50,
  ORBIT_RADIUS: 90,
  ANIMATION: {
    DURATION: 250,
    STAGGER: 40,
  },
};

// Hook pour les animations
const useOrbitalAnimations = (actions: FABAction[], isExpanded: boolean) => {
  const buttonAnimations = useRef(
    actions.map(() => new Animated.Value(0))
  ).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const orbitRotationAnim = useRef(new Animated.Value(0)).current;
  const centerMoveAnim = useRef(new Animated.Value(0)).current;
  const orbitLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Animation de pulsation continue
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Animation d'expansion/fermeture
  useEffect(() => {
    if (isExpanded) {
      // Expansion avec rotation orbitale et déplacement vers le centre
      Animated.parallel([
        Animated.stagger(CONFIG.ANIMATION.STAGGER, [
          ...buttonAnimations.map((anim) =>
            Animated.spring(anim, {
              toValue: 1,
              tension: 60,
              friction: 8,
              useNativeDriver: true,
            })
          ),
        ]),
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: CONFIG.ANIMATION.DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(centerMoveAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Rotation orbitale continue plus lente
      orbitLoopRef.current = Animated.loop(
        Animated.timing(orbitRotationAnim, {
          toValue: 1,
          duration: 30000,
          useNativeDriver: true,
        })
      );
      orbitLoopRef.current.start();
    } else {
      // Fermeture avec retour à la position initiale
      orbitLoopRef.current?.stop();
      orbitLoopRef.current = null;
      orbitRotationAnim.stopAnimation();
      orbitRotationAnim.setValue(0);

      Animated.parallel([
        ...buttonAnimations.map((anim) =>
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
        Animated.spring(centerMoveAnim, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
    return () => {
      orbitLoopRef.current?.stop();
      orbitLoopRef.current = null;
    };
  }, [isExpanded, buttonAnimations, rotationAnim, centerMoveAnim, orbitRotationAnim]);

  return {
    buttonAnimations,
    rotationAnim,
    pulseAnim,
    orbitRotationAnim,
    centerMoveAnim,
  };
};

// Composant de bouton orbital
const OrbitalButton: React.FC<{
  action: FABAction;
  index: number;
  totalButtons: number;
  animation: Animated.Value;
  orbitRotationAnim: Animated.Value;
  onPress: () => void;
  currentTheme: CustomTheme;
}> = ({
  action,
  index,
  totalButtons,
  animation,
  orbitRotationAnim,
  onPress,
  currentTheme,
}) => {
  // Calcul de l'angle de base pour chaque bouton
  const baseAngle = (index * 2 * Math.PI) / totalButtons;

  // Position orbitale fixe d'abord, puis rotation
  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(baseAngle) * CONFIG.ORBIT_RADIUS],
  });

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(baseAngle) * CONFIG.ORBIT_RADIUS],
  });

  // Rotation orbitale additionnelle
  const orbitX = orbitRotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(baseAngle + 2 * Math.PI) * 10], // Rotation plus subtile
  });

  const orbitY = orbitRotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(baseAngle + 2 * Math.PI) * 10],
  });

  // Rotation du bouton sur lui-même
  const buttonRotation = orbitRotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });

  return (
    <Animated.View
      style={[
        tw`absolute`,
        {
          transform: [
            { translateX: Animated.add(translateX, orbitX) },
            { translateY: Animated.add(translateY, orbitY) },
            { rotate: buttonRotation },
            { scale },
          ],
          opacity,
          left: -CONFIG.ORBITAL_BUTTON_SIZE / 2,
          top: -CONFIG.ORBITAL_BUTTON_SIZE / 2,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={[
          tw`rounded-full items-center justify-center`,
          {
            width: CONFIG.ORBITAL_BUTTON_SIZE,
            height: CONFIG.ORBITAL_BUTTON_SIZE,
            backgroundColor: currentTheme.colors.surface,
            borderWidth: 2,
            borderColor: action.color,
            shadowColor: action.color,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 8,
          },
        ]}
        activeOpacity={0.8}
      >
        {/* Fond coloré subtil */}
        <View
          style={[
            tw`absolute inset-0 rounded-full`,
            {
              backgroundColor: `${action.color}15`,
            },
          ]}
        />

        {/* Icône */}
        {action.iconComponent ? (
          <View style={tw`w-6 h-6 items-center justify-center`}>
            {action.iconComponent}
          </View>
        ) : (
          <MaterialCommunityIcons
            name={action.icon || "dots-horizontal"}
            size={22}
            color={action.color}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Bouton principal
const MainOrbitalButton: React.FC<{
  isExpanded: boolean;
  onPress: () => void;
  pulseAnim: Animated.Value;
  rotationAnim: Animated.Value;
  currentTheme: CustomTheme;
}> = ({ isExpanded, onPress, pulseAnim, rotationAnim, currentTheme }) => {
  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          tw`rounded-full items-center justify-center`,
          {
            width: CONFIG.MAIN_BUTTON_SIZE,
            height: CONFIG.MAIN_BUTTON_SIZE,
            backgroundColor: currentTheme.isDark
              ? "#e0e0e0"
              : currentTheme.colors.primary,
            shadowColor: currentTheme.isDark
              ? "#e0e0e0"
              : currentTheme.colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 12,
          },
        ]}
        activeOpacity={0.9}
      >
        {/* Anneaux orbitaux décoratifs */}
        <View
          style={[
            tw`absolute rounded-full border`,
            {
              width: 20,
              height: 20,
              borderColor: "rgba(255,255,255,0.3)",
              borderWidth: 1,
            },
          ]}
        />
        <View
          style={[
            tw`absolute rounded-full border`,
            {
              width: 30,
              height: 30,
              borderColor: "rgba(255,255,255,0.2)",
              borderWidth: 1,
            },
          ]}
        />

        {/* Surbrillance */}
        <View
          style={[
            tw`absolute top-1 left-1 right-1 h-4 rounded-t-full`,
            { backgroundColor: "rgba(255,255,255,0.25)" },
          ]}
        />

        {/* Icône avec rotation */}
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <MaterialCommunityIcons
            name={isExpanded ? "close" : "orbit"}
            size={26}
            color={currentTheme.isDark ? "#000000" : "#ffffff"}
          />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Cercle orbital de guidage
const OrbitGuide: React.FC<{
  animation: Animated.Value;
  orbitRotationAnim: Animated.Value;
  currentTheme: CustomTheme;
}> = ({ animation, orbitRotationAnim, currentTheme }) => {
  const rotation = orbitRotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <Animated.View
      style={[
        tw`absolute rounded-full border`,
        {
          width: CONFIG.ORBIT_RADIUS * 2,
          height: CONFIG.ORBIT_RADIUS * 2,
          left: -CONFIG.ORBIT_RADIUS,
          top: -CONFIG.ORBIT_RADIUS,
          borderColor: `${currentTheme.colors.primary}30`,
          borderWidth: 1,
          opacity,
          transform: [{ rotate: rotation }],
        },
      ]}
      pointerEvents="none"
    >
      {/* Points de guidage sur l'orbite */}
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            tw`absolute w-1 h-1 rounded-full`,
            {
              backgroundColor: `${currentTheme.colors.primary}40`,
              left:
                CONFIG.ORBIT_RADIUS +
                Math.cos((i * Math.PI) / 2) * CONFIG.ORBIT_RADIUS -
                2,
              top:
                CONFIG.ORBIT_RADIUS +
                Math.sin((i * Math.PI) / 2) * CONFIG.ORBIT_RADIUS -
                2,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
};

// Composant principal
export const OrbitalDesign: React.FC<OrbitalDesignProps> = ({ actions }) => {
  const { currentTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const { height: screenHeight } = Dimensions.get("window");

  const {
    buttonAnimations,
    rotationAnim,
    pulseAnim,
    orbitRotationAnim,
    centerMoveAnim,
  } = useOrbitalAnimations(actions, isExpanded);

  useEffect(() => {
    if (isExpanded) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => setIsRendered(false), CONFIG.ANIMATION.DURATION);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleActionPress = (action: FABAction) => {
    setIsExpanded(false);
    action.onPress();
  };

  const handleMainButtonPress = () => {
    setIsExpanded(!isExpanded);
  };

  // Calcul du déplacement vers le centre
  const centerY = centerMoveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -screenHeight * 0.1], // Monte vers le centre (15% de l'écran)
  });

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateY: centerY }],
        },
      ]}
    >
      {/* Cercle de guidage orbital */}
      {isRendered && (
        <View
          style={[
            tw`absolute`,
            {
              left: CONFIG.MAIN_BUTTON_SIZE / 2,
              top: CONFIG.MAIN_BUTTON_SIZE / 2,
            },
          ]}
        >
          <OrbitGuide
            animation={buttonAnimations[0]}
            orbitRotationAnim={orbitRotationAnim}
            currentTheme={currentTheme}
          />
        </View>
      )}

      {/* Boutons orbitaux */}
      {isRendered && (
        <View
          style={[
            tw`absolute`,
            {
              left: CONFIG.MAIN_BUTTON_SIZE / 2,
              top: CONFIG.MAIN_BUTTON_SIZE / 2,
            },
          ]}
        >
          {actions.map((action, index) => (
            <OrbitalButton
              key={action.id}
              action={action}
              index={index}
              totalButtons={actions.length}
              animation={buttonAnimations[index]}
              orbitRotationAnim={orbitRotationAnim}
              onPress={() => handleActionPress(action)}
              currentTheme={currentTheme}
            />
          ))}
        </View>
      )}

      {/* Bouton principal */}
      <MainOrbitalButton
        isExpanded={isExpanded}
        onPress={handleMainButtonPress}
        pulseAnim={pulseAnim}
        rotationAnim={rotationAnim}
        currentTheme={currentTheme}
      />
    </Animated.View>
  );
};
