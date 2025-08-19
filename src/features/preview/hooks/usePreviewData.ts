import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import { getRecordings } from '@/hooks/useRecordings';
import { RootStackParamList } from '@/types';
import { LOADING_DELAY } from '../constants';
import { usePreviewState } from './usePreviewState';
import { usePreviewActions } from './usePreviewActions';
import { UsePreviewDataReturn } from '../types';

type PreviewScreenRouteProp = RouteProp<RootStackParamList, 'Preview'>;

export function usePreviewData(): UsePreviewDataReturn {
  const route = useRoute<PreviewScreenRouteProp>();

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

  // Normalise une URI vidéo locale pour la lecture
  const normalizeVideoUri = (uri?: string | null): string => {
    if (!uri) return '';
    const trimmed = uri.trim();
    if (trimmed.startsWith('file://') || trimmed.startsWith('content://')) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      return `file://${trimmed}`;
    }
    return trimmed;
  };

  const loadRecording = useCallback(async () => {
    if (!route.params?.recordingId) {
      setRecording(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, LOADING_DELAY));

      if (!route.params?.recordingId) {
        setRecording(null);
        return;
      }

      // Charger les enregistrements depuis AsyncStorage
      const allRecordings = await getRecordings();
      
      // Trouver l'enregistrement spécifique par ID
      const foundRecording = allRecordings.find(rec => rec.id === route.params.recordingId);
      
      if (foundRecording) {
        setRecording(foundRecording);
        setPreviewVideoUri(
          normalizeVideoUri(foundRecording.videoUri || foundRecording.uri || '')
        );
        
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
            videoUri: normalizeVideoUri(route.params.videoUri),
            duration: route.params.duration || 0,
            createdAt: new Date().toISOString(),
            thumbnailUri: route.params.thumbnailUri || null,
          };
          setRecording(fallbackRecording);
          setPreviewVideoUri(normalizeVideoUri(fallbackRecording.videoUri));
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
  }, [route.params?.recordingId, route.params?.videoUri, route.params?.scriptId, route.params?.scriptTitle, route.params?.duration, route.params?.thumbnailUri, setRecording, setLoading, setPreviewVideoUri, setVideoSize, setIsGeneratingPreview]);

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
