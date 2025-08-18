import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from '@/hooks/useTranslation';
import { RootStackParamList } from '@/types';
import { LOADING_DELAY } from '../constants';
import { usePreviewState } from './usePreviewState';
import { usePreviewActions } from './usePreviewActions';
import { UsePreviewDataReturn } from '../types';

type PreviewScreenRouteProp = RouteProp<RootStackParamList, 'Preview'>;

export function usePreviewData(): UsePreviewDataReturn {
  const route = useRoute<PreviewScreenRouteProp>();
  const { t } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);

  const previewState = usePreviewState();
  const {
    recording,
    loading,
    isExporting,
    exportProgress,
    currentStep,
    videoSize,
    previewVideoUri,
    isGeneratingPreview,
    showSocialShare,
    setRecording,
    setLoading,
    setIsExporting,
    setExportProgress,
    setCurrentStep,
    setVideoSize,
    setPreviewVideoUri,
    setIsGeneratingPreview,
    setShowSocialShare,
  } = previewState;

  const actions = usePreviewActions({
    recording,
    isExporting,
    setIsExporting,
    setExportProgress,
    setCurrentStep,
    setShowSocialShare,
  });

  const loadRecording = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, LOADING_DELAY));

      if (!route.params?.recordingId) {
        setRecording(null);
        return;
      }

      // Simulation du chargement d'un enregistrement
      const mockRecording = {
        id: route.params.recordingId,
        scriptId: route.params.scriptId || 'demo',
        scriptTitle: route.params.scriptTitle || 'Démo Prévisualisation',
        videoUri: route.params.videoUri || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: route.params.duration || 60,
        createdAt: new Date().toISOString(),
        thumbnailUri: route.params.thumbnailUri || null,
      };

      setRecording(mockRecording);
      setPreviewVideoUri(mockRecording.videoUri);
      setVideoSize('15.2 MB');
      setIsGeneratingPreview(false);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setRecording(null);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, [route.params, setRecording, setLoading, setPreviewVideoUri, setVideoSize, setIsGeneratingPreview]);

  useFocusEffect(
    useCallback(() => {
      if (!isInitialized) {
        loadRecording();
        setIsInitialized(true);
      }
    }, [isInitialized, loadRecording, setIsInitialized])
  );

  return {
    recording,
    loading,
    isExporting,
    exportProgress,
    currentStep,
    videoSize,
    previewVideoUri,
    isGeneratingPreview,
    showSocialShare,
    setShowSocialShare,
    handleExport: actions.handleExport,
    handleShare: actions.handleShare,
    handleBasicShare: actions.handleBasicShare,
    handleDelete: actions.handleDelete,
  };
}
