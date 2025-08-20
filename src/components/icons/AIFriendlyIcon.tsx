import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

interface AIFriendlyIconProps {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  animated?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const AIFriendlyIcon: React.FC<AIFriendlyIconProps> = ({
  size = 24,
  primaryColor = "#10B981", // Vert plus foncé pour meilleur contraste
  secondaryColor = "#3B82F6", // Bleu plus foncé
  animated = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation;
    let loadingLoop: Animated.CompositeAnimation;
    let blinkLoop: Animated.CompositeAnimation;

    if (animated) {
      // Animation de pulsation douce
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // Animation de chargement
      loadingLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(loadingAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(loadingAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      loadingLoop.start();

      // Animation de clignotement des yeux
      blinkLoop = Animated.loop(
        Animated.sequence([
          Animated.delay(6000), // Attendre 6 secondes entre chaque clignement
          Animated.timing(blinkAnim, {
            toValue: 0.1,
            duration: 250, // Fermer les yeux plus lentement
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 250, // Ouvrir les yeux plus lentement
            useNativeDriver: true,
          }),
        ])
      );
      blinkLoop.start();
    }

    // Cleanup function
    return () => {
      pulseLoop?.stop?.();
      loadingLoop?.stop?.();
      blinkLoop?.stop?.();

      // Reset animations to initial values
      pulseAnim.setValue(0);
      loadingAnim.setValue(0);
      blinkAnim.setValue(1);
    };
  }, [animated, pulseAnim, loadingAnim, blinkAnim]);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {/* Gradient de fond avec plus de contraste */}
        <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={secondaryColor} stopOpacity="0.5" />
        </LinearGradient>

        {/* Gradient pour le robot avec plus de contraste */}
        <LinearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F8FAFC" stopOpacity="1" />
          <Stop offset="50%" stopColor="#E2E8F0" stopOpacity="1" />
          <Stop offset="100%" stopColor="#CBD5E1" stopOpacity="1" />
        </LinearGradient>

        {/* Gradient pour la lueur */}
        <LinearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={primaryColor} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={secondaryColor} stopOpacity="0.2" />
        </LinearGradient>

        {/* Gradient pour l'ombre */}
        <LinearGradient id="shadowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0.05" />
        </LinearGradient>
      </Defs>

      {/* Ombre portée */}
      <Circle cx="52" cy="52" r="40" fill="url(#shadowGradient)" />

      {/* Lueur douce autour du robot */}
      {animated && (
        <AnimatedCircle
          cx="50"
          cy="50"
          r={pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [40, 45],
          })}
          fill="url(#glowGradient)"
          opacity={pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 0.2],
          })}
        />
      )}

      {/* Tête du robot */}
      <G>
        {/* Contour de la tête */}
        <Circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#64748B"
          strokeWidth="2"
        />

        {/* Tête principale */}
        <Circle cx="50" cy="50" r="38" fill="url(#robotGradient)" />

        {/* Antenne avec contour */}
        <Path
          d="M 50 12 L 50 18"
          stroke="#475569"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Circle
          cx="50"
          cy="9"
          r="5"
          fill="#F1F5F9"
          stroke="#475569"
          strokeWidth="2"
        />
        <Circle cx="50" cy="9" r="2" fill={primaryColor} />

        {/* Yeux avec contours */}
        {animated ? (
          <>
            <AnimatedCircle
              cx="36"
              cy="47"
              r="9"
              fill="#F8FAFC"
              stroke="#374151"
              strokeWidth="2"
              opacity={blinkAnim}
            />
            <AnimatedCircle
              cx="36"
              cy="47"
              r="6"
              fill="#1F2937"
              opacity={blinkAnim}
            />
            <AnimatedCircle
              cx="64"
              cy="47"
              r="9"
              fill="#F8FAFC"
              stroke="#374151"
              strokeWidth="2"
              opacity={blinkAnim}
            />
            <AnimatedCircle
              cx="64"
              cy="47"
              r="6"
              fill="#1F2937"
              opacity={blinkAnim}
            />
          </>
        ) : (
          <>
            <Circle
              cx="36"
              cy="47"
              r="9"
              fill="#F8FAFC"
              stroke="#374151"
              strokeWidth="2"
            />
            <Circle cx="36" cy="47" r="6" fill="#1F2937" />
            <Circle
              cx="64"
              cy="47"
              r="9"
              fill="#F8FAFC"
              stroke="#374151"
              strokeWidth="2"
            />
            <Circle cx="64" cy="47" r="6" fill="#1F2937" />
          </>
        )}

        {/* Reflets dans les yeux */}
        <Circle cx="38" cy="44" r="2" fill="#FFFFFF" />
        <Circle cx="66" cy="44" r="2" fill="#FFFFFF" />

        {/* Contour du sourire */}
        <Path
          d="M 28 58 Q 50 77 72 58"
          stroke="#374151"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Sourire doux et joyeux */}
        <Path
          d="M 30 58 Q 50 75 70 58"
          stroke="#1F2937"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Bouche ouverte pour un grand sourire avec contour */}
        <Path
          d="M 30 58 Q 50 75 70 58 L 70 58 Q 50 68 30 58 Z"
          fill="#EF4444"
          stroke="#DC2626"
          strokeWidth="1"
        />

        {/* Dents du haut avec contours */}
        <Rect
          x="38"
          y="58"
          width="6"
          height="5"
          rx="1"
          fill="#FFFFFF"
          stroke="#E5E7EB"
          strokeWidth="1"
        />
        <Rect
          x="47"
          y="58"
          width="6"
          height="5"
          rx="1"
          fill="#FFFFFF"
          stroke="#E5E7EB"
          strokeWidth="1"
        />
        <Rect
          x="56"
          y="58"
          width="6"
          height="5"
          rx="1"
          fill="#FFFFFF"
          stroke="#E5E7EB"
          strokeWidth="1"
        />

        {/* Langue avec contour */}
        <Ellipse
          cx="50"
          cy="68"
          rx="8"
          ry="4"
          fill="#F87171"
          stroke="#EF4444"
          strokeWidth="1"
        />

        {/* Petits détails tech sur les côtés */}
        <Circle
          cx="20"
          cy="50"
          r="3"
          fill={primaryColor}
          stroke="#059669"
          strokeWidth="1"
        />
        <Circle
          cx="80"
          cy="50"
          r="3"
          fill={secondaryColor}
          stroke="#2563EB"
          strokeWidth="1"
        />

        {/* Indicateurs LED */}
        <Rect x="18" y="35" width="4" height="2" rx="1" fill={primaryColor} />
        <Rect x="78" y="35" width="4" height="2" rx="1" fill={secondaryColor} />
      </G>
    </Svg>
  );
};

export default AIFriendlyIcon;
