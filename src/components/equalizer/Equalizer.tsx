import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { EqualizerBand } from './components/EqualizerBand';
import { PresetSelector } from './components/PresetSelector';
import { SpectrumAnalyzer } from './components/SpectrumAnalyzer';
import { useEqualizer } from './hooks/useEqualizer';
import { useEqualizerPresets } from './hooks/useEqualizerPresets';
import { useSpectrumData } from './hooks/useSpectrumData';
import Slider from '@react-native-community/slider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EqualizerProps {
  numBands?: number;
  sampleRate?: number;
  showSpectrum?: boolean;
  onConfigChange?: (config: any) => void;
}

export const Equalizer: React.FC<EqualizerProps> = ({
  numBands = 10,
  sampleRate = 48000,
  showSpectrum = true,
  onConfigChange
}) => {
  const { currentTheme } = useTheme();
  const {
    isInitialized,
    enabled,
    masterGain,
    bands,
    isProcessing,
    toggleEnabled,
    setBandGain,
    updateMasterGain,
    resetAllBands,
    updateAllBandGains,
    getConfig
  } = useEqualizer(numBands, sampleRate);

  const {
    presets,
    currentPreset,
    applyPreset,
    saveCustomPreset,
    deleteCustomPreset,
    isCustomPreset
  } = useEqualizerPresets();

  const {
    isAnalyzing,
    spectrumData,
    toggleAnalysis
  } = useSpectrumData({
    updateInterval: 50,
    smoothingFactor: 0.8
  });

  // Gérer la sélection de preset
  const handlePresetSelect = useCallback(async (presetName: string) => {
    const gains = await applyPreset(presetName);
    if (gains) {
      await updateAllBandGains(gains);
    }
  }, [applyPreset, updateAllBandGains]);

  // Sauvegarder un preset personnalisé
  const handleSavePreset = useCallback(async (name: string) => {
    const currentGains = bands.map(band => band.gain);
    return await saveCustomPreset(name, currentGains);
  }, [bands, saveCustomPreset]);

  // Notifier les changements de configuration
  React.useEffect(() => {
    if (onConfigChange && isInitialized) {
      onConfigChange(getConfig());
    }
  }, [enabled, masterGain, bands, isInitialized, getConfig, onConfigChange]);

  // Calculer la largeur optimale pour les bandes
  const bandContainerWidth = useMemo(() => {
    const padding = 40;
    const bandWidth = 60;
    const totalWidth = numBands * bandWidth;
    return Math.max(totalWidth, SCREEN_WIDTH - padding);
  }, [numBands]);

  if (!isInitialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.colors.background }]}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
        <Text style={[styles.loadingText, { color: currentTheme.colors.textSecondary }]}>
          Initialisation de l'égaliseur...
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={currentTheme.isDark 
        ? ['#1a1a2e', '#16213e', '#0f3460']
        : ['#f8f9fa', '#e9ecef', '#dee2e6']
      }
      style={styles.container}
    >
      {/* En-tête */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="equalizer" size={28} color={currentTheme.colors.primary} />
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>
            Égaliseur Professionnel
          </Text>
        </View>
        
        <View style={styles.controls}>
          <Switch
            value={enabled}
            onValueChange={toggleEnabled}
            trackColor={{ 
              false: currentTheme.colors.surface, 
              true: currentTheme.colors.primary + '60' 
            }}
            thumbColor={enabled ? currentTheme.colors.primary : currentTheme.colors.textSecondary}
          />
        </View>
      </View>

      {/* Sélecteur de presets */}
      <View style={styles.presetSection}>
        <PresetSelector
          presets={presets}
          currentPreset={currentPreset}
          onPresetSelect={handlePresetSelect}
          onSavePreset={handleSavePreset}
          onDeletePreset={deleteCustomPreset}
          isCustomPreset={isCustomPreset}
          currentGains={bands.map(b => b.gain)}
        />
      </View>

      {/* Analyseur de spectre */}
      {showSpectrum && (
        <View style={styles.spectrumSection}>
          <View style={styles.spectrumHeader}>
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              Analyse Spectrale
            </Text>
            <Pressable
              style={[
                styles.spectrumToggle,
                {
                  backgroundColor: isAnalyzing 
                    ? currentTheme.colors.primary 
                    : currentTheme.colors.surface
                }
              ]}
              onPress={toggleAnalysis}
            >
              <Icon 
                name={isAnalyzing ? "pause" : "play-arrow"} 
                size={16} 
                color={isAnalyzing ? '#FFFFFF' : currentTheme.colors.text} 
              />
            </Pressable>
          </View>
          
          <View style={[styles.spectrumContainer, { backgroundColor: currentTheme.colors.card }]}>
            <SpectrumAnalyzer
              data={spectrumData}
              width={SCREEN_WIDTH - 60}
              height={100}
              animate={true}
            />
          </View>
        </View>
      )}

      {/* Bandes d'égalisation */}
      <View style={styles.bandsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.bandsContainer,
            { minWidth: bandContainerWidth }
          ]}
        >
          {bands.map((band, index) => (
            <EqualizerBand
              key={`band-${index}`}
              bandIndex={index}
              config={band}
              onGainChange={setBandGain}
              isProcessing={isProcessing}
              height={180}
            />
          ))}
        </ScrollView>
      </View>

      {/* Contrôles du bas */}
      <View style={[styles.bottomControls, { backgroundColor: currentTheme.colors.card }]}>
        {/* Gain master */}
        <View style={styles.masterGainSection}>
          <View style={styles.masterGainHeader}>
            <Text style={[styles.controlLabel, { color: currentTheme.colors.text }]}>
              Gain Master
            </Text>
            <Text style={[styles.gainValue, { color: currentTheme.colors.primary }]}>
              {masterGain > 0 ? '+' : ''}{masterGain.toFixed(1)} dB
            </Text>
          </View>
          
          <Slider
            style={styles.masterSlider}
            minimumValue={-24}
            maximumValue={24}
            value={masterGain}
            onValueChange={updateMasterGain}
            minimumTrackTintColor={currentTheme.colors.primary}
            maximumTrackTintColor={currentTheme.colors.surface}
            thumbTintColor={currentTheme.colors.primary}
          />
        </View>

        {/* Bouton reset */}
        <Pressable
          style={[
            styles.resetButton,
            {
              backgroundColor: currentTheme.colors.surface,
              opacity: isProcessing ? 0.5 : 1
            }
          ]}
          onPress={resetAllBands}
          disabled={isProcessing}
        >
          <Icon name="refresh" size={20} color={currentTheme.colors.text} />
          <Text style={[styles.resetText, { color: currentTheme.colors.text }]}>
            Réinitialiser
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  spectrumSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  spectrumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  spectrumToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spectrumContainer: {
    padding: 10,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      }
    })
  },
  bandsSection: {
    flex: 1,
    marginBottom: 20,
  },
  bandsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      }
    })
  },
  masterGainSection: {
    marginBottom: 16,
  },
  masterGainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  gainValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  masterSlider: {
    height: 40,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '500',
  }
});
