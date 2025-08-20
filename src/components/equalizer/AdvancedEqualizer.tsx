import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { Equalizer } from './Equalizer';
import { useNoiseReduction } from './hooks/useNoiseReduction';
import { useAudioSafety } from './hooks/useAudioSafety';
import { useAudioEffects } from './hooks/useAudioEffects';
import Slider from '@react-native-community/slider';

export const AdvancedEqualizer: React.FC = () => {
  const { currentTheme } = useTheme();
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

  const {
    config: safetyConfig,
    report: safetyReport,
    updateConfig: updateSafetyConfig,
    getMetrics
  } = useAudioSafety(100); // Mise à jour toutes les 100ms

  const {
    isEnabled: fxEnabled,
    compressor,
    delay,
    toggleEnabled: toggleFX,
    updateCompressor,
    updateDelay
  } = useAudioEffects();

  const safetyMetrics = getMetrics();

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      {/* Égaliseur principal */}
      <View style={styles.section}>
        <Equalizer 
          numBands={10}
          sampleRate={48000}
          showSpectrum={true}
        />
      </View>

      {/* Réduction de bruit */}
      <View style={[styles.section, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.sectionHeader}>
          <Icon name="mic-off" size={24} color={currentTheme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            Réduction de Bruit
          </Text>
          <Switch
            value={nrEnabled}
            onValueChange={toggleNR}
            trackColor={{ 
              false: currentTheme.colors.surface, 
              true: currentTheme.colors.primary + '60' 
            }}
            thumbColor={nrEnabled ? currentTheme.colors.primary : currentTheme.colors.textSecondary}
          />
        </View>
        
        {nrEnabled && (
          <View style={styles.controls}>
            <View style={styles.modeSelector}>
              <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                Mode:
              </Text>
              <View style={styles.modeButtons}>
                {(['expander', 'rnnoise', 'off'] as const).map((mode) => (
                  <Pressable
                    key={mode}
                    style={[
                      styles.modeButton,
                      {
                        backgroundColor: nrMode === mode 
                          ? currentTheme.colors.primary 
                          : currentTheme.colors.surface
                      }
                    ]}
                    onPress={() => changeNRMode(mode)}
                  >
                    <Text style={[
                      styles.modeButtonText,
                      { color: nrMode === mode ? '#FFFFFF' : currentTheme.colors.text }
                    ]}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {nrMode === 'rnnoise' && (
              <View style={styles.control}>
                <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                  Agressivité: {rnnoiseAggressiveness.toFixed(1)}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={3}
                  value={rnnoiseAggressiveness}
                  onValueChange={setAggressiveness}
                  minimumTrackTintColor={currentTheme.colors.primary}
                  maximumTrackTintColor={currentTheme.colors.surface}
                  thumbTintColor={currentTheme.colors.primary}
                />
              </View>
            )}

            {nrMode === 'expander' && (
              <>
                <View style={styles.control}>
                  <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                    Seuil: {nrConfig.thresholdDb.toFixed(1)} dB
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={-60}
                    maximumValue={-20}
                    value={nrConfig.thresholdDb}
                    onValueChange={(value) => updateNRConfig({ thresholdDb: value })}
                    minimumTrackTintColor={currentTheme.colors.primary}
                    maximumTrackTintColor={currentTheme.colors.surface}
                    thumbTintColor={currentTheme.colors.primary}
                  />
                </View>
                <View style={styles.control}>
                  <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                    Ratio: {nrConfig.ratio.toFixed(1)}:1
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={10}
                    value={nrConfig.ratio}
                    onValueChange={(value) => updateNRConfig({ ratio: value })}
                    minimumTrackTintColor={currentTheme.colors.primary}
                    maximumTrackTintColor={currentTheme.colors.surface}
                    thumbTintColor={currentTheme.colors.primary}
                  />
                </View>
              </>
            )}
          </View>
        )}
      </View>

      {/* Sécurité Audio */}
      <View style={[styles.section, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.sectionHeader}>
          <Icon name="security" size={24} color={currentTheme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            Sécurité Audio
          </Text>
          <Switch
            value={safetyConfig.enabled}
            onValueChange={(value) => updateSafetyConfig({ enabled: value })}
            trackColor={{ 
              false: currentTheme.colors.surface, 
              true: currentTheme.colors.primary + '60' 
            }}
            thumbColor={safetyConfig.enabled ? currentTheme.colors.primary : currentTheme.colors.textSecondary}
          />
        </View>

        {safetyConfig.enabled && (
          <View style={styles.safetyMetrics}>
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
                Crête:
              </Text>
              <Text style={[
                styles.metricValue, 
                { color: safetyMetrics.isClipping ? '#FF4444' : currentTheme.colors.text }
              ]}>
                {safetyMetrics.peakDb.toFixed(1)} dB
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
                RMS:
              </Text>
              <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
                {safetyMetrics.rmsDb.toFixed(1)} dB
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
                Marge:
              </Text>
              <Text style={[
                styles.metricValue,
                { color: safetyMetrics.headroom < 3 ? '#FFA500' : '#4CAF50' }
              ]}>
                {safetyMetrics.headroom.toFixed(1)} dB
              </Text>
            </View>
            {safetyMetrics.isClipping && (
              <View style={[styles.warning, { backgroundColor: '#FF444420' }]}>
                <Icon name="warning" size={16} color="#FF4444" />
                <Text style={[styles.warningText, { color: '#FF4444' }]}>
                  Écrêtage détecté ({safetyReport.clippedSamples} échantillons)
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Effets créatifs */}
      <View style={[styles.section, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.sectionHeader}>
          <Icon name="auto-awesome" size={24} color={currentTheme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            Effets Créatifs
          </Text>
          <Switch
            value={fxEnabled}
            onValueChange={toggleFX}
            trackColor={{ 
              false: currentTheme.colors.surface, 
              true: currentTheme.colors.primary + '60' 
            }}
            thumbColor={fxEnabled ? currentTheme.colors.primary : currentTheme.colors.textSecondary}
          />
        </View>

        {fxEnabled && (
          <>
            <View style={styles.effectSection}>
              <Text style={[styles.effectTitle, { color: currentTheme.colors.text }]}>
                Compresseur
              </Text>
              <View style={styles.control}>
                <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                  Seuil: {compressor.thresholdDb.toFixed(1)} dB
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={-40}
                  maximumValue={0}
                  value={compressor.thresholdDb}
                  onValueChange={(value) => updateCompressor({ thresholdDb: value })}
                  minimumTrackTintColor={currentTheme.colors.primary}
                  maximumTrackTintColor={currentTheme.colors.surface}
                  thumbTintColor={currentTheme.colors.primary}
                />
              </View>
              <View style={styles.control}>
                <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                  Ratio: {compressor.ratio.toFixed(1)}:1
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={20}
                  value={compressor.ratio}
                  onValueChange={(value) => updateCompressor({ ratio: value })}
                  minimumTrackTintColor={currentTheme.colors.primary}
                  maximumTrackTintColor={currentTheme.colors.surface}
                  thumbTintColor={currentTheme.colors.primary}
                />
              </View>
            </View>

            <View style={styles.effectSection}>
              <Text style={[styles.effectTitle, { color: currentTheme.colors.text }]}>
                Delay
              </Text>
              <View style={styles.control}>
                <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                  Délai: {delay.delayMs.toFixed(0)} ms
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={500}
                  value={delay.delayMs}
                  onValueChange={(value) => updateDelay({ delayMs: value })}
                  minimumTrackTintColor={currentTheme.colors.primary}
                  maximumTrackTintColor={currentTheme.colors.surface}
                  thumbTintColor={currentTheme.colors.primary}
                />
              </View>
              <View style={styles.control}>
                <Text style={[styles.label, { color: currentTheme.colors.textSecondary }]}>
                  Mix: {(delay.mix * 100).toFixed(0)}%
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={delay.mix}
                  onValueChange={(value) => updateDelay({ mix: value })}
                  minimumTrackTintColor={currentTheme.colors.primary}
                  maximumTrackTintColor={currentTheme.colors.surface}
                  thumbTintColor={currentTheme.colors.primary}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    borderRadius: 12,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  controls: {
    padding: 16,
    paddingTop: 0,
  },
  control: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  slider: {
    height: 40,
  },
  modeSelector: {
    marginBottom: 16,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  safetyMetrics: {
    padding: 16,
    paddingTop: 0,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  metricLabel: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    flex: 1,
  },
  effectSection: {
    padding: 16,
    paddingTop: 0,
  },
  effectTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  }
});
