/**
 * Exemple complet d'une app photo/vidéo avec l'interface Filtres Pro
 * Montre comment basculer dynamiquement entre modes photo et vidéo
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// Interface Pro
import { FilterCameraInterfacePro } from '../FilterCameraInterfacePro';
import { cameraFiltersAPI } from '../../../services/camera/filters/CameraFiltersAPI';
import type { AdvancedFilterParams } from '../../../../specs/NativeCameraFiltersModule';

// Placeholder pour la caméra (remplacer par react-native-vision-camera)
const CameraView: React.FC<{
  type: 'photo' | 'video';
  onCapture: () => void;
  isRecording?: boolean;
}> = ({ type, onCapture, isRecording }) => (
  <View style={styles.cameraContainer}>
    <View style={styles.cameraPlaceholder}>
      <MaterialIcon
        name={type === 'photo' ? 'camera' : 'video'}
        size={64}
        color="#666"
      />
      <Text style={styles.cameraPlaceholderText}>
        {type === 'photo' ? '📸 Mode Photo' : '🎬 Mode Vidéo'}
      </Text>
      <Text style={styles.cameraPlaceholderSubtext}>
        Remplacer par react-native-vision-camera
      </Text>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>ENREGISTREMENT</Text>
        </View>
      )}
    </View>

    {/* Bouton capture */}
    <TouchableOpacity
      style={[styles.captureButton, isRecording && styles.recordingButton]}
      onPress={onCapture}
      activeOpacity={0.8}
    >
      <View style={styles.captureButtonInner} />
    </TouchableOpacity>
  </View>
);

