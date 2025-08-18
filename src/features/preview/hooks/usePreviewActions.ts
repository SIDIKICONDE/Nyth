import { useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { PreviewActions } from '../types';

interface UsePreviewActionsProps {
  recording: {
    id: string;
    videoUri: string;
  } | null;
  isExporting: boolean;
  setIsExporting: (isExporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  setCurrentStep: (step: string) => void;
  setShowSocialShare: (show: boolean) => void;
}

export function usePreviewActions({
  recording,
  isExporting,
  setIsExporting,
  setExportProgress,
  setCurrentStep,
  setShowSocialShare,
}: UsePreviewActionsProps): PreviewActions {
  const { t } = useTranslation();

  const handleExport = useCallback(async (): Promise<void> => {
    if (!recording || isExporting) return;

    try {
      setIsExporting(true);
      setExportProgress(0);
      setCurrentStep(t('preview.export.analyzing', 'Analyse de la vidéo'));

      // Simulation du processus d'export
      const steps = [
        { step: t('preview.export.analyzing', 'Analyse de la vidéo'), progress: 20 },
        { step: t('preview.export.audioOptimization', 'Optimisation audio'), progress: 40 },
        { step: t('preview.export.videoCompression', 'Compression vidéo'), progress: 70 },
        { step: t('preview.export.finalizing', 'Finalisation'), progress: 90 },
        { step: t('preview.export.completed', 'Export terminé'), progress: 100 },
      ];

      for (const { step, progress } of steps) {
        setCurrentStep(step);
        setExportProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setShowSocialShare(true);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setCurrentStep('');
    }
  }, [recording, isExporting, setIsExporting, setExportProgress, setCurrentStep, setShowSocialShare, t]);

  const handleShare = useCallback(async (): Promise<void> => {
    setShowSocialShare(true);
  }, [setShowSocialShare]);

  const handleBasicShare = useCallback(async (): Promise<void> => {
    // Logique de partage basique
    console.log('Partage basique');
  }, []);

  const handleDelete = useCallback((): void => {
    // Logique de suppression
    console.log('Suppression de la vidéo');
  }, []);

  const setExportQuality = useCallback((quality: '480p' | '720p' | '1080p' | '4K'): void => {
    console.log('Qualité d\'export définie:', quality);
  }, []);

  const setExportFormat = useCallback((format: 'mp4' | 'mov'): void => {
    console.log('Format d\'export défini:', format);
  }, []);

  return {
    handleExport,
    handleShare,
    handleBasicShare,
    handleDelete,
    setExportQuality,
    setExportFormat,
  };
}
