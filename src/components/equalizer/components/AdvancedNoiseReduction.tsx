import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNoiseReduction } from '../hooks/useNoiseReduction';


interface AdvancedNoiseReductionProps {
  isVisible: boolean;
  onClose: () => void;
}

export const AdvancedNoiseReduction: React.FC<AdvancedNoiseReductionProps> = ({
  isVisible,
  onClose,
}) => {
  const { currentTheme } = useTheme();
  const {
    useAdvanced,
    advancedConfig,
    toggleAdvancedMode,
    setAdvancedMode,
    toggleAdvancedEnabled,
    fetchAdvancedMetrics,
    fetchNoiseSpectrum,
    fetchSpeechProbability,
    startAdvancedMonitoring,
    stopAdvancedMonitoring,
    clearPendingUpdates,
    ADVANCED_NR_MODES,
  } = useNoiseReduction();

  const modes = ADVANCED_NR_MODES;

  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metrics, setMetrics] = useState({
    snr: 0,
    noiseBins: 0,
    speechBins: 0,
  });

  const loadAllMetrics = async () => {
    if (isLoadingMetrics) return;

    setIsLoadingMetrics(true);
    try {
      const [snr] = await Promise.all([
        fetchAdvancedMetrics(),
        fetchNoiseSpectrum(512),
        fetchSpeechProbability(512),
      ]);

      // Calculer des métriques utiles
      const noiseSpectrum = await fetchNoiseSpectrum(512);
      const speechProb = await fetchSpeechProbability(512);

      setMetrics({
        snr: advancedConfig.currentSNR,
        noiseBins: noiseSpectrum.filter(v => v > 0.01).length,
        speechBins: speechProb.filter(v => v > 0.5).length,
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  // Charger les métriques au montage
  useEffect(() => {
    if (isVisible && useAdvanced && advancedConfig.enabled) {
      loadAllMetrics();
      startAdvancedMonitoring(200); // Mise à jour toutes les 200ms
    }

    return () => {
      stopAdvancedMonitoring();
    };
  }, [isVisible, useAdvanced, advancedConfig.enabled, loadAllMetrics, startAdvancedMonitoring, stopAdvancedMonitoring]);

  const getAlgorithmInfo = (mode: number) => {
    switch (mode) {
      case modes.STANDARD:
        return {
          name: 'Standard',
          description: 'Réduction de bruit classique (NoiseReducer + SpectralNR)',
          quality: 'Bonne',
          latency: 'Faible',
        };
      case modes.IMCRA:
        return {
          name: 'IMCRA',
          description:
            'Improved Minima Controlled Recursive Averaging - Estimation précise du bruit',
          quality: 'Excellente',
          latency: 'Moyenne',
        };
      case modes.WIENER:
        return {
          name: 'Wiener MMSE-LSA',
          description: 'Filtre de Wiener adaptatif avec estimation spectrale optimale',
          quality: 'Excellente',
          latency: 'Moyenne',
        };
      case modes.TWOSTEP:
        return {
          name: 'Two-Step NR',
          description: 'Réduction en deux étapes pour suppression maximale',
          quality: 'Excellente',
          latency: 'Élevée',
        };
      case modes.MULTIBAND:
        return {
          name: 'Multiband',
          description: 'Traitement multi-bandes perceptuel avec gammatone',
          quality: 'Excellente',
          latency: 'Élevée',
        };
      default:
        return { name: 'Inconnu', description: '', quality: '', latency: '' };
    }
  };

  const handleModeChange = async (modeValue: number) => {
    const modeKey = Object.keys(modes).find(
      key => modes[key as keyof typeof modes] === modeValue
    ) as keyof typeof modes;
    Alert.alert(
      "Changer d'algorithme",
      `Voulez-vous passer à ${getAlgorithmInfo(modeValue).name} ?\n\n${
        getAlgorithmInfo(modeValue).description
      }`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            await setAdvancedMode(modeKey);
            // Recharger les métriques après le changement
            setTimeout(loadAllMetrics, 500);
          },
        },
      ]
    );
  };

  if (!isVisible) return null;

  const currentAlgo = getAlgorithmInfo(advancedConfig.advancedMode);

  return (
    <View style={[styles.overlay, { backgroundColor: currentTheme.colors.background + 'F0' }]}>
      <View style={[styles.container, { backgroundColor: currentTheme.colors.card }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Icon name='science' size={24} color={currentTheme.colors.primary} />
            <Text style={[styles.title, { color: currentTheme.colors.text }]}>
              Réduction de Bruit Avancée
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Icon name='close' size={24} color={currentTheme.colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Toggle Système Avancé */}
          <View style={[styles.section, { backgroundColor: currentTheme.colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
                Système Avancé
              </Text>
              <Pressable
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: useAdvanced
                      ? currentTheme.colors.primary
                      : currentTheme.colors.surface,
                  },
                ]}
                onPress={toggleAdvancedMode}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: useAdvanced ? '#FFFFFF' : currentTheme.colors.text },
                  ]}
                >
                  {useAdvanced ? 'Activé' : 'Désactivé'}
                </Text>
              </Pressable>
            </View>

            {useAdvanced && (
              <View style={styles.advancedControls}>
                <Text style={[styles.description, { color: currentTheme.colors.textSecondary }]}>
                  Utilise les algorithmes avancés de réduction de bruit avec métriques temps réel
                </Text>

                <Pressable
                  style={[
                    styles.enableButton,
                    {
                      backgroundColor: advancedConfig.enabled
                        ? currentTheme.colors.primary
                        : currentTheme.colors.surface,
                      borderColor: advancedConfig.enabled
                        ? currentTheme.colors.primary
                        : currentTheme.colors.border,
                    },
                  ]}
                  onPress={toggleAdvancedEnabled}
                >
                  <Icon
                    name={advancedConfig.enabled ? 'check-circle' : 'radio-button-unchecked'}
                    size={20}
                    color={advancedConfig.enabled ? '#FFFFFF' : currentTheme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.enableButtonText,
                      { color: advancedConfig.enabled ? '#FFFFFF' : currentTheme.colors.text },
                    ]}
                  >
                    {advancedConfig.enabled ? 'Actif' : 'Inactif'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Sélection d'Algorithme */}
          {useAdvanced && (
            <View style={[styles.section, { backgroundColor: currentTheme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
                Algorithme
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.algorithmList}
              >
                {Object.entries(modes).map(([key, value]) => {
                  const isSelected = advancedConfig.advancedMode === value;
                  const info = getAlgorithmInfo(value);

                  return (
                    <Pressable
                      key={key}
                      style={[
                        styles.algorithmCard,
                        {
                          backgroundColor: isSelected
                            ? currentTheme.colors.primary + '20'
                            : currentTheme.colors.background,
                          borderColor: isSelected
                            ? currentTheme.colors.primary
                            : currentTheme.colors.border,
                        },
                      ]}
                      onPress={() => handleModeChange(value)}
                    >
                      <Text
                        style={[
                          styles.algorithmName,
                          {
                            color: isSelected
                              ? currentTheme.colors.primary
                              : currentTheme.colors.text,
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}
                      >
                        {info.name}
                      </Text>
                      <Text
                        style={[
                          styles.algorithmQuality,
                          {
                            color: isSelected
                              ? currentTheme.colors.primary
                              : currentTheme.colors.textSecondary,
                          },
                        ]}
                      >
                        {info.quality}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Description de l'algorithme actuel */}
              <View style={styles.algorithmInfo}>
                <Text style={[styles.algorithmTitle, { color: currentTheme.colors.text }]}>
                  {currentAlgo.name}
                </Text>
                <Text
                  style={[
                    styles.algorithmDescription,
                    { color: currentTheme.colors.textSecondary },
                  ]}
                >
                  {currentAlgo.description}
                </Text>
                <View style={styles.algorithmMetrics}>
                  <Text style={[styles.metric, { color: currentTheme.colors.textSecondary }]}>
                    Qualité: {currentAlgo.quality}
                  </Text>
                  <Text style={[styles.metric, { color: currentTheme.colors.textSecondary }]}>
                    Latence: {currentAlgo.latency}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Métriques Temps Réel */}
          {useAdvanced && advancedConfig.enabled && (
            <View style={[styles.section, { backgroundColor: currentTheme.colors.surface }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
                  Métriques Temps Réel
                </Text>
                <Pressable onPress={loadAllMetrics} style={styles.refreshButton}>
                  {isLoadingMetrics ? (
                    <ActivityIndicator size='small' color={currentTheme.colors.primary} />
                  ) : (
                    <Icon name='refresh' size={20} color={currentTheme.colors.primary} />
                  )}
                </Pressable>
              </View>

              <View style={styles.metricsGrid}>
                <View
                  style={[styles.metricCard, { backgroundColor: currentTheme.colors.background }]}
                >
                  <Icon name='graphic-eq' size={24} color={currentTheme.colors.primary} />
                  <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
                    {advancedConfig.currentSNR.toFixed(1)} dB
                  </Text>
                  <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
                    SNR
                  </Text>
                </View>

                <View
                  style={[styles.metricCard, { backgroundColor: currentTheme.colors.background }]}
                >
                  <Icon name='noise-aware' size={24} color='#FF6B6B' />
                  <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
                    {metrics.noiseBins}
                  </Text>
                  <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
                    Bins Bruit
                  </Text>
                </View>

                <View
                  style={[styles.metricCard, { backgroundColor: currentTheme.colors.background }]}
                >
                  <Icon name='mic' size={24} color='#4ECDC4' />
                  <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
                    {metrics.speechBins}
                  </Text>
                  <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
                    Bins Parole
                  </Text>
                </View>
              </View>

              {advancedConfig.hasPendingUpdate && (
                <Pressable
                  style={[styles.warningCard, { backgroundColor: '#FFF3CD' }]}
                  onPress={clearPendingUpdates}
                >
                  <Icon name='warning' size={20} color='#856404' />
                  <Text style={[styles.warningText, { color: '#856404' }]}>
                    Mises à jour en attente - Appuyez pour effacer
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Informations sur les performances */}
          {useAdvanced && (
            <View style={[styles.section, { backgroundColor: currentTheme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
                Performances Attendues
              </Text>

              <View style={styles.performanceInfo}>
                <View style={styles.performanceItem}>
                  <Text
                    style={[styles.performanceLabel, { color: currentTheme.colors.textSecondary }]}
                  >
                    SNR Amélioration:
                  </Text>
                  <Text style={[styles.performanceValue, { color: currentTheme.colors.primary }]}>
                    +
                    {advancedConfig.advancedMode === modes.IMCRA
                      ? '12-15'
                      : advancedConfig.advancedMode === modes.WIENER
                      ? '14-18'
                      : advancedConfig.advancedMode === modes.TWOSTEP
                      ? '16-20'
                      : advancedConfig.advancedMode === modes.MULTIBAND
                      ? '15-19'
                      : '8-12'}{' '}
                    dB
                  </Text>
                </View>

                <View style={styles.performanceItem}>
                  <Text
                    style={[styles.performanceLabel, { color: currentTheme.colors.textSecondary }]}
                  >
                    PESQ Score:
                  </Text>
                  <Text style={[styles.performanceValue, { color: currentTheme.colors.primary }]}>
                    {advancedConfig.advancedMode === modes.IMCRA
                      ? '3.31'
                      : advancedConfig.advancedMode === modes.WIENER
                      ? '3.25'
                      : advancedConfig.advancedMode === modes.TWOSTEP
                      ? '3.52'
                      : advancedConfig.advancedMode === modes.MULTIBAND
                      ? '3.28'
                      : '2.8'}
                    /5
                  </Text>
                </View>

                <View style={styles.performanceItem}>
                  <Text
                    style={[styles.performanceLabel, { color: currentTheme.colors.textSecondary }]}
                  >
                    Artefacts:
                  </Text>
                  <Text
                    style={[
                      styles.performanceValue,
                      {
                        color:
                          advancedConfig.advancedMode === modes.STANDARD
                            ? '#FF6B6B'
                            : advancedConfig.advancedMode === modes.IMCRA
                            ? '#4ECDC4'
                            : advancedConfig.advancedMode === modes.WIENER
                            ? '#4ECDC4'
                            : '#45B7D1',
                      },
                    ]}
                  >
                    {advancedConfig.advancedMode === modes.STANDARD
                      ? 'Élevés'
                      : advancedConfig.advancedMode === modes.IMCRA
                      ? 'Faibles'
                      : advancedConfig.advancedMode === modes.WIENER
                      ? 'Très faibles'
                      : 'Minimes'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  section: {
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  advancedControls: {
    gap: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  algorithmList: {
    marginBottom: 16,
  },
  algorithmCard: {
    width: 140,
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  algorithmName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  algorithmQuality: {
    fontSize: 12,
  },
  algorithmInfo: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  algorithmTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  algorithmDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  algorithmMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    fontSize: 12,
  },
  refreshButton: {
    padding: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    flex: 1,
  },
  performanceInfo: {
    gap: 12,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 14,
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
