import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import Svg, {
  Rect,
  Defs,
  LinearGradient,
  Stop,
  G,
  Text as SvgText,
  Line
} from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { useTheme } from '../../../contexts/ThemeContext';
import { SpectrumData } from '../types';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface SpectrumAnalyzerProps {
  data: SpectrumData;
  width?: number;
  height?: number;
  barCount?: number;
  showGrid?: boolean;
  animate?: boolean;
}

const FREQUENCY_LABELS = ['31', '63', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];

export const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({
  data,
  width = Dimensions.get('window').width - 40,
  height = 120,
  barCount = 32,
  showGrid = true,
  animate = true
}) => {
  const { currentTheme } = useTheme();
  const animatedValues = useRef<Animated.SharedValue<number>[]>([]);
  
  // Initialiser les valeurs animées
  useEffect(() => {
    if (animatedValues.current.length !== barCount) {
      animatedValues.current = Array(barCount)
        .fill(0)
        .map(() => useSharedValue(0));
    }
  }, [barCount]);

  // Mettre à jour les valeurs animées
  useEffect(() => {
    data.magnitudes.forEach((magnitude, index) => {
      if (index < animatedValues.current.length) {
        if (animate) {
          animatedValues.current[index].value = withSpring(magnitude, {
            damping: 15,
            stiffness: 150,
            mass: 0.5
          });
        } else {
          animatedValues.current[index].value = magnitude;
        }
      }
    });
  }, [data, animate]);

  // Calculer les dimensions des barres
  const barWidth = useMemo(() => {
    const totalSpacing = (barCount - 1) * 2;
    return (width - totalSpacing) / barCount;
  }, [width, barCount]);

  // Couleurs du gradient
  const gradientColors = useMemo(() => {
    return currentTheme.isDark
      ? ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
      : ['#FF416C', '#FF4B2B', '#C33764', '#F77062'];
  }, [currentTheme.isDark]);

  // Rendu des barres
  const renderBars = () => {
    return animatedValues.current.map((animValue, index) => {
      const x = index * (barWidth + 2);
      
      const animatedProps = useAnimatedProps(() => {
        const heightValue = interpolate(
          animValue.value,
          [0, 1],
          [2, height - 25] // Laisser de la place pour les labels
        );
        
        return {
          height: heightValue,
          y: height - 25 - heightValue,
          opacity: interpolate(animValue.value, [0, 0.1], [0.3, 1])
        };
      });

      return (
        <AnimatedRect
          key={`bar-${index}`}
          x={x}
          width={barWidth}
          rx={barWidth / 4}
          fill="url(#spectrumGradient)"
          animatedProps={animatedProps}
        />
      );
    });
  };

  // Rendu de la grille
  const renderGrid = () => {
    if (!showGrid) return null;

    const lines = [];
    const gridLines = 4;
    
    for (let i = 1; i < gridLines; i++) {
      const y = (height - 25) * (i / gridLines);
      lines.push(
        <Line
          key={`grid-${i}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke={currentTheme.colors.border}
          strokeWidth={0.5}
          strokeDasharray="2,4"
          opacity={0.3}
        />
      );
    }
    
    return lines;
  };

  // Rendu des labels de fréquence
  const renderFrequencyLabels = () => {
    const labelInterval = Math.floor(barCount / FREQUENCY_LABELS.length);
    
    return FREQUENCY_LABELS.map((label, index) => {
      const barIndex = index * labelInterval;
      const x = barIndex * (barWidth + 2) + barWidth / 2;
      
      return (
        <SvgText
          key={`label-${index}`}
          x={x}
          y={height - 5}
          fontSize={9}
          fill={currentTheme.colors.textSecondary}
          textAnchor="middle"
          opacity={0.7}
        >
          {label}
        </SvgText>
      );
    });
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <LinearGradient id="spectrumGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            {gradientColors.map((color, index) => (
              <Stop
                key={`stop-${index}`}
                offset={`${(index / (gradientColors.length - 1)) * 100}%`}
                stopColor={color}
                stopOpacity={currentTheme.isDark ? 0.8 : 0.9}
              />
            ))}
          </LinearGradient>
        </Defs>
        
        <G>
          {renderGrid()}
          {renderBars()}
          {renderFrequencyLabels()}
        </G>
      </Svg>
      
      {/* Effet de brillance */}
      <View 
        style={[
          styles.glowEffect,
          {
            backgroundColor: currentTheme.colors.primary,
            opacity: currentTheme.isDark ? 0.1 : 0.05
          }
        ]}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderRadius: 12,
  },
  glowEffect: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 0,
      }
    })
  }
});
