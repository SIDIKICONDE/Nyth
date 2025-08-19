import { useCallback } from 'react';
import RNFS from 'react-native-fs';
import { useTranslation } from '@/hooks/useTranslation';
import { PreviewActions } from '../types';
import { FileManager } from '@/services/social-share/utils/fileManager';
import { Alert, Platform } from 'react-native';

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
      setExportProgress(10);
      await new Promise(resolve => setTimeout(resolve, 300));

      let localUri = recording.videoUri || '';
      const isRemote = /^https?:\/\//i.test(localUri);
      if (isRemote) {
        setCurrentStep(t('preview.export.downloading', 'Téléchargement de la vidéo'));
        setExportProgress(30);
        const baseDir = (RNFS.TemporaryDirectoryPath || RNFS.CachesDirectoryPath).replace(/\/$/, '');
        const extension = localUri.toLowerCase().includes('.mov') ? 'mov' : 'mp4';
        const tempPath = `${baseDir}/preview_export_${Date.now()}.${extension}`;
        await RNFS.downloadFile({ fromUrl: localUri, toFile: tempPath }).promise;
        localUri = `file://${tempPath}`;
        setExportProgress(70);
      } else {
        setExportProgress(60);
      }

      setCurrentStep(t('preview.export.saving', 'Sauvegarde dans la galerie'));
      const saved = await FileManager.saveToGallery(localUri);
      if (!saved) {
        throw new Error('save_failed');
      }

      setCurrentStep(t('preview.export.completed', 'Export terminé'));
      setExportProgress(100);
      setShowSocialShare(true);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      Alert.alert(
        t('preview.export.errorTitle', 'Erreur d\'export'),
        t('preview.export.errorMessage', 'Impossible d\'exporter la vidéo.'),
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
