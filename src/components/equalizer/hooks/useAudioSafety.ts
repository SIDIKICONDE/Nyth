import { useState, useCallback, useEffect, useRef } from 'react';
import NativeAudioEqualizerModule from '../../../../specs/NativeAudioEqualizerModule';

export interface AudioSafetyConfig {
  enabled: boolean;
  dcRemovalEnabled: boolean;
  dcThreshold: number;
  limiterEnabled: boolean;
  limiterThresholdDb: number;
  softKneeLimiter: boolean;
  kneeWidthDb: number;
  feedbackDetectEnabled: boolean;
  feedbackCorrThreshold: number;
}

export interface AudioSafetyReport {
  peak: number;
  rms: number;
  dcOffset: number;
  clippedSamples: number;
  feedbackScore: number;
  overload: boolean;
}

export const useAudioSafety = (pollInterval: number = 100) => {
  const [config, setConfig] = useState<AudioSafetyConfig>({
    enabled: true,
    dcRemovalEnabled: true,
    dcThreshold: 0.002,
    limiterEnabled: true,
    limiterThresholdDb: -1.0,
    softKneeLimiter: true,
    kneeWidthDb: 6.0,
    feedbackDetectEnabled: true,
    feedbackCorrThreshold: 0.95
  });

  const [report, setReport] = useState<AudioSafetyReport>({
    peak: 0,
    rms: 0,
    dcOffset: 0,
    clippedSamples: 0,
    feedbackScore: 0,
    overload: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mettre à jour la configuration
  const updateConfig = useCallback(async (newConfig: Partial<AudioSafetyConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      
      await NativeAudioEqualizerModule.safetySetConfig(
        updatedConfig.enabled,
        updatedConfig.dcRemovalEnabled,
        updatedConfig.dcThreshold,
        updatedConfig.limiterEnabled,
        updatedConfig.limiterThresholdDb,
        updatedConfig.softKneeLimiter,
        updatedConfig.kneeWidthDb,
        updatedConfig.feedbackDetectEnabled,
        updatedConfig.feedbackCorrThreshold
      );
      
      setConfig(updatedConfig);
    } catch (error) {
      console.error('Failed to update safety config:', error);
    }
  }, [config]);

  // Récupérer le rapport de sécurité
  const fetchReport = useCallback(async () => {
    try {
      const safetyReport = await NativeAudioEqualizerModule.safetyGetReport();
      setReport(safetyReport);
    } catch (error) {
      console.error('Failed to get safety report:', error);
    }
  }, []);

  // Démarrer/Arrêter le polling
  useEffect(() => {
    if (config.enabled && pollInterval > 0) {
      intervalRef.current = setInterval(fetchReport, pollInterval);
      fetchReport(); // Première lecture immédiate
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [config.enabled, pollInterval, fetchReport]);

  // Calculer des métriques utiles
  const getMetrics = useCallback(() => {
    const peakDb = 20 * Math.log10(Math.max(0.0000001, report.peak));
    const rmsDb = 20 * Math.log10(Math.max(0.0000001, report.rms));
    const dcDb = 20 * Math.log10(Math.max(0.0000001, Math.abs(report.dcOffset)));
    
    return {
      peakDb,
      rmsDb,
      dcDb,
      headroom: config.limiterThresholdDb - peakDb,
      isClipping: report.clippedSamples > 0,
      hasFeedback: report.feedbackScore > 0.8,
      hasDcOffset: Math.abs(report.dcOffset) > config.dcThreshold
    };
  }, [report, config.dcThreshold, config.limiterThresholdDb]);

  return {
    // État
    config,
    report,
    
    // Actions
    updateConfig,
    fetchReport,
    
    // Utilitaires
    getMetrics
  };
};
