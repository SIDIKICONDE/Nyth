import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { BlurView } from '@react-native-community/blur';

interface ParticleProps {
  delay: number;
  x: string | number;
  size: number;
}

const Particle: React.FC<ParticleProps> = ({ delay, x, size }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -500,
            duration: 8000,
            delay,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: 2000,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 6000,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: -20,
        left: typeof x === 'string' ? x as any : x,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(255,255,255,0.8)',
        transform: [{ translateY }],
        opacity,
      }}
    >
      <BlurView blurAmount={10} blurType="dark" style={{ flex: 1, borderRadius: size / 2 }} />
    </Animated.View>
  );
};

export const FloatingParticles: React.FC = () => {
  const particles = [
    { delay: 0, x: '10%', size: 4 },
    { delay: 1000, x: '25%', size: 6 },
    { delay: 2000, x: '40%', size: 3 },
    { delay: 3000, x: '55%', size: 5 },
    { delay: 4000, x: '70%', size: 4 },
    { delay: 5000, x: '85%', size: 3 },
  ];

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
    }}>
      {particles.map((particle, index) => (
        <Particle
          key={index}
          delay={particle.delay}
          x={particle.x}
          size={particle.size}
        />
      ))}
    </View>
  );
}; 