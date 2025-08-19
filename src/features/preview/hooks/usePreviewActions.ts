import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { PreviewActions } from '../types';
import { FileManager } from '@/services/social-share/utils/fileManager';

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
      setCurrentStep(t('preview.export.preparation', 'Préparation de la vidéo...'));

      // Valider l'existence du fichier
      await FileManager.validateVideoFile(recording.videoUri);
      setCurrentStep(t('preview.export.encoding', 'Encodage en cours'));
      setExportProgress(40);

      // Sauvegarder dans la galerie (gère permissions)
      const ok = await FileManager.saveToGallery(recording.videoUri);
      if (!ok) {
        throw new Error('save_failed');
      }
      setCurrentStep(t('preview.export.finalizing', 'Finalisation'));
      setExportProgress(90);

      setCurrentStep(t('preview.export.completed', 'Export terminé'));
      setExportProgress(100);
      setShowSocialShare(true);
    } catch (error) {
      Alert.alert(
        t('preview.export.error.title', 'Erreur d\'export'),
        t('preview.export.error.message', 'Impossible d\'exporter la vidéo. Veuillez réessayer.'),
        [{ text: t('preview.export.error.ok', 'OK') }]
      );
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
