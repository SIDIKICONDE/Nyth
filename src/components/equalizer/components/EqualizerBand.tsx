import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions,
  Pressable,
  Platform
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  useFrameCallback,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../../contexts/ThemeContext';
import { BandConfig } from '../types';

interface EqualizerBandProps {
  bandIndex: number;
  config: BandConfig;
  onGainChange: (bandIndex: number, gain: number) => void;
  height?: number;
  isProcessing?: boolean;
}

const SLIDER_HEIGHT = 200;
const THUMB_SIZE = 24;
const TRACK_WIDTH = 6;
const DB_RANGE = 24; // -24dB à +24dB

export const EqualizerBand: React.FC<EqualizerBandProps> = ({
  bandIndex,
  config,
  onGainChange,
  height = SLIDER_HEIGHT,
  isProcessing = false
}) => {
  const { currentTheme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);

  // Fonctions de conversion (doivent être avant leur utilisation)
  const gainToPosition = useCallback((gain: number): number => {
    return (gain + DB_RANGE) / (DB_RANGE * 2);
  }, []);

  // Variables animées avec React Native Reanimated
  const bandHeight = useSharedValue(gainToPosition(config.gain));
  const bandOpacity = useSharedValue(1);
  const lastGainRef = useRef(config.gain);

  // Système de particules réactives
  const particles = Array.from({ length: 8 }, (_, i) => ({
    x: useSharedValue(Math.random() * 60 - 30),
    y: useSharedValue(0),
    scale: useSharedValue(0),
    opacity: useSharedValue(0),
    phase: useSharedValue(i * (Math.PI * 2) / 8),
  }));

  // Animation de morphing du thumb
  const thumbMorphProgress = useSharedValue(0);
  const glowIntensity = useSharedValue(0.5);

  // Feedback visuel avancé
  const successPulse = useSharedValue(0);
  const errorShake = useSharedValue(0);
  const processingGlow = useSharedValue(0);

  // État des particules
  const [particleTrigger, setParticleTrigger] = useState(0);

  // Configuration optimisée des particules (mémoïsée)
  const particleConfig = useMemo(() => ({
    count: 8,
    maxIntensity: 2,
    baseRadius: 25,
    animationDuration: 400,
    staggerDelay: 50,
  }), []);

  // Easing curves personnalisées pour fluidité optimale
  const customEasings = useMemo(() => ({
    // Easing élastique pour les rebonds
    elastic: Easing.bezier(0.68, -0.55, 0.265, 1.55),
    // Easing fluide pour les transitions
    smooth: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    // Easing rapide pour les interactions
    snappy: Easing.bezier(0.4, 0.0, 0.2, 1.0),
    // Easing organique pour les particules
    organic: Easing.bezier(0.175, 0.885, 0.32, 1.275),
    // Easing doux pour les glow effects
    gentle: Easing.bezier(0.4, 0.0, 0.6, 1.0),
  }), []);

  // Déclencher les particules quand le gain change significativement
  const triggerParticles = useCallback((intensity: number = 1) => {
    const clampedIntensity = Math.min(particleConfig.maxIntensity, intensity);

    particles.forEach((particle, index) => {
      const delay = index * particleConfig.staggerDelay;

      setTimeout(() => {
        // Animation de particule avec easing élastique personnalisé
        particle.scale.value = withSequence(
          withTiming(1.2 * clampedIntensity, {
            duration: 200,
            easing: customEasings.organic
          }),
          withSpring(0, { damping: 12, stiffness: 200 })
        );

        particle.opacity.value = withSequence(
          withTiming(0.8 * clampedIntensity, {
            duration: 150,
            easing: customEasings.gentle
          }),
          withTiming(0, {
            duration: 300,
            easing: customEasings.smooth
          })
        );

        // Mouvement orbital fluide avec easing personnalisé
        const time = performance.now() * 0.001;
        const radius = particleConfig.baseRadius * clampedIntensity;

        particle.x.value = withTiming(
          Math.cos(time + particle.phase.value) * radius,
          {
            duration: particleConfig.animationDuration,
            easing: customEasings.organic
          }
        );
        particle.y.value = withTiming(
          Math.sin(time + particle.phase.value) * (radius * 1.2),
          {
            duration: particleConfig.animationDuration,
            easing: customEasings.organic
          }
        );
      }, delay);
    });
  }, [particles, particleConfig, customEasings]);

  // Feedback visuel avancé
  const triggerSuccessFeedback = useCallback(() => {
    successPulse.value = withSequence(
      withTiming(1, { duration: 100, easing: customEasings.snappy }),
      withTiming(0, { duration: 300, easing: customEasings.smooth })
    );

    glowIntensity.value = withSequence(
      withTiming(1.2, { duration: 150, easing: customEasings.gentle }),
      withTiming(0.5, { duration: 400, easing: customEasings.smooth })
    );

    runOnJS(triggerParticles)(1.5);
  }, [successPulse, glowIntensity, customEasings, triggerParticles]);

  const triggerErrorFeedback = useCallback(() => {
    errorShake.value = withSequence(
      withTiming(10, { duration: 80, easing: customEasings.snappy }),
      withTiming(-10, { duration: 80, easing: customEasings.snappy }),
      withTiming(5, { duration: 80, easing: customEasings.snappy }),
      withTiming(-5, { duration: 80, easing: customEasings.snappy }),
      withTiming(0, { duration: 100, easing: customEasings.smooth })
    );

    bandOpacity.value = withSequence(
      withTiming(0.3, { duration: 100, easing: customEasings.snappy }),
      withTiming(1, { duration: 200, easing: customEasings.smooth })
    );
  }, [errorShake, bandOpacity, customEasings]);

  const triggerProcessingFeedback = useCallback(() => {
    processingGlow.value = withSequence(
      withTiming(0.8, { duration: 300, easing: customEasings.gentle }),
      withTiming(0, { duration: 500, easing: customEasings.smooth })
    );
  }, [processingGlow, customEasings]);

  // Animation de morphing du thumb selon l'activité
  useEffect(() => {
    if (isDragging) {
      thumbMorphProgress.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
        mass: 0.8
      });
      glowIntensity.value = withSpring(1, {
        damping: 20,
        stiffness: 200,
        mass: 0.6
      });
    } else {
      thumbMorphProgress.value = withSpring(0, {
        damping: 15,
        stiffness: 300,
        mass: 0.8
      });
      glowIntensity.value = withSpring(0.5, {
        damping: 20,
        stiffness: 200,
        mass: 0.6
      });
    }
  }, [isDragging, thumbMorphProgress, glowIntensity]);

  // Effet de processing quand isProcessing change
  useEffect(() => {
    if (isProcessing) {
      runOnJS(triggerProcessingFeedback)();
    }
  }, [isProcessing, triggerProcessingFeedback]);

  // Fonction de conversion complémentaire
  const positionToGain = useCallback((position: number): number => {
    return position * (DB_RANGE * 2) - DB_RANGE;
  }, []);

  // Configuration des constantes optimisée
  const sliderConfig = useMemo(() => ({
    dbRange: DB_RANGE,
    sliderHeight: height,
    thumbSize: THUMB_SIZE,
    trackWidth: TRACK_WIDTH,
  }), [height]);

  // Formater la fréquence pour l'affichage
  const formatFrequency = (freq: number): string => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(freq % 1000 === 0 ? 0 : 1)}k`;
    }
    return `${Math.round(freq)}`;
  };

  // Callbacks optimisés pour le PanResponder
  const handlePanResponderGrant = useCallback(() => {
    setIsDragging(true);
    bandOpacity.value = 0.8;
  }, [bandOpacity]);

  const handlePanResponderMove = useCallback((_, gestureState) => {
    const newPosition = Math.max(0, Math.min(1,
      bandHeight.value - gestureState.dy / sliderConfig.sliderHeight
    ));
    bandHeight.value = newPosition;

    const newGain = positionToGain(newPosition);
    if (Math.abs(newGain - lastGainRef.current) > 0.5) {
      lastGainRef.current = newGain;
      onGainChange(bandIndex, newGain);

      const intensity = Math.min(particleConfig.maxIntensity,
        Math.abs(newGain - lastGainRef.current) / 10);
      runOnJS(triggerParticles)(intensity);
    }
  }, [bandHeight, sliderConfig.sliderHeight, positionToGain, bandIndex, onGainChange,
      particleConfig.maxIntensity, triggerParticles]);

  const handlePanResponderRelease = useCallback(() => {
    bandOpacity.value = withSpring(1, { damping: 15, stiffness: 300 });
    setIsDragging(false);
  }, [bandOpacity]);

  // PanResponder optimisé avec callbacks mémoïsés
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: handlePanResponderGrant,
    onPanResponderMove: handlePanResponderMove,
    onPanResponderRelease: handlePanResponderRelease,
  }), [handlePanResponderGrant, handlePanResponderMove, handlePanResponderRelease]);

  // Réinitialiser à 0 dB avec animation fluide et easing personnalisé
  const handleReset = useCallback(() => {
    if (isProcessing) return;

    bandHeight.value = withSpring(gainToPosition(0), {
      damping: 15,
      stiffness: 300,
      mass: 0.8
    });

    bandOpacity.value = withSequence(
      withTiming(0.7, { duration: 150, easing: customEasings.snappy }),
      withTiming(1, { duration: 200, easing: customEasings.smooth })
    );

    // Ajouter un petit effet de particules pour le feedback
    runOnJS(triggerParticles)(0.5);

    onGainChange(bandIndex, 0);
  }, [bandIndex, onGainChange, bandHeight, bandOpacity, isProcessing, gainToPosition, customEasings, triggerParticles]);

  // Styles animés optimisés avec React Native Reanimated
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(bandHeight.value, [0, 1],
        [sliderConfig.sliderHeight - sliderConfig.thumbSize / 2, sliderConfig.thumbSize / 2]) } as any,
      { scale: interpolate(thumbMorphProgress.value, [0, 1], [1, 1.3]) } as any,
      { translateX: errorShake.value } as any,
    ],
  }), [sliderConfig.sliderHeight, sliderConfig.thumbSize, errorShake]);

  // Style de glow pour le container (optimisé)
  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(
      Math.max(glowIntensity.value, processingGlow.value, successPulse.value * 0.5),
      [0.5, 1.2], [0.2, 0.8]
    ),
    shadowRadius: interpolate(
      Math.max(glowIntensity.value, processingGlow.value, successPulse.value * 0.5),
      [0.5, 1.2], [8, 25]
    ),
    shadowColor: successPulse.value > 0.5 ? '#10B981' :
                 processingGlow.value > 0.5 ? '#3B82F6' :
                 currentTheme.colors.primary,
  }), [currentTheme.colors.primary, glowIntensity, processingGlow, successPulse]);

  const activeTrackStyle = useAnimatedStyle(() => ({
    height: `${interpolate(bandHeight.value, [0, 1], [0, 100])}%`,
    opacity: bandOpacity.value,
  }));

  const gainTextStyle = useAnimatedStyle(() => ({
    color: isDragging ? currentTheme.colors.primary : currentTheme.colors.textSecondary,
  }));

  return (
    <Animated.View style={[styles.container, { height: height + 60 }, glowStyle]}>
      {/* Particules réactives */}
      {particles.map((particle, index) => (
        <Animated.View
          key={`particle-${index}`}
          style={[
            styles.particle,
            {
              backgroundColor: currentTheme.colors.primary,
              left: 30 + particle.x.value,
              top: height / 2 + particle.y.value,
            },
            useAnimatedStyle(() => ({
              transform: [{ scale: particle.scale.value }],
              opacity: particle.opacity.value,
            })),
          ]}
        />
      ))}

      {/* Indicateur de processing */}
      {isProcessing && (
        <Animated.View
          style={[
            styles.processingIndicator,
            {
              borderColor: currentTheme.colors.primary,
            },
            useAnimatedStyle(() => ({
              opacity: processingGlow.value,
              transform: [{ scale: interpolate(processingGlow.value, [0, 0.8], [1, 1.2]) }],
            }))
          ]}
        />
      )}

      {/* Indicateur de succès temporaire */}
      <Animated.View
        style={[
          styles.successIndicator,
          useAnimatedStyle(() => ({
            opacity: successPulse.value,
            transform: [{ scale: interpolate(successPulse.value, [0, 1], [1, 1.5]) }],
          }))
        ]}
      >
        <Text style={[styles.successText, { color: '#10B981' }]}>✓</Text>
      </Animated.View>

      {/* Valeur du gain */}
      <View style={styles.gainDisplay}>
        <Animated.Text style={[styles.gainText, gainTextStyle]}>
          {interpolate(bandHeight.value, [0, 1], [-DB_RANGE, DB_RANGE]).toFixed(1)}
        </Animated.Text>
        <Text style={[styles.dbText, { color: currentTheme.colors.textSecondary }]}>dB</Text>
      </View>

      {/* Slider */}
      <View style={[styles.sliderContainer, { height }]}>
        {/* Ligne de zéro */}
        <View style={[
          styles.zeroLine,
          { 
            backgroundColor: currentTheme.colors.border,
            bottom: height * 0.5
          }
        ]} />

        {/* Track inactif */}
        <View style={[
          styles.track,
          { backgroundColor: currentTheme.colors.surface + '40' }
        ]} />

        {/* Track actif */}
        <Animated.View
          style={[
            styles.activeTrack,
            {
              backgroundColor: config.enabled ? currentTheme.colors.primary : currentTheme.colors.textSecondary,
            },
            activeTrackStyle
          ]}
        />

        {/* Thumb */}
        <Animated.View
          style={[
            styles.thumbContainer,
            thumbStyle
          ]}
          {...panResponder.panHandlers}
        >
          <View style={[
            styles.thumb,
            {
              backgroundColor: isDragging ? currentTheme.colors.primary : currentTheme.colors.surface,
              borderColor: config.enabled ? currentTheme.colors.primary : currentTheme.colors.textSecondary,
              shadowColor: currentTheme.colors.primary,
              elevation: isDragging ? 8 : 4,
            }
          ]} />
        </Animated.View>
      </View>

      {/* Fréquence */}
      <Pressable onPress={handleReset} style={styles.frequencyContainer}>
        <Text style={[styles.frequencyText, { color: currentTheme.colors.text }]}>
          {formatFrequency(config.frequency)}
        </Text>
        <Text style={[styles.hzText, { color: currentTheme.colors.textSecondary }]}>
          Hz
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 60,
    paddingHorizontal: 5,
  },
  gainDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    height: 20,
  },
  gainText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
  },
  dbText: {
    fontSize: 10,
    marginLeft: 2,
  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    width: TRACK_WIDTH,
    height: '100%',
    borderRadius: TRACK_WIDTH / 2,
  },
  activeTrack: {
    position: 'absolute',
    bottom: 0,
    width: TRACK_WIDTH,
    borderRadius: TRACK_WIDTH / 2,
  },
  zeroLine: {
    position: 'absolute',
    width: 20,
    height: 1,
    opacity: 0.5,
  },
  thumbContainer: {
    position: 'absolute',
    width: THUMB_SIZE * 2,
    height: THUMB_SIZE * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      }
    })
  },
  frequencyContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  hzText: {
    fontSize: 10,
    marginTop: 1,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      }
    })
  },
  processingIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  successIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
    marginTop: -12,
  },
  successText: {
    fontSize: 14,
    fontWeight: 'bold',
  }
});
