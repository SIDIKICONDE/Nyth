import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, {
  Path,
  Circle,
  G,
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Mask,
} from "react-native-svg";

interface AINeuralIconProps {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  animated?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

const AINeuralIcon: React.FC<AINeuralIconProps> = ({
  size = 24,
  primaryColor = "#8B5CF6",
  secondaryColor = "#00D9FF",
  animated = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | undefined;
    let rotateLoop: Animated.CompositeAnimation | undefined;
    let fadeLoop: Animated.CompositeAnimation | undefined;
    if (animated) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      rotateLoop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      );
      rotateLoop.start();

      fadeLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      fadeLoop.start();
    }
    return () => {
      pulseLoop?.stop?.();
      rotateLoop?.stop?.();
      fadeLoop?.stop?.();
      pulseAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);
    };
  }, [animated, pulseAnim, rotateAnim, fadeAnim]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={
        animated
          ? {
              transform: [{ rotate: rotation }],
            }
          : {}
      }
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient
            id="neuralGradient1"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <Stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={secondaryColor} stopOpacity="1" />
          </LinearGradient>
          <LinearGradient
            id="neuralGradient2"
            x1="100%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <Stop offset="0%" stopColor={secondaryColor} stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF0080" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient
            id="pulseGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <Stop offset="100%" stopColor={primaryColor} stopOpacity="0.3" />
          </LinearGradient>
          <Mask id="hexMask">
            <Rect x="0" y="0" width="100" height="100" fill="white" />
            <Path
              d="M 50 10 L 75 25 L 75 50 L 50 65 L 25 50 L 25 25 Z"
              fill="black"
            />
          </Mask>
        </Defs>

        {/* Hexagone central */}
        <G>
          <Path
            d="M 50 15 L 70 28 L 70 47 L 50 60 L 30 47 L 30 28 Z"
            fill="none"
            stroke="url(#neuralGradient1)"
            strokeWidth="2"
            opacity="0.8"
          />

          {/* Noyau central AI avec animation */}
          {animated ? (
            <AnimatedG
              opacity={pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              })}
            >
              <AnimatedCircle
                cx="50"
                cy="38"
                r={pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 10],
                })}
                fill="url(#neuralGradient1)"
              />
              <AnimatedCircle
                cx="50"
                cy="38"
                r={pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [5, 6.5],
                })}
                fill={secondaryColor}
              />
              <AnimatedCircle
                cx="50"
                cy="38"
                r={pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [3, 4],
                })}
                fill="#FFFFFF"
              />
            </AnimatedG>
          ) : (
            <>
              <Circle
                cx="50"
                cy="38"
                r="8"
                fill="url(#neuralGradient1)"
                opacity="0.9"
              />
              <Circle cx="50" cy="38" r="5" fill={secondaryColor} opacity="1" />
              <Circle cx="50" cy="38" r="3" fill="#FFFFFF" opacity="0.9" />
            </>
          )}

          {/* Connexions neurales - Couche externe */}
          <G opacity={animated ? 0.5 : 0.7}>
            {/* Haut */}
            <Path
              d="M 50 30 L 50 15"
              stroke="url(#neuralGradient1)"
              strokeWidth="2"
            />
            <Circle cx="50" cy="15" r="4" fill={primaryColor} />

            {/* Haut droite */}
            <Path
              d="M 56 34 L 70 28"
              stroke="url(#neuralGradient1)"
              strokeWidth="2"
            />
            <Circle cx="70" cy="28" r="4" fill={secondaryColor} />

            {/* Bas droite */}
            <Path
              d="M 56 42 L 70 47"
              stroke="url(#neuralGradient1)"
              strokeWidth="2"
            />
            <Circle cx="70" cy="47" r="4" fill="#FF0080" />

            {/* Bas */}
            <Path
              d="M 50 46 L 50 60"
              stroke="url(#neuralGradient2)"
              strokeWidth="2"
            />
            <Circle cx="50" cy="60" r="4" fill="#FF0080" />

            {/* Bas gauche */}
            <Path
              d="M 44 42 L 30 47"
              stroke="url(#neuralGradient2)"
              strokeWidth="2"
            />
            <Circle cx="30" cy="47" r="4" fill={secondaryColor} />

            {/* Haut gauche */}
            <Path
              d="M 44 34 L 30 28"
              stroke="url(#neuralGradient2)"
              strokeWidth="2"
            />
            <Circle cx="30" cy="28" r="4" fill={primaryColor} />
          </G>

          {/* Connexions secondaires */}
          <G opacity="0.5">
            <Path
              d="M 30 28 L 50 15 L 70 28"
              stroke={secondaryColor}
              strokeWidth="1"
              fill="none"
            />
            <Path
              d="M 30 47 L 50 60 L 70 47"
              stroke="#FF0080"
              strokeWidth="1"
              fill="none"
            />
            <Path d="M 30 28 L 30 47" stroke={primaryColor} strokeWidth="1" />
            <Path d="M 70 28 L 70 47" stroke={primaryColor} strokeWidth="1" />
          </G>

          {/* Nœuds externes */}
          <G>
            {/* Cercle externe avec nœuds */}
            <Circle cx="20" cy="20" r="3" fill={primaryColor} opacity="0.6" />
            <Circle cx="80" cy="20" r="3" fill={secondaryColor} opacity="0.6" />
            <Circle cx="80" cy="55" r="3" fill="#FF0080" opacity="0.6" />
            <Circle cx="50" cy="75" r="3" fill="#FF0080" opacity="0.6" />
            <Circle cx="20" cy="55" r="3" fill={secondaryColor} opacity="0.6" />

            {/* Connexions aux nœuds externes */}
            <Path
              d="M 30 28 L 20 20"
              stroke={primaryColor}
              strokeWidth="1"
              opacity="0.3"
            />
            <Path
              d="M 70 28 L 80 20"
              stroke={secondaryColor}
              strokeWidth="1"
              opacity="0.3"
            />
            <Path
              d="M 70 47 L 80 55"
              stroke="#FF0080"
              strokeWidth="1"
              opacity="0.3"
            />
            <Path
              d="M 50 60 L 50 75"
              stroke="#FF0080"
              strokeWidth="1"
              opacity="0.3"
            />
            <Path
              d="M 30 47 L 20 55"
              stroke={secondaryColor}
              strokeWidth="1"
              opacity="0.3"
            />
          </G>

          {/* Cercle de protection externe */}
          <Circle
            cx="50"
            cy="40"
            r="45"
            fill="none"
            stroke="url(#neuralGradient1)"
            strokeWidth="1"
            opacity="0.3"
            strokeDasharray="3,3"
          />

          {/* Points lumineux animés (si activée) */}
          {animated && (
            <AnimatedG opacity={fadeAnim}>
              <Circle cx="50" cy="15" r="3" fill="#FFFFFF" />
              <Circle cx="70" cy="28" r="3" fill="#FFFFFF" />
              <Circle cx="70" cy="47" r="3" fill="#FFFFFF" />
              <Circle cx="50" cy="60" r="3" fill="#FFFFFF" />
              <Circle cx="30" cy="47" r="3" fill="#FFFFFF" />
              <Circle cx="30" cy="28" r="3" fill="#FFFFFF" />
            </AnimatedG>
          )}

          {/* Effet de brillance animé sur le noyau central */}
          {animated && (
            <AnimatedCircle
              cx="50"
              cy="38"
              r={pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 15],
              })}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1"
              opacity={pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0],
              })}
            />
          )}
        </G>
      </Svg>
    </Animated.View>
  );
};

export default AINeuralIcon;
