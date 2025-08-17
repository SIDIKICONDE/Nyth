import React from "react";
import { Animated, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";

interface TypingIndicatorProps {
  isVisible: boolean;
  message?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = React.memo(
  ({ isVisible, message = "" }) => {
    const { currentTheme } = useTheme();

    // Animations pour les boules de réflexion
    const ball1 = React.useRef(new Animated.Value(0)).current;
    const ball2 = React.useRef(new Animated.Value(0)).current;
    const ball3 = React.useRef(new Animated.Value(0)).current;
    const containerOpacity = React.useRef(new Animated.Value(0)).current;

    // Ref pour gérer l'animation en cours
    const animationRef = React.useRef<Animated.CompositeAnimation | null>(null);

    React.useEffect(() => {
      if (isVisible) {
        // Animation d'apparition du container
        Animated.timing(containerOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();

        // Animation des boules
        const createBallAnimation = (ball: Animated.Value, delay: number) => {
          return Animated.loop(
            Animated.sequence([
              Animated.delay(delay),
              Animated.timing(ball, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(ball, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
              }),
            ])
          );
        };

        // Démarrer les animations des boules
        const ballAnimations = Animated.parallel([
          createBallAnimation(ball1, 0),
          createBallAnimation(ball2, 200),
          createBallAnimation(ball3, 400),
        ]);

        animationRef.current = ballAnimations;
        ballAnimations.start();
      } else {
        // Arrêter les animations et masquer
        if (animationRef.current) {
          animationRef.current.stop();
          animationRef.current = null;
        }

        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();

        // Réinitialiser les valeurs des boules
        ball1.setValue(0);
        ball2.setValue(0);
        ball3.setValue(0);
      }

      return () => {
        if (animationRef.current) {
          animationRef.current.stop();
        }
      };
    }, [isVisible, ball1, ball2, ball3, containerOpacity]);

    if (!isVisible) return null;

    return (
      <Animated.View
        style={[
          tw`flex-row items-center justify-start mb-4 ml-4`,
          {
            opacity: containerOpacity,
          },
        ]}
      >
        <View
          style={[
            tw`flex-row items-center px-4 py-3 rounded-2xl`,
            {
              backgroundColor: currentTheme.colors.surface,
              borderWidth: 1,
              borderColor: currentTheme.colors.border,
            },
          ]}
        >
          {/* Boules animées */}
          {[ball1, ball2, ball3].map((ball, index) => (
            <Animated.View
              key={index}
              style={[
                tw`w-2 h-2 rounded-full mx-1`,
                {
                  backgroundColor: currentTheme.colors.primary,
                  transform: [
                    {
                      translateY: ball.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -8],
                      }),
                    },
                    {
                      scale: ball.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1.2, 1],
                      }),
                    },
                  ],
                  opacity: ball.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.6, 1, 0.6],
                  }),
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.isVisible === nextProps.isVisible;
  }
);

export default TypingIndicator;
