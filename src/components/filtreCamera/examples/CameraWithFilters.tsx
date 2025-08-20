/**
 * Exemple d'intégration de l'interface de filtres avec une caméra
 * Cet exemple montre comment utiliser FilterCameraInterface dans un contexte réel
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterCameraInterface } from '../FilterCameraInterface';
import { cameraFiltersAPI } from '../../../services/camera/filters/CameraFiltersAPI';
import type { AdvancedFilterParams } from '../../../../specs/NativeCameraFiltersModule';

export default function CameraWithFilters() {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);
  
  // États de la caméra
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const [flash, setFlash] = useState(FlashMode.off);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // États des filtres
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<{
    name: string;
    intensity: number;
    params?: AdvancedFilterParams;
  } | null>(null);
  const [filterCapabilities, setFilterCapabilities] = useState<any>(null);
  
  // État de preview
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);

  // Demander les permissions
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
      
      // Charger les capacités des filtres
      try {
        const caps = await cameraFiltersAPI.getCapabilities();
        setFilterCapabilities(caps);
        
        // Configurer la performance selon l'appareil
        const threadCount = caps.availableProcessors.includes('VULKAN') ? 8 : 4;
        await cameraFiltersAPI.setPerformanceConfig({
          parallelProcessing: true,
          threadPoolSize: threadCount,
        });
      } catch (error) {
        console.error('Erreur configuration filtres:', error);
      }
    })();
  }, []);

  // Prendre une photo
  const takePicture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;
    
    try {
      setIsCapturing(true);
      
      // Capturer la photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false, // Laisser false pour appliquer les filtres
      });
      
      setLastPhoto(photo.uri);
      
      // Sauvegarder dans la galerie
      const asset = await MediaLibrary.createAssetAsync(photo.uri);
      
      // Créer un album Nyth si nécessaire
      const album = await MediaLibrary.getAlbumAsync('Nyth');
      if (!album) {
        await MediaLibrary.createAlbumAsync('Nyth', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      
      // Feedback visuel
      Alert.alert(
        'Photo sauvegardée',
        activeFilter 
          ? `Filtre "${activeFilter.name}" appliqué avec succès!`
          : 'Photo enregistrée dans votre galerie',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Erreur capture photo:', error);
      Alert.alert('Erreur', 'Impossible de capturer la photo');
    } finally {
      setIsCapturing(false);
    }
  }, [activeFilter, isCapturing]);

  // Basculer la caméra
  const toggleCameraType = useCallback(() => {
    setType(current => 
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  }, []);

  // Basculer le flash
  const toggleFlash = useCallback(() => {
    setFlash(current => {
      switch (current) {
        case FlashMode.off:
          return FlashMode.on;
        case FlashMode.on:
          return FlashMode.auto;
        default:
          return FlashMode.off;
      }
    });
  }, []);

  // Callback quand un filtre est appliqué
  const handleFilterApplied = useCallback((
    filterName: string,
    intensity: number,
    params?: AdvancedFilterParams
  ) => {
    setActiveFilter(
      filterName === 'none' 
        ? null 
        : { name: filterName, intensity, params }
    );
    
    // Configurer le format vidéo si nécessaire
    cameraFiltersAPI.setVideoFormat({
      width: 1920,
      height: 1080,
      pixelFormat: 'bgra',
      frameRate: 30,
    });
  }, []);

  // Obtenir l'icône du flash
  const getFlashIcon = () => {
    switch (flash) {
      case FlashMode.on:
        return 'flash';
      case FlashMode.auto:
        return 'flash-outline';
      default:
        return 'flash-off';
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.noPermissionText}>
          Pas d'accès à la caméra
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={() => Camera.requestCameraPermissionsAsync()}
        >
          <Text style={styles.permissionButtonText}>
            Autoriser l'accès
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera 
        ref={cameraRef}
        style={styles.camera} 
        type={type}
        flashMode={flash}
      >
        {/* Header avec contrôles */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={toggleFlash}
          >
            <Ionicons name={getFlashIcon()} size={24} color="#fff" />
          </TouchableOpacity>

          {/* Indicateur de filtre actif */}
          {activeFilter && (
            <View style={styles.activeFilterBadge}>
              <MaterialCommunityIcons name="filter" size={16} color="#fff" />
              <Text style={styles.activeFilterText}>
                {activeFilter.name}
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.headerButton}
            onPress={toggleCameraType}
          >
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Contrôles du bas */}
        <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
          {/* Bouton galerie */}
          <TouchableOpacity style={styles.sideButton}>
            <Ionicons name="images" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Bouton capture */}
          <TouchableOpacity 
            style={[styles.captureButton, isCapturing && styles.captureButtonActive]}
            onPress={takePicture}
            disabled={isCapturing}
          >
            <View style={styles.captureButtonInner}>
              {isCapturing && (
                <ActivityIndicator 
                  size="large" 
                  color="#fff" 
                  style={StyleSheet.absoluteFillObject}
                />
              )}
            </View>
          </TouchableOpacity>

          {/* Bouton filtres */}
          <TouchableOpacity 
            style={[styles.sideButton, activeFilter && styles.sideButtonActive]}
            onPress={() => setShowFilters(true)}
          >
            <MaterialCommunityIcons name="filter-variant" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Info sur les capacités */}
        {filterCapabilities && (
          <View style={styles.infoOverlay}>
            <Text style={styles.infoText}>
              {filterCapabilities.currentProcessor} • 
              {filterCapabilities.parallelProcessingEnabled ? ' Parallel' : ' Single'} • 
              {filterCapabilities.threadPoolSize} threads
            </Text>
          </View>
        )}
      </Camera>

      {/* Interface de filtres */}
      <FilterCameraInterface
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onFilterApplied={handleFilterApplied}
        currentImage={lastPhoto || undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeFilterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sideButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.5)',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 4,
  },
  captureButtonActive: {
    transform: [{ scale: 0.9 }],
  },
  captureButtonInner: {
    flex: 1,
    borderRadius: 36,
    backgroundColor: '#fff',
  },
  infoOverlay: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  infoText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  noPermissionText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
