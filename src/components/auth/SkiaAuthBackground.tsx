import React, { useEffect, useRef } from 'react';
import { View, Dimensions, Animated, PanResponder } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import tw from 'twrnc';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SkiaAuthBackgroundProps {
  children: React.ReactNode;
}

export const SkiaAuthBackground: React.FC<SkiaAuthBackgroundProps> = ({ children }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const touchX = useRef(new Animated.Value(SCREEN_WIDTH / 2)).current;
  const touchY = useRef(new Animated.Value(SCREEN_HEIGHT / 2)).current;

  // Animation continue hypnotique
  useEffect(() => {
    const startHypnoticAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startHypnoticAnimation();
  }, [animatedValue]);

  // Gestion du toucher
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt) => {
        touchX.setValue(evt.nativeEvent.locationX);
        touchY.setValue(evt.nativeEvent.locationY);
      },
    })
  );

  // Animation des couleurs hypnotiques
  const backgroundColor1 = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 107, 157, 0.3)', 'rgba(78, 205, 196, 0.3)'],
  });

  const backgroundColor2 = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(69, 205, 209, 0.4)', 'rgba(150, 206, 180, 0.4)'],
  });

  const rotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={tw`flex-1`} {...panResponder.current.panHandlers}>
      {/* Fond hypnotique avec gradients animés */}
      <Animated.View
        style={[
          tw`absolute inset-0`,
          {
            transform: [{ rotate }],
          },
        ]}
      >
        <LinearGradient
          colors={['#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4']}
          style={tw`flex-1`}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View
            style={[
              tw`absolute inset-0`,
              { backgroundColor: backgroundColor1 },
            ]}
          />
          <Animated.View
            style={[
              tw`absolute inset-0`,
              { backgroundColor: backgroundColor2 },
            ]}
          />
        </LinearGradient>
      </Animated.View>

      {/* Particules hypnotiques animées */}
      {Array.from({ length: 8 }, (_, i) => {
        const particleAnimation = animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [`${i * 45}deg`, `${i * 45 + 360}deg`],
        });

        return (
          <Animated.View
            key={i}
            style={[
              tw`absolute w-4 h-4 rounded-full`,
              {
                left: SCREEN_WIDTH / 2 - 20,
                top: SCREEN_HEIGHT / 3 - 20,
                backgroundColor: ['#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 4],
                transform: [
                  {
                    rotate: particleAnimation,
                  },
                  {
                    translateX: Animated.multiply(
                      animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 100 + Math.sin(i) * 50],
                      }),
                      new Animated.Value(Math.cos(i))
                    ),
                  },
                  {
                    translateY: Animated.multiply(
                      animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 100 + Math.cos(i) * 50],
                      }),
                      new Animated.Value(Math.sin(i))
                    ),
                  },
                ],
              },
            ]}
          />
        );
      })}

      {/* Contenu superposé */}
      <View style={tw`flex-1`}>
        {children}
      </View>
    </View>
  );
};