export default function PhotoVideoFiltersApp() {
  const insets = useSafeAreaInsets();
  const [currentMode, setCurrentMode] = useState<'photo' | 'video'>('photo');
  const [showFilters, setShowFilters] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // État des filtres
  const [activeFilter, setActiveFilter] = useState<{
    name: string;
    intensity: number;
    params?: AdvancedFilterParams;
  } | null>(null);

  // Timer pour la vidéo
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // Basculement entre photo et vidéo
  const toggleMode = useCallback(() => {
    if (isRecording) {
      Alert.alert('Enregistrement en cours', 'Arrêtez l\'enregistrement avant de changer de mode.');
      return;
    }

    setCurrentMode(current => current === 'photo' ? 'video' : 'photo');
    setActiveFilter(null); // Reset filtres
  }, [isRecording]);

  // Gestion de la capture
  const handleCapture = useCallback(() => {
    if (currentMode === 'photo') {
      // Simulation capture photo
      console.log('📸 Photo capturée avec filtre:', activeFilter?.name || 'aucun');

      // Appliquer le filtre si actif
      if (activeFilter && activeFilter.name !== 'none') {
        cameraFiltersAPI.setFilterWithParams(
          activeFilter.name,
          activeFilter.intensity,
          activeFilter.params
        );
      }

      Alert.alert('✅ Photo capturée !', `Filtre appliqué: ${activeFilter?.name || 'Aucun'}`);

    } else {
      // Toggle enregistrement vidéo
      if (!isRecording) {
        startRecording();
      } else {
        stopRecording();
      }
    }
  }, [currentMode, activeFilter, isRecording]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingDuration(0);

    // Simulation timer
    recordingTimer.current = setInterval(() => {
      setRecordingDuration(prev => {
        if (prev >= 30) { // Limite 30s pour démo
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    console.log('🎬 Début enregistrement vidéo');
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    clearInterval(recordingTimer.current);

    console.log('🎬 Fin enregistrement vidéo - Durée:', recordingDuration, 's');

    // Appliquer le filtre vidéo si actif
    if (activeFilter && activeFilter.name !== 'none') {
      cameraFiltersAPI.setFilterWithParams(
        activeFilter.name,
        activeFilter.intensity,
        activeFilter.params
      );
    }

    Alert.alert('✅ Vidéo enregistrée !',
      `Durée: ${recordingDuration}s\nFiltre: ${activeFilter?.name || 'Aucun'}`
    );

    setRecordingDuration(0);
  }, [recordingDuration, activeFilter]);

  // Callback quand un filtre est appliqué
  const handleFilterApplied = useCallback((
    filterName: string,
    intensity: number,
    params?: AdvancedFilterParams
  ) => {
    console.log('🎨 Filtre appliqué:', filterName, intensity);

    setActiveFilter({
      name: filterName,
      intensity,
      params,
    });

    // Pour la vidéo, adapter les paramètres en temps réel
    if (currentMode === 'video' && isRecording) {
      cameraFiltersAPI.setFilterWithParams(filterName, intensity, params);
    }
  }, [currentMode, isRecording]);

  // Callback spécial pour changements de filtres vidéo
  const handleVideoFilterChange = useCallback((filterConfig: any) => {
    console.log('🎬 Configuration vidéo mise à jour:', filterConfig);

    // Adapter les paramètres selon la durée d'enregistrement
    const adaptedConfig = {
      ...filterConfig,
      // Réduire le grain pour éviter le bruit vidéo
      grain: Math.min(filterConfig.grain || 0, 0.3),
      // Adapter le vignettage pour éviter les artefacts
      vignette: Math.min(filterConfig.vignette || 0, 0.4),
    };

    cameraFiltersAPI.setFilterWithParams(
      filterConfig.name,
      filterConfig.intensity,
      adaptedConfig
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header avec contrôles de mode */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.appTitle}>🎨 Filtres Pro</Text>

        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              currentMode === 'photo' && styles.activeModeButton
            ]}
            onPress={() => !isRecording && setCurrentMode('photo')}
            disabled={isRecording}
          >
            <Icon name="camera" size={20} color={currentMode === 'photo' ? '#fff' : '#666'} />
            <Text style={[
              styles.modeButtonText,
              currentMode === 'photo' && styles.activeModeButtonText
            ]}>
              Photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              currentMode === 'video' && styles.activeModeButton
            ]}
            onPress={() => !isRecording && setCurrentMode('video')}
            disabled={isRecording}
          >
            <Icon name="videocam" size={20} color={currentMode === 'video' ? '#fff' : '#666'} />
            <Text style={[
              styles.modeButtonText,
              currentMode === 'video' && styles.activeModeButtonText
            ]}>
              Vidéo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Vue caméra principale */}
      <View style={styles.cameraWrapper}>
        <CameraView
          type={currentMode}
          onCapture={handleCapture}
          isRecording={isRecording}
        />

        {/* Indicateur de filtre actif */}
        {activeFilter && activeFilter.name !== 'none' && (
          <View style={styles.activeFilterIndicator}>
            <MaterialIcon name="filter" size={16} color="#007AFF" />
            <Text style={styles.activeFilterText}>
              {activeFilter.name} • {Math.round(activeFilter.intensity * 100)}%
            </Text>
            {currentMode === 'video' && (
              <View style={styles.realtimeIndicator}>
                <MaterialIcon name="sync" size={12} color="#00FF88" />
              </View>
            )}
          </View>
        )}

        {/* Durée d'enregistrement vidéo */}
        {isRecording && (
          <View style={styles.recordingDuration}>
            <MaterialIcon name="record-rec" size={16} color="#FF3B30" />
            <Text style={styles.durationText}>
              {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        )}
      </View>

      {/* Contrôles inférieurs */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowFilters(true)}
        >
          <MaterialIcon name="filter-variant" size={28} color="#fff" />
          <Text style={styles.controlButtonText}>Filtres</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => console.log('🎨 Mode créatif activé')}
        >
          <MaterialIcon name="palette" size={28} color="#fff" />
          <Text style={styles.controlButtonText}>Créatif</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => console.log('⚙️ Paramètres')}
        >
          <Icon name="settings-outline" size={28} color="#fff" />
          <Text style={styles.controlButtonText}>Réglages</Text>
        </TouchableOpacity>
      </View>

      {/* Interface de filtres Pro */}
      <FilterCameraInterfacePro
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        contentType={currentMode}
        isVideoRecording={isRecording}
        videoDuration={recordingDuration}
        previewMode={currentMode === 'video' ? 'realtime' : 'static'}
        enableExpertMode={true}
        onFilterApplied={handleFilterApplied}
        onVideoFilterChange={handleVideoFilterChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  activeModeButton: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  activeModeButtonText: {
    color: '#fff',
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  cameraPlaceholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
  cameraPlaceholderSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  recordingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  recordingButton: {
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  activeFilterIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  activeFilterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  realtimeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF88',
  },
  recordingDuration: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  durationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlButton: {
    alignItems: 'center',
    padding: 10,
    gap: 4,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
