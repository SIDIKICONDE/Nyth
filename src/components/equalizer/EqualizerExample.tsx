/**
 * Exemple d'utilisation complet du module Equalizer
 *
 * Ce composant démontre comment intégrer l'égaliseur dans une application
 * avec toutes ses fonctionnalités avancées.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { Equalizer } from './Equalizer';
import { AdvancedEqualizer } from './AdvancedEqualizer';
import { useEqualizer } from './hooks/useEqualizer';
import { useEqualizerPresets } from './hooks/useEqualizerPresets';
import { useSpectrumData } from './hooks/useSpectrumData';
import { useNoiseReduction } from './hooks/useNoiseReduction';
import { useAudioSafety } from './hooks/useAudioSafety';
import { useAudioEffects } from './hooks/useAudioEffects';
import { EqualizerConfig } from './types';

const EqualizerExample: React.FC = () => {
  const [activeView, setActiveView] = useState<'basic' | 'advanced'>('basic');
  const [isLoading, setIsLoading] = useState(true);

  // Hook pour l'égaliseur de base
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
  } = useEqualizer(10, 48000);

  // Hook pour les presets
  const {
    presets,
    currentPreset,
    applyPreset,
    saveCustomPreset,
    deleteCustomPreset,
    isCustomPreset
  } = useEqualizerPresets();

  // Hook pour l'analyse spectrale
  const {
    isAnalyzing,
    spectrumData,
    startAnalysis,
    stopAnalysis,
    toggleAnalysis,
    getMetrics
  } = useSpectrumData({
    updateInterval: 50,
    smoothingFactor: 0.8
  });

  // Hook pour la réduction de bruit
  const {
    isEnabled: nrEnabled,
    mode: nrMode,
    rnnoiseAggressiveness,
    config: nrConfig,
    toggleEnabled: toggleNR,
    changeMode: changeNRMode,
    setAggressiveness,
    updateConfig: updateNRConfig
  } = useNoiseReduction();

  // Hook pour la sécurité audio
  const {
    config: safetyConfig,
    report: safetyReport,
    updateConfig: updateSafetyConfig,
    getMetrics: getSafetyMetrics
  } = useAudioSafety(100);

  // Hook pour les effets
  const {
    isEnabled: fxEnabled,
    compressor,
    delay,
    toggleEnabled: toggleFX,
    updateCompressor,
    updateDelay,
    resetEffects
  } = useAudioEffects();

  // Gestionnaire pour les changements de configuration
  const handleConfigChange = (config: EqualizerConfig) => {
    console.log('Configuration mise à jour:', config);
  };

  // Gestionnaire pour sauvegarder un preset personnalisé
  const handleSavePreset = async (name: string) => {
    const currentGains = bands.map(band => band.gain);
    const success = await saveCustomPreset(name, currentGains);

    if (success) {
      Alert.alert(
        'Succès',
        `Preset "${name}" sauvegardé avec succès !`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Erreur',
        'Impossible de sauvegarder le preset.',
        [{ text: 'OK' }]
      );
    }
  };

  // Effet d'initialisation
  useEffect(() => {
    const initialize = async () => {
      try {
        // Attendre que l'égaliseur soit initialisé
        await new Promise(resolve => setTimeout(resolve, 500));

        // Démarrer l'analyse spectrale automatiquement
        await startAnalysis();

        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        setIsLoading(false);
      }
    };

    initialize();
  }, [startAnalysis]);

  // Effet de nettoyage
  useEffect(() => {
    return () => {
      if (isAnalyzing) {
        stopAnalysis();
      }
    };
  }, [isAnalyzing, stopAnalysis]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initialisation de l'égaliseur...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* En-tête avec sélecteur de vue */}
      <View style={styles.header}>
        <Text style={styles.title}>🎵 Égaliseur Audio Professionnel</Text>

        <View style={styles.viewSelector}>
          <Text
            style={[
              styles.viewOption,
              activeView === 'basic' && styles.viewOptionActive
            ]}
            onPress={() => setActiveView('basic')}
          >
            Égaliseur de Base
          </Text>
          <Text
            style={[
              styles.viewOption,
              activeView === 'advanced' && styles.viewOptionActive
            ]}
            onPress={() => setActiveView('advanced')}
          >
            Égaliseur Avancé
          </Text>
        </View>
      </View>

      {/* Informations sur l'état */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          État: {enabled ? '✅ Actif' : '❌ Inactif'} | {isProcessing ? '⏳ Traitement...' : '✅ Prêt'}
        </Text>
        <Text style={styles.statusText}>
          Preset: {currentPreset} | Gain Master: {masterGain > 0 ? '+' : ''}{masterGain}dB
        </Text>
        {isAnalyzing && (
          <Text style={styles.statusText}>
            Spectre: {spectrumData.magnitudes.length} points | Peak: {getMetrics().peak.toFixed(2)}
          </Text>
        )}
      </View>

      {/* Vue de base */}
      {activeView === 'basic' && (
        <View style={styles.equalizerContainer}>
          <Equalizer
            numBands={10}
            sampleRate={48000}
            showSpectrum={true}
            onConfigChange={handleConfigChange}
          />

          {/* Contrôles supplémentaires pour la vue de base */}
          <View style={styles.controlsContainer}>
            <Text style={styles.sectionTitle}>Contrôles Rapides</Text>

            <View style={styles.quickControls}>
              <Text style={styles.controlButton} onPress={toggleEnabled}>
                {enabled ? '🔇 Désactiver' : '🔊 Activer'}
              </Text>
              <Text style={styles.controlButton} onPress={resetAllBands}>
                🔄 Réinitialiser
              </Text>
              <Text style={styles.controlButton} onPress={toggleAnalysis}>
                {isAnalyzing ? '📊 Stop Spectre' : '📊 Start Spectre'}
              </Text>
            </View>

            <View style={styles.presetControls}>
              <Text style={styles.sectionTitle}>Presets Rapides</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetList}>
                {presets.slice(0, 5).map((preset) => (
                  <Text
                    key={preset.name}
                    style={styles.presetButton}
                    onPress={() => applyPreset(preset.name)}
                  >
                    {preset.name}
                  </Text>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      )}

      {/* Vue avancée */}
      {activeView === 'advanced' && (
        <View style={styles.equalizerContainer}>
          <AdvancedEqualizer />

          {/* Informations avancées */}
          <View style={styles.advancedInfo}>
            <Text style={styles.sectionTitle}>Informations Avancées</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Réduction Bruit:</Text>
                <Text style={styles.infoValue}>
                  {nrEnabled ? `${nrMode} (${rnnoiseAggressiveness.toFixed(1)})` : 'Désactivée'}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Sécurité:</Text>
                <Text style={styles.infoValue}>
                  {safetyConfig.enabled ? 'Active' : 'Inactive'}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Effets:</Text>
                <Text style={styles.infoValue}>
                  {fxEnabled ? 'Actifs' : 'Inactifs'}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Compresseur:</Text>
                <Text style={styles.infoValue}>
                  {compressor.thresholdDb}dB, {compressor.ratio}:1
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Section d'aide */}
      <View style={styles.helpContainer}>
        <Text style={styles.helpTitle}>📖 Guide d'utilisation</Text>

        <View style={styles.helpSection}>
          <Text style={styles.helpSubtitle}>Égaliseur de Base:</Text>
          <Text style={styles.helpText}>
            • Glissez les curseurs pour ajuster les bandes de fréquence{'\n'}
            • Utilisez les presets pour des réglages prédéfinis{'\n'}
            • Le spectre montre la répartition des fréquences en temps réel
          </Text>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpSubtitle}>Égaliseur Avancé:</Text>
          <Text style={styles.helpText}>
            • Réduction de bruit: Choisissez entre expander et RNNoise{'\n'}
            • Sécurité audio: Protection contre les crêtes et le feedback{'\n'}
            • Effets créatifs: Compresseur et delay pour enrichir le son
          </Text>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpSubtitle}>Astuces:</Text>
          <Text style={styles.helpText}>
            • Sauvegardez vos réglages en presets personnalisés{'\n'}
            • Utilisez la réinitialisation pour repartir d'une base neutre{'\n'}
            • Le gain master contrôle le volume global de l'égaliseur
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      }
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    padding: 4,
  },
  viewOption: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    borderRadius: 21,
  },
  viewOptionActive: {
    backgroundColor: '#007AFF',
    color: '#fff',
  },
  statusContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      }
    }),
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  equalizerContainer: {
    flex: 1,
  },
  controlsContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      }
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  quickControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  controlButton: {
    backgroundColor: '#007AFF',
    color: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  presetControls: {
    marginTop: 10,
  },
  presetList: {
    marginTop: 10,
  },
  presetButton: {
    backgroundColor: '#f0f0f0',
    color: '#333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  advancedInfo: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      }
    }),
  },
  infoGrid: {
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  helpContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    marginBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      }
    }),
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  helpSection: {
    marginBottom: 15,
  },
  helpSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 5,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default EqualizerExample;
