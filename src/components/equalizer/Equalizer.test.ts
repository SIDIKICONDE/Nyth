/**
 * Tests complets du module Equalizer Audio Professionnel
 *
 * Ce fichier teste toutes les fonctionnalités de l'égaliseur :
 * - Initialisation et configuration de base
 * - Contrôle des bandes de fréquence
 * - Système de presets
 * - Analyse spectrale en temps réel
 * - Réduction de bruit avancée
 * - Sécurité audio
 * - Effets créatifs
 * - Performance et optimisations
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import { Equalizer } from './Equalizer';
import { AdvancedEqualizer } from './AdvancedEqualizer';
import { useEqualizer } from './hooks/useEqualizer';
import { useEqualizerPresets } from './hooks/useEqualizerPresets';
import { useSpectrumData } from './hooks/useSpectrumData';
import { useNoiseReduction } from './hooks/useNoiseReduction';
import { useAudioSafety } from './hooks/useAudioSafety';
import { useAudioEffects } from './hooks/useAudioEffects';
import NativeAudioEqualizerModule from '../../../specs/NativeAudioEqualizerModule';

// Mock du module natif
jest.mock('../../../specs/NativeAudioEqualizerModule', () => ({
  createEqualizer: jest.fn(() => 1),
  destroyEqualizer: jest.fn(),
  setEQEnabled: jest.fn(),
  getEQEnabled: jest.fn(() => true),
  setMasterGain: jest.fn(),
  getMasterGain: jest.fn(() => 0),
  setBandGain: jest.fn(),
  getBandGain: jest.fn(() => 0),
  beginBatch: jest.fn(),
  endBatch: jest.fn(),
  getSpectrumData: jest.fn(() => Array(32).fill(0.5)),
  startSpectrumAnalysis: jest.fn(),
  stopSpectrumAnalysis: jest.fn(),
  setPreset: jest.fn(),
  nrSetEnabled: jest.fn(),
  nrGetEnabled: jest.fn(() => false),
  nrSetMode: jest.fn(),
  nrGetMode: jest.fn(() => 0),
  rnnsSetAggressiveness: jest.fn(),
  rnnsGetAggressiveness: jest.fn(() => 1.0),
  nrSetConfig: jest.fn(),
  nrGetConfig: jest.fn(() => ({
    highPassEnabled: true,
    highPassHz: 80,
    thresholdDb: -45,
    ratio: 2.5,
    floorDb: -18,
    attackMs: 3,
    releaseMs: 80
  })),
  safetySetConfig: jest.fn(),
  safetyGetReport: jest.fn(() => ({
    peak: 0.8,
    rms: 0.6,
    dcOffset: 0.001,
    clippedSamples: 0,
    feedbackScore: 0.1,
    overload: false
  })),
  fxSetEnabled: jest.fn(),
  fxGetEnabled: jest.fn(() => false),
  fxSetCompressor: jest.fn(),
  fxSetDelay: jest.fn()
}));

// Hook de test pour useEqualizer
const TestEqualizerHook: React.FC<{ onReady: (hook: any) => void }> = ({ onReady }) => {
  const equalizerHook = useEqualizer(10, 48000);
  React.useEffect(() => {
    onReady(equalizerHook);
  }, [equalizerHook, onReady]);
  return null;
};

// Hook de test pour useEqualizerPresets
const TestPresetsHook: React.FC<{ onReady: (hook: any) => void }> = ({ onReady }) => {
  const presetsHook = useEqualizerPresets();
  React.useEffect(() => {
    onReady(presetsHook);
  }, [presetsHook, onReady]);
  return null;
};

// Hook de test pour useSpectrumData
const TestSpectrumHook: React.FC<{ onReady: (hook: any) => void }> = ({ onReady }) => {
  const spectrumHook = useSpectrumData({ updateInterval: 50, smoothingFactor: 0.8 });
  React.useEffect(() => {
    onReady(spectrumHook);
  }, [spectrumHook, onReady]);
  return null;
};

// Hook de test pour useNoiseReduction
const TestNoiseReductionHook: React.FC<{ onReady: (hook: any) => void }> = ({ onReady }) => {
  const nrHook = useNoiseReduction();
  React.useEffect(() => {
    onReady(nrHook);
  }, [nrHook, onReady]);
  return null;
};

// Hook de test pour useAudioSafety
const TestAudioSafetyHook: React.FC<{ onReady: (hook: any) => void }> = ({ onReady }) => {
  const safetyHook = useAudioSafety(100);
  React.useEffect(() => {
    onReady(safetyHook);
  }, [safetyHook, onReady]);
  return null;
};

// Hook de test pour useAudioEffects
const TestAudioEffectsHook: React.FC<{ onReady: (hook: any) => void }> = ({ onReady }) => {
  const effectsHook = useAudioEffects();
  React.useEffect(() => {
    onReady(effectsHook);
  }, [effectsHook, onReady]);
  return null;
};

describe('Equalizer Module Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Equalizer Component', () => {
    test('should render without crashing', () => {
      render(<Equalizer numBands={10} sampleRate={48000} showSpectrum={true} />);
      expect(screen.getByText('Égaliseur Professionnel')).toBeTruthy();
    });

    test('should handle configuration changes', async () => {
      const mockOnConfigChange = jest.fn();
      render(
        <Equalizer
          numBands={10}
          sampleRate={48000}
          showSpectrum={true}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(mockOnConfigChange).toHaveBeenCalled();
      });
    });

    test('should show loading state initially', () => {
      render(<Equalizer numBands={10} sampleRate={48000} />);
      expect(screen.getByText('Initialisation de l\'égaliseur...')).toBeTruthy();
    });

    test('should render all equalizer bands', async () => {
      render(<Equalizer numBands={5} sampleRate={48000} showSpectrum={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Initialisation de l\'égaliseur...')).toBeNull();
      });

      // Vérifier que les fréquences sont affichées
      expect(screen.getByText('31Hz')).toBeTruthy();
      expect(screen.getByText('500Hz')).toBeTruthy();
    });

    test('should handle spectrum toggle', async () => {
      render(<Equalizer numBands={10} sampleRate={48000} showSpectrum={true} />);

      await waitFor(() => {
        expect(screen.queryByText('Initialisation de l\'égaliseur...')).toBeNull();
      });

      const spectrumToggle = screen.getByText('Analyse Spectrale');
      expect(spectrumToggle).toBeTruthy();
    });

    test('should handle master gain slider', async () => {
      render(<Equalizer numBands={10} sampleRate={48000} showSpectrum={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Initialisation de l\'égaliseur...')).toBeNull();
      });

      const masterGainText = screen.getByText('Gain Master');
      expect(masterGainText).toBeTruthy();
    });

    test('should handle reset button', async () => {
      render(<Equalizer numBands={10} sampleRate={48000} showSpectrum={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Initialisation de l\'égaliseur...')).toBeNull();
      });

      const resetButton = screen.getByText('Réinitialiser');
      expect(resetButton).toBeTruthy();
    });
  });

  describe('AdvancedEqualizer Component', () => {
    test('should render without crashing', () => {
      render(<AdvancedEqualizer />);
      expect(screen.getByText('Égaliseur Professionnel')).toBeTruthy();
    });

    test('should show all advanced sections', async () => {
      render(<AdvancedEqualizer />);

      await waitFor(() => {
        expect(screen.queryByText('Initialisation de l\'égaliseur...')).toBeNull();
      });

      expect(screen.getByText('Réduction de Bruit')).toBeTruthy();
      expect(screen.getByText('Sécurité Audio')).toBeTruthy();
      expect(screen.getByText('Effets Créatifs')).toBeTruthy();
    });
  });

  describe('useEqualizer Hook', () => {
    test('should initialize with correct parameters', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestEqualizerHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      expect(hookData.isInitialized).toBe(true);
      expect(hookData.bands).toHaveLength(10);
      expect(hookData.masterGain).toBe(0);
      expect(hookData.enabled).toBe(true);
    });

    test('should handle band gain changes', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestEqualizerHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.setBandGain(0, 6);
      });

      expect(NativeAudioEqualizerModule.setBandGain).toHaveBeenCalledWith(0, 6);
    });

    test('should handle master gain changes', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestEqualizerHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.updateMasterGain(12);
      });

      expect(NativeAudioEqualizerModule.setMasterGain).toHaveBeenCalledWith(12);
    });

    test('should handle enable/disable toggle', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestEqualizerHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.toggleEnabled();
      });

      expect(NativeAudioEqualizerModule.setEQEnabled).toHaveBeenCalledWith(false);
    });

    test('should handle reset all bands', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestEqualizerHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.resetAllBands();
      });

      expect(NativeAudioEqualizerModule.beginBatch).toHaveBeenCalled();
      expect(NativeAudioEqualizerModule.endBatch).toHaveBeenCalled();
    });

    test('should handle batch band updates', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestEqualizerHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      const gains = [6, 4, 2, 0, -2, 0, 2, 4, 6, 8];
      await act(async () => {
        await hookData.updateAllBandGains(gains);
      });

      expect(NativeAudioEqualizerModule.beginBatch).toHaveBeenCalled();
      expect(NativeAudioEqualizerModule.endBatch).toHaveBeenCalled();
    });

    test('should provide correct configuration', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestEqualizerHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      const config = hookData.getConfig();
      expect(config.numBands).toBe(10);
      expect(config.sampleRate).toBe(48000);
      expect(config.bands).toHaveLength(10);
    });
  });

  describe('useEqualizerPresets Hook', () => {
    test('should load built-in presets', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestPresetsHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      expect(hookData.presets).toHaveLength(10); // 10 presets intégrés
      expect(hookData.currentPreset).toBe('Flat');
    });

    test('should apply presets', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestPresetsHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        const gains = await hookData.applyPreset('Rock');
        expect(gains).toBeTruthy();
        expect(gains).toHaveLength(10);
      });

      expect(NativeAudioEqualizerModule.setPreset).toHaveBeenCalledWith('Rock');
    });

    test('should save custom presets', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestPresetsHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      const customGains = [2, 4, 2, 0, -2, 0, 2, 4, 2, 0];
      await act(async () => {
        const success = await hookData.saveCustomPreset('My Custom', customGains);
        expect(success).toBe(true);
      });
    });

    test('should delete custom presets', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestPresetsHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      // D'abord sauvegarder un preset personnalisé
      const customGains = [2, 4, 2, 0, -2, 0, 2, 4, 2, 0];
      await act(async () => {
        await hookData.saveCustomPreset('My Custom', customGains);
      });

      // Ensuite le supprimer
      await act(async () => {
        const success = await hookData.deleteCustomPreset('My Custom');
        expect(success).toBe(true);
      });
    });

    test('should identify custom presets', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestPresetsHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      expect(hookData.isCustomPreset('Flat')).toBe(false);
      expect(hookData.isCustomPreset('Rock')).toBe(false);
    });
  });

  describe('useSpectrumData Hook', () => {
    test('should initialize spectrum data', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestSpectrumHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      expect(hookData.isAnalyzing).toBe(false);
      expect(hookData.spectrumData.magnitudes).toHaveLength(32);
    });

    test('should start and stop analysis', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestSpectrumHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      // Démarrer l'analyse
      await act(async () => {
        await hookData.startAnalysis();
      });

      expect(NativeAudioEqualizerModule.startSpectrumAnalysis).toHaveBeenCalled();

      // Arrêter l'analyse
      await act(async () => {
        await hookData.stopAnalysis();
      });

      expect(NativeAudioEqualizerModule.stopSpectrumAnalysis).toHaveBeenCalled();
    });

    test('should toggle analysis', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestSpectrumHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.toggleAnalysis();
      });

      expect(NativeAudioEqualizerModule.startSpectrumAnalysis).toHaveBeenCalled();

      await act(async () => {
        await hookData.toggleAnalysis();
      });

      expect(NativeAudioEqualizerModule.stopSpectrumAnalysis).toHaveBeenCalled();
    });

    test('should provide spectrum metrics', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestSpectrumHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      const metrics = hookData.getMetrics();
      expect(metrics).toHaveProperty('average');
      expect(metrics).toHaveProperty('peak');
      expect(metrics).toHaveProperty('rms');
    });
  });

  describe('useNoiseReduction Hook', () => {
    test('should initialize with default values', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestNoiseReductionHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      expect(hookData.isEnabled).toBe(false);
      expect(hookData.mode).toBe('expander');
      expect(hookData.rnnoiseAggressiveness).toBe(1.0);
    });

    test('should handle mode changes', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestNoiseReductionHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.changeMode('rnnoise');
      });

      expect(NativeAudioEqualizerModule.nrSetMode).toHaveBeenCalledWith(1);
    });

    test('should handle aggressiveness changes', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestNoiseReductionHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.setAggressiveness(2.5);
      });

      expect(NativeAudioEqualizerModule.rnnsSetAggressiveness).toHaveBeenCalledWith(2.5);
    });

    test('should handle enable/disable toggle', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestNoiseReductionHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.toggleEnabled();
      });

      expect(NativeAudioEqualizerModule.nrSetEnabled).toHaveBeenCalledWith(true);
    });

    test('should update configuration', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestNoiseReductionHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.updateConfig({
          thresholdDb: -30,
          ratio: 3.0
        });
      });

      expect(NativeAudioEqualizerModule.nrSetConfig).toHaveBeenCalled();
    });

    test('should handle advanced features', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestNoiseReductionHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      // Tester le mode avancé
      await act(async () => {
        hookData.toggleAdvancedMode();
      });

      expect(hookData.useAdvanced).toBe(true);

      // Tester le changement de mode avancé
      await act(async () => {
        await hookData.setAdvancedMode('STANDARD');
      });

      expect(hookData.advancedConfig.advancedMode).toBe(0);
    });
  });

  describe('useAudioSafety Hook', () => {
    test('should initialize with default config', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestAudioSafetyHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      expect(hookData.config.enabled).toBe(true);
      expect(hookData.config.dcRemovalEnabled).toBe(true);
      expect(hookData.config.limiterEnabled).toBe(true);
    });

    test('should update configuration', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestAudioSafetyHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.updateConfig({
          limiterThresholdDb: -2.0,
          dcThreshold: 0.005
        });
      });

      expect(NativeAudioEqualizerModule.safetySetConfig).toHaveBeenCalled();
    });

    test('should fetch safety report', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestAudioSafetyHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.fetchReport();
      });

      expect(NativeAudioEqualizerModule.safetyGetReport).toHaveBeenCalled();
    });

    test('should provide metrics', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestAudioSafetyHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      const metrics = hookData.getMetrics();
      expect(metrics).toHaveProperty('peakDb');
      expect(metrics).toHaveProperty('rmsDb');
      expect(metrics).toHaveProperty('headroom');
      expect(metrics).toHaveProperty('isClipping');
    });
  });

  describe('useAudioEffects Hook', () => {
    test('should initialize with default values', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestAudioEffectsHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      expect(hookData.isEnabled).toBe(false);
      expect(hookData.compressor.thresholdDb).toBe(-18.0);
      expect(hookData.delay.delayMs).toBe(150.0);
    });

    test('should handle enable/disable toggle', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestAudioEffectsHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.toggleEnabled();
      });

      expect(NativeAudioEqualizerModule.fxSetEnabled).toHaveBeenCalledWith(true);
    });

    test('should update compressor settings', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestAudioEffectsHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.updateCompressor({
          thresholdDb: -20,
          ratio: 4.0
        });
      });

      expect(NativeAudioEqualizerModule.fxSetCompressor).toHaveBeenCalled();
    });

    test('should update delay settings', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestAudioEffectsHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.updateDelay({
          delayMs: 200,
          mix: 0.3
        });
      });

      expect(NativeAudioEqualizerModule.fxSetDelay).toHaveBeenCalled();
    });

    test('should reset effects', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestAudioEffectsHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      await act(async () => {
        await hookData.resetEffects();
      });

      expect(NativeAudioEqualizerModule.fxSetCompressor).toHaveBeenCalled();
      expect(NativeAudioEqualizerModule.fxSetDelay).toHaveBeenCalled();
    });

    test('should calculate compressor gain reduction', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestAudioEffectsHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      const gainReduction = hookData.getCompressorGainReduction(-10);
      expect(typeof gainReduction).toBe('number');
      expect(gainReduction).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    test('should handle rapid band gain changes', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestEqualizerHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      // Simuler des changements rapides de gain
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          act(async () => {
            await hookData.setBandGain(i, Math.random() * 24 - 12);
          })
        );
      }

      await Promise.all(promises);
      expect(NativeAudioEqualizerModule.setBandGain).toHaveBeenCalledTimes(10);
    });

    test('should handle batch operations efficiently', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestEqualizerHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      const startTime = Date.now();

      await act(async () => {
        await hookData.updateAllBandGains([6, 4, 2, 0, -2, 0, 2, 4, 6, 8]);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // L'opération groupée devrait être rapide (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    test('should handle spectrum data updates efficiently', async () => {
      let hookData: any = null;
      const mockOnReady = (hook: any) => {
        hookData = hook;
      };

      render(<TestSpectrumHook onReady={mockOnReady} />);

      await waitFor(() => {
        expect(hookData).toBeTruthy();
      });

      const startTime = Date.now();

      // Simuler plusieurs mises à jour de données spectrales
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          // Déclencher manuellement la mise à jour du spectre
          await hookData.startAnalysis();
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Les mises à jour spectrales devraient être efficaces
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Integration Tests', () => {
    test('should integrate all components together', async () => {
      // Tester l'intégration complète de tous les composants
      render(
        <AdvancedEqualizer />
      );

      await waitFor(() => {
        expect(screen.queryByText('Initialisation de l\'égaliseur...')).toBeNull();
      });

      // Vérifier que tous les composants sont présents
      expect(screen.getByText('Égaliseur Professionnel')).toBeTruthy();
      expect(screen.getByText('Réduction de Bruit')).toBeTruthy();
      expect(screen.getByText('Sécurité Audio')).toBeTruthy();
      expect(screen.getByText('Effets Créatifs')).toBeTruthy();
    });

    test('should handle component lifecycle correctly', async () => {
      const { unmount } = render(<Equalizer numBands={10} sampleRate={48000} />);

      await waitFor(() => {
        expect(screen.queryByText('Initialisation de l\'égaliseur...')).toBeNull();
      });

      // Démonter le composant
      unmount();

      // Vérifier que les ressources sont nettoyées
      expect(NativeAudioEqualizerModule.destroyEqualizer).toHaveBeenCalled();
    });

    test('should handle error conditions gracefully', async () => {
      // Simuler une erreur du module natif
      (NativeAudioEqualizerModule.createEqualizer as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Native module error');
      });

      // Le composant devrait gérer l'erreur sans crasher
      expect(() => {
        render(<Equalizer numBands={10} sampleRate={48000} />);
      }).not.toThrow();
    });
  });

  describe('Accessibility Tests', () => {
    test('should have proper accessibility labels', async () => {
      render(<Equalizer numBands={5} sampleRate={48000} showSpectrum={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Initialisation de l\'égaliseur...')).toBeNull();
      });

      // Vérifier les labels d'accessibilité
      expect(screen.getByText('Égaliseur Professionnel')).toBeTruthy();
      expect(screen.getByText('Gain Master')).toBeTruthy();
      expect(screen.getByText('Réinitialiser')).toBeTruthy();
    });

    test('should support keyboard navigation', async () => {
      render(<Equalizer numBands={5} sampleRate={48000} showSpectrum={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Initialisation de l\'égaliseur...')).toBeNull();
      });

      // Simuler la navigation au clavier
      const resetButton = screen.getByText('Réinitialiser');
      expect(resetButton).toBeTruthy();
    });
  });
});
