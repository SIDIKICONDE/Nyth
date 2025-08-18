import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from '@/hooks/useTranslation';
import { useRecordings } from '@/hooks/useRecordings';
import { RootStackParamList } from '@/types';
import { LOADING_DELAY } from '../constants';
import { usePreviewState } from './usePreviewState';
import { usePreviewActions } from './usePreviewActions';
import { UsePreviewDataReturn } from '../types';

type PreviewScreenRouteProp = RouteProp<RootStackParamList, 'Preview'>;

export function usePreviewData(): UsePreviewDataReturn {
  const route = useRoute<PreviewScreenRouteProp>();
  const { t } = useTranslation();
  const { recordings, loadRecordings } = useRecordings();
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

      // Charger les enregistrements depuis AsyncStorage
      await loadRecordings();
      
      // Trouver l'enregistrement spécifique par ID
      const foundRecording = recordings.find(rec => rec.id === route.params.recordingId);
      
      if (foundRecording) {
        setRecording(foundRecording);
        setPreviewVideoUri(foundRecording.videoUri || foundRecording.uri || '');
        
        // Calculer la taille approximative de la vidéo (en MB)
        const videoSizeInMB = foundRecording.duration ? 
          (foundRecording.duration * 0.25).toFixed(1) : '0';
        setVideoSize(`${videoSizeInMB} MB`);
        setIsGeneratingPreview(false);
      } else {
        // Si l'enregistrement n'est pas trouvé, utiliser les données passées en paramètres
        // ou afficher une erreur
        if (route.params?.videoUri) {
          const fallbackRecording = {
            id: route.params.recordingId,
            scriptId: route.params.scriptId,
            scriptTitle: route.params.scriptTitle || 'Sans titre',
            videoUri: route.params.videoUri,
            duration: route.params.duration || 0,
            createdAt: new Date().toISOString(),
            thumbnailUri: route.params.thumbnailUri || null,
          };
          setRecording(fallbackRecording);
          setPreviewVideoUri(fallbackRecording.videoUri);
          setVideoSize('N/A');
          setIsGeneratingPreview(false);
        } else {
          setRecording(null);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setRecording(null);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, [route.params, recordings, loadRecordings, setRecording, setLoading, setPreviewVideoUri, setVideoSize, setIsGeneratingPreview]);

  useFocusEffect(
    useCallback(() => {
      loadRecording();
    }, [loadRecording])
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
    loadRecording,
  };
}
