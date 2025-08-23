import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface RealTimeVideoFilterProps {
  children: React.ReactNode; // Votre composant caméra
  selectedFilter: string;
  filterIntensity: number;
  onFilterChange?: (filter: string, intensity: number) => void;
}

export const RealTimeVideoFilter: React.FC<RealTimeVideoFilterProps> = ({
  children,
  selectedFilter,
  filterIntensity,
  onFilterChange,
}) => {
  const [showControls, setShowControls] = useState(false);

  // Styles animés pour les filtres
  const getFilterOverlayStyle = (type: string, intensity: number) => {
    const baseIntensity = Math.min(1, Math.max(0, intensity));

    const overlayStyles: { [key: string]: any } = {
      sepia: {
        backgroundColor: `rgba(112, 66, 20, ${baseIntensity * 0.4})`,
      },
      vintage: {
        backgroundColor: `rgba(255, 248, 220, ${baseIntensity * 0.2})`,
      },
      cool: {
        backgroundColor: `rgba(173, 216, 230, ${baseIntensity * 0.3})`,
      },
      warm: {
        backgroundColor: `rgba(255, 218, 185, ${baseIntensity * 0.3})`,
      },
      dramatic: {
        backgroundColor: `rgba(139, 69, 19, ${baseIntensity * 0.5})`,
      },
      blackAndWhite: {
        backgroundColor: `rgba(128, 128, 128, ${baseIntensity * 0.7})`,
      },
      vivid: {
        backgroundColor: `rgba(255, 215, 0, ${baseIntensity * 0.2})`,
      },
    };

    return overlayStyles[type] || { backgroundColor: 'transparent' };
  };

  const filterOverlayStyle = getFilterOverlayStyle(selectedFilter, filterIntensity);

  // Animation pour l'overlay du filtre
  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(selectedFilter !== 'none' ? filterIntensity : 0, {
        duration: 200,
      }),
    };
  });

  return (
    <View style={styles.container}>
      {/* Votre composant caméra */}
      <View style={styles.cameraContainer}>
        {children}
      </View>

      {/* Overlay du filtre en temps réel */}
      {selectedFilter !== 'none' && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            filterOverlayStyle,
            animatedOverlayStyle,
          ]}
        />
      )}

      {/* Contrôles flottants */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowControls(!showControls)}
      >
        <Text style={styles.filterButtonText}>🎨</Text>
      </TouchableOpacity>

      {/* Indicateur de filtre actif */}
      {selectedFilter !== 'none' && (
        <View style={styles.filterIndicator}>
          <Text style={styles.filterIndicatorText}>
            {selectedFilter} ({Math.round(filterIntensity * 100)}%)
          </Text>
        </View>
      )}

      {/* Contrôles d'intensité */}
      {showControls && selectedFilter !== 'none' && (
        <View style={styles.intensityControls}>
          <Text style={styles.intensityLabel}>Intensité</Text>
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              style={styles.sliderTrack}
              onPress={(event) => {
                const { locationX } = event.nativeEvent;
                const newIntensity = Math.max(0, Math.min(1, locationX / 200));
                onFilterChange?.(selectedFilter, newIntensity);
              }}
            >
              <View 
                style={[
                  styles.sliderFill, 
                  { width: `${filterIntensity * 100}%` }
                ]} 
              />
              <View 
                style={[
                  styles.sliderThumb, 
                  { left: `${filterIntensity * 100}%` }
                ]} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  cameraContainer: {
    flex: 1,
  },

  filterButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  filterButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  filterIndicator: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 1000,
  },
  filterIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  intensityControls: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    zIndex: 1000,
  },
  intensityLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderTrack: {
    width: 200,
    height: 6,
    backgroundColor: '#333333',
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    backgroundColor: '#ffffff',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
}); 