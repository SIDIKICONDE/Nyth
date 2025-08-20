import React, { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Pressable,
  Platform
} from 'react-native';
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
  const animatedValue = useRef(new Animated.Value(gainToPosition(config.gain))).current;
  const lastGainRef = useRef(config.gain);

  // Convertir le gain en position (0 à 1)
  function gainToPosition(gain: number): number {
    return (gain + DB_RANGE) / (DB_RANGE * 2);
  }

  // Convertir la position en gain
  function positionToGain(position: number): number {
    return position * (DB_RANGE * 2) - DB_RANGE;
  }

  // Formater la fréquence pour l'affichage
  const formatFrequency = (freq: number): string => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(freq % 1000 === 0 ? 0 : 1)}k`;
    }
    return `${Math.round(freq)}`;
  };

  // Gérer le mouvement du slider
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging(true);
        const animValue = animatedValue as Animated.Value & { _value: number };
        animatedValue.setOffset(animValue._value);
      },
      onPanResponderMove: (_, gestureState) => {
        // Utiliser une approche plus propre pour accéder aux valeurs internes
        const animValue = animatedValue as Animated.Value & { _value: number; _offset: number };
        const currentOffset = animValue._offset || 0;
        const newPosition = Math.max(0, Math.min(1, 
          currentOffset - gestureState.dy / height
        ));
        animatedValue.setValue(newPosition - currentOffset);
        
        const newGain = positionToGain(newPosition);
        if (Math.abs(newGain - lastGainRef.current) > 0.1) {
          lastGainRef.current = newGain;
          onGainChange(bandIndex, newGain);
        }
      },
      onPanResponderRelease: () => {
        animatedValue.flattenOffset();
        setIsDragging(false);
      }
    })
  ).current;

  // Réinitialiser à 0 dB
  const handleReset = useCallback(() => {
    if (isProcessing) return;
    
    Animated.spring(animatedValue, {
      toValue: gainToPosition(0),
      useNativeDriver: false,
      tension: 40,
      friction: 7
    }).start();
    
    onGainChange(bandIndex, 0);
  }, [bandIndex, onGainChange, animatedValue, isProcessing]);

  // Interpolations pour l'animation
  const thumbTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [height - THUMB_SIZE / 2, THUMB_SIZE / 2]
  });

  const activeTrackHeight = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  const gainText = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [`-${DB_RANGE}`, `+${DB_RANGE}`]
  });

  return (
    <View style={[styles.container, { height: height + 60 }]}>
      {/* Valeur du gain */}
      <View style={styles.gainDisplay}>
        <Animated.Text style={[
          styles.gainText,
          { color: isDragging ? currentTheme.colors.primary : currentTheme.colors.textSecondary }
        ]}>
          {gainText}
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
              height: activeTrackHeight
            }
          ]}
        />

        {/* Thumb */}
        <Animated.View
          style={[
            styles.thumbContainer,
            {
              transform: [{ translateY: thumbTranslateY }]
            }
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
              transform: [{ scale: isDragging ? 1.2 : 1 }]
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
    </View>
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
  }
});
