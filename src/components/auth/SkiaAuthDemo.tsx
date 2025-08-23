import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import tw from 'twrnc';

// Composants Skia créés
import {
  SkiaAuthBackground,
  SkiaAnimatedLogo,
  SkiaSuccessAnimation
} from './index';

export const SkiaAuthDemo: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'blue' | 'purple' | 'rainbow'>('blue');

  const bounceAnimation = useRef(new Animated.Value(1)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  // Animation de rebond continue
  useEffect(() => {
    const startBounceAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnimation, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnimation, {
            toValue: 0.9,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startBounceAnimation();
  }, [bounceAnimation]);

  // Animation de rotation au changement de thème
  useEffect(() => {
    Animated.timing(rotateAnimation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      rotateAnimation.setValue(0);
    });
  }, [currentTheme, rotateAnimation]);

  const themes = {
    blue: ['#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4'],
    purple: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
    rainbow: ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff', '#ff00ff', '#ff0080']
  };

  const rotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <SkiaAuthBackground>
      <SkiaSuccessAnimation
        visible={showSuccess}
        onAnimationComplete={() => setShowSuccess(false)}
        duration={2000}
      />

      <View style={tw`flex-1 justify-center items-center p-6`}>
        <Animated.View
          style={[
            tw`mb-8`,
            {
              transform: [
                { scale: bounceAnimation },
                { rotate },
              ],
            },
          ]}
        >
          <SkiaAnimatedLogo
            size={160}
            colors={themes[currentTheme]}
          />
        </Animated.View>

        <Animated.Text
          style={[
            tw`text-4xl font-bold text-white text-center mb-2`,
            {
              transform: [
                {
                  scale: bounceAnimation.interpolate({
                    inputRange: [0.9, 1.1],
                    outputRange: [0.95, 1.05],
                  }),
                },
              ],
            },
          ]}
        >
          🎭 Experience Hypnotique 🎭
        </Animated.Text>

        <Text style={tw`text-lg text-gray-300 text-center mb-8`}>
          Laissez-vous envoûter par les animations React Animated...
        </Text>

        <View style={tw`w-full max-w-sm`}>
          <TouchableOpacity
            style={tw`bg-purple-600 p-4 rounded-xl items-center mb-4`}
            onPress={() => setShowSuccess(true)}
          >
            <Text style={tw`text-white font-bold text-lg`}>
              🚀 Animation de Succès
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-blue-600 p-4 rounded-xl items-center mb-4`}
            onPress={() => setCurrentTheme(currentTheme === 'blue' ? 'purple' : currentTheme === 'purple' ? 'rainbow' : 'blue')}
          >
            <Text style={tw`text-white font-bold text-lg`}>
              🎨 Changer le Thème ({currentTheme})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`bg-green-600 p-4 rounded-xl items-center`}
            onPress={() => {
              // Animation d'interaction
              Animated.sequence([
                Animated.timing(bounceAnimation, {
                  toValue: 1.3,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(bounceAnimation, {
                  toValue: 1.1,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ]).start();
            }}
          >
            <Text style={tw`text-white font-bold text-lg`}>
              👆 Animer le Logo !
            </Text>
          </TouchableOpacity>
        </View>

        <View style={tw`mt-12 p-4 bg-black bg-opacity-50 rounded-xl max-w-sm`}>
          <Text style={tw`text-white text-center text-sm`}>
            ✨ Animations fluides avec React Animated{'\n'}
            🌟 Logo hypnotique avec rotation et pulsation{'\n'}
            🎆 Effets de particules explosifs{'\n'}
            🎭 Expérience addictive garantie !
          </Text>
        </View>
      </View>
    </SkiaAuthBackground>
  );
};
