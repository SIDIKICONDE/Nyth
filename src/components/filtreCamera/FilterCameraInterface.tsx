import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';

import { cameraFiltersAPI } from '../../services/camera/filters/CameraFiltersAPI';
import type { FilterInfo, AdvancedFilterParams } from '../../../specs/NativeCameraFiltersModule';
import FilterPreviewGrid from '../filtreCamera/FilterPreviewGrid';
import AdvancedFilterControls from '../filtreCamera/AdvancedFilterControls';
import LUT3DPicker from '../filtreCamera/LUT3DPicker';
import FilterPresets from '../filtreCamera/FilterPresets';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FilterCameraInterfaceProps {
  visible: boolean;
  onClose: () => void;
  onFilterApplied?: (filterName: string, intensity: number, params?: AdvancedFilterParams) => void;
  currentImage?: string; // URI de l'image de preview
}

export const FilterCameraInterface: React.FC<FilterCameraInterfaceProps> = ({
  visible,
  onClose,
  onFilterApplied,
  currentImage,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [filterIntensity, setFilterIntensity] = useState(1.0);
  const [advancedParams, setAdvancedParams] = useState<AdvancedFilterParams>({
    brightness: 0,
    contrast: 1,
    saturation: 1,
    hue: 0,
    gamma: 1,
    warmth: 0,
    tint: 0,
    exposure: 0,
    shadows: 0,
    highlights: 0,
    vignette: 0,
    grain: 0,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLUT3D, setShowLUT3D] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [filters, setFilters] = useState<FilterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  // Animations
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Charger les filtres disponibles
  useEffect(() => {
    loadFilters();
  }, []);

  // Animation d'ouverture/fermeture
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const loadFilters = async () => {
    try {
      setLoading(true);
      const availableFilters = await cameraFiltersAPI.getAvailableFiltersDetailed();
      setFilters(availableFilters);
    } catch (error) {
      console.error('Erreur lors du chargement des filtres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSelect = useCallback((filterName: string) => {
    setSelectedFilter(filterName);
    
    // Réinitialiser l'intensité pour les nouveaux filtres
    if (filterName !== selectedFilter) {
      setFilterIntensity(1.0);
    }
  }, [selectedFilter]);

  const handleApplyFilter = useCallback(async () => {
    try {
      setApplying(true);
      
      if (selectedFilter === 'none') {
        await cameraFiltersAPI.clearFilter();
      } else {
        await cameraFiltersAPI.setFilterWithParams(
          selectedFilter,
          filterIntensity,
          advancedParams
        );
      }
      
      onFilterApplied?.(selectedFilter, filterIntensity, advancedParams);
      
      // Animation de fermeture
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (error) {
      console.error('Erreur lors de l\'application du filtre:', error);
    } finally {
      setApplying(false);
    }
  }, [selectedFilter, filterIntensity, advancedParams, onFilterApplied, onClose]);

  const handleLUT3DSelect = useCallback(async (lutPath: string) => {
    try {
      setApplying(true);
      await cameraFiltersAPI.setLUT3D(lutPath);
      setSelectedFilter('lut3d');
      setShowLUT3D(false);
      onFilterApplied?.('lut3d', 1.0, advancedParams);
    } catch (error) {
      console.error('Erreur lors de l\'application de la LUT:', error);
    } finally {
      setApplying(false);
    }
  }, [advancedParams, onFilterApplied]);

  const handlePresetSelect = useCallback((preset: any) => {
    setSelectedFilter(preset.filterName);
    setFilterIntensity(preset.intensity);
    setAdvancedParams(preset.params);
    setShowPresets(false);
  }, []);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Fond avec blur */}
      <BlurView 
        blurType="dark"
        blurAmount={30}
        style={StyleSheet.absoluteFillObject}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject} 
          onPress={onClose}
          activeOpacity={1}
        />
      </BlurView>

      {/* Interface principale */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Filtres</Text>
          
          <TouchableOpacity 
            onPress={handleApplyFilter} 
            style={styles.applyButton}
            disabled={applying}
          >
            {applying ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Icon name="checkmark" size={28} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Barre d'outils */}
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={[styles.toolButton, showAdvanced && styles.toolButtonActive]}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <MaterialIcon name="tune-vertical" size={24} color="#fff" />
            <Text style={styles.toolButtonText}>Avancé</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolButton]}
            onPress={() => setShowLUT3D(true)}
          >
            <MaterialIcon name="cube-outline" size={24} color="#fff" />
            <Text style={styles.toolButtonText}>LUT 3D</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolButton]}
            onPress={() => setShowPresets(true)}
          >
            <MaterialIcon name="star-outline" size={24} color="#fff" />
            <Text style={styles.toolButtonText}>Presets</Text>
          </TouchableOpacity>
        </View>

        {/* Contenu principal */}
        <ScrollView 
          style={styles.mainContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Chargement des filtres...</Text>
            </View>
          ) : (
            <>
              {/* Grille de preview des filtres */}
              <FilterPreviewGrid
                filters={filters}
                selectedFilter={selectedFilter}
                onFilterSelect={handleFilterSelect}
                previewImage={currentImage}
              />

              {/* Slider d'intensité */}
              {selectedFilter !== 'none' && (
                <View style={styles.intensityContainer}>
                  <Text style={styles.intensityLabel}>Intensité</Text>
                  <View style={styles.intensitySliderContainer}>
                    <Text style={styles.intensityValue}>0</Text>
                    <Slider
                      style={styles.intensitySlider}
                      value={filterIntensity}
                      onValueChange={setFilterIntensity}
                      minimumValue={0}
                      maximumValue={1}
                      minimumTrackTintColor="#007AFF"
                      maximumTrackTintColor="rgba(255,255,255,0.3)"
                      thumbTintColor="#fff"
                    />
                    <Text style={styles.intensityValue}>100</Text>
                  </View>
                  <Text style={styles.intensityPercentage}>
                    {Math.round(filterIntensity * 100)}%
                  </Text>
                </View>
              )}

              {/* Contrôles avancés */}
              {showAdvanced && (
                <AdvancedFilterControls
                  params={advancedParams}
                  onParamsChange={setAdvancedParams}
                />
              )}
            </>
          )}
        </ScrollView>

        {/* Modales */}
        {showLUT3D && (
          <LUT3DPicker
            visible={showLUT3D}
            onClose={() => setShowLUT3D(false)}
            onSelect={handleLUT3DSelect}
          />
        )}

        {showPresets && (
          <FilterPresets
            visible={showPresets}
            onClose={() => setShowPresets(false)}
            onSelect={handlePresetSelect}
          />
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: SCREEN_HEIGHT * 0.85,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 5,
  },
  applyButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolButtonActive: {
    backgroundColor: '#007AFF',
  },
  toolButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  intensityContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  intensityLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  intensitySliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intensitySlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  intensityValue: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  intensityPercentage: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 5,
  },
});

export default FilterCameraInterface;
