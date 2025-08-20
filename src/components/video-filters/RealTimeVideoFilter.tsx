import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import {
  Canvas,
  Fill,
  Group,
  Paint,
  ColorMatrix,
} from '@shopify/react-native-skia';

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

  // Matrices de couleurs optimisées pour le temps réel
  const getColorMatrix = (type: string, intensity: number) => {
    const baseIntensity = Math.min(1, Math.max(0, intensity));
    
    switch (type) {
      case 'sepia':
        return [
          0.393 + 0.607 * (1 - baseIntensity), 0.769 - 0.769 * (1 - baseIntensity), 0.189 - 0.189 * (1 - baseIntensity), 0, 0,
          0.349 - 0.349 * (1 - baseIntensity), 0.686 + 0.314 * (1 - baseIntensity), 0.168 - 0.168 * (1 - baseIntensity), 0, 0,
          0.272 - 0.272 * (1 - baseIntensity), 0.534 - 0.534 * (1 - baseIntensity), 0.131 + 0.869 * (1 - baseIntensity), 0, 0,
          0, 0, 0, 1, 0,
        ];
      
      case 'vintage':
        return [
          1.2 * baseIntensity + (1 - baseIntensity), 0, 0, 0, 0.1 * baseIntensity,
          0, 1.1 * baseIntensity + (1 - baseIntensity), 0, 0, 0.05 * baseIntensity,
          0, 0, 0.9 * baseIntensity + (1 - baseIntensity), 0, 0.1 * baseIntensity,
          0, 0, 0, 1, 0,
        ];
      
      case 'cool':
        return [
          1.1 * baseIntensity + (1 - baseIntensity), 0, 0, 0, 0,
          0, 0.9 * baseIntensity + (1 - baseIntensity), 0, 0, 0.1 * baseIntensity,
          0, 0, 1.2 * baseIntensity + (1 - baseIntensity), 0, 0.1 * baseIntensity,
          0, 0, 0, 1, 0,
        ];
      
      case 'warm':
        return [
          1.2 * baseIntensity + (1 - baseIntensity), 0, 0, 0, 0.1 * baseIntensity,
          0, 1.1 * baseIntensity + (1 - baseIntensity), 0, 0, 0.05 * baseIntensity,
          0, 0, 0.9 * baseIntensity + (1 - baseIntensity), 0, 0,
          0, 0, 0, 1, 0,
        ];
      
      case 'dramatic':
        return [
          1.3 * baseIntensity + (1 - baseIntensity), 0, 0, 0, -0.1 * baseIntensity,
          0, 1.1 * baseIntensity + (1 - baseIntensity), 0, 0, -0.05 * baseIntensity,
          0, 0, 0.8 * baseIntensity + (1 - baseIntensity), 0, -0.1 * baseIntensity,
          0, 0, 0, 1, 0,
        ];
      
      case 'blackAndWhite':
        return [
          0.299 * baseIntensity + (1 - baseIntensity), 0.587 * baseIntensity, 0.114 * baseIntensity, 0, 0,
          0.299 * baseIntensity, 0.587 * baseIntensity + (1 - baseIntensity), 0.114 * baseIntensity, 0, 0,
          0.299 * baseIntensity, 0.587 * baseIntensity, 0.114 * baseIntensity + (1 - baseIntensity), 0, 0,
          0, 0, 0, 1, 0,
        ];
      
      case 'vivid':
        return [
          1.4 * baseIntensity + (1 - baseIntensity), 0, 0, 0, 0.1 * baseIntensity,
          0, 1.3 * baseIntensity + (1 - baseIntensity), 0, 0, 0.05 * baseIntensity,
          0, 0, 1.2 * baseIntensity + (1 - baseIntensity), 0, 0.1 * baseIntensity,
          0, 0, 0, 1, 0,
        ];
      
      default:
        return [
          1, 0, 0, 0, 0,
          0, 1, 0, 0, 0,
          0, 0, 1, 0, 0,
          0, 0, 0, 1, 0,
        ];
    }
  };

  const colorMatrix = getColorMatrix(selectedFilter, filterIntensity);

  return (
    <View style={styles.container}>
      {/* Votre composant caméra */}
      <View style={styles.cameraContainer}>
        {children}
      </View>

      {/* Overlay du filtre en temps réel */}
      {selectedFilter !== 'none' && (
        <View style={StyleSheet.absoluteFill}>
          <Canvas style={styles.filterCanvas}>
            <Fill>
              <Paint>
                <ColorMatrix matrix={colorMatrix} />
              </Paint>
            </Fill>
          </Canvas>
        </View>
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
  filterCanvas: {
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