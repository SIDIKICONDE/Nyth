import { RouteProp, useFocusEffect, useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { RootStackParamList } from "@/types";
import { LOADING_DELAY } from "@/features/preview/constants/defaultValues";
import { useExportSettings } from "@/features/preview/hooks/useExportSettings";
import { usePreviewActions } from "@/features/preview/hooks/usePreviewActions";
import { usePreviewState } from "@/features/preview/hooks/usePreviewState";
import { UsePreviewDataReturn } from "@/features/preview/types/preview.types";
import { loadRecordingFromStorage } from "@/features/preview/utils/storageUtils";
import { calculateVideoSize } from "@/features/preview/utils/videoUtils";

type PreviewScreenRouteProp = RouteProp<RootStackParamList, "Preview">;

export function usePreviewData(): UsePreviewDataReturn {
  const route = useRoute<PreviewScreenRouteProp>();
  const { t } = useTranslation();

  // États de base
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

  // Paramètres d'export
  const exportSettings = useExportSettings(recording?.videoUri);
  const {
    exportQuality,
    exportFormat,
    isAutoDetected,
    videoMetadata,
    sourceQuality,
    setExportQuality,
    setExportFormat,
    syncWithVideoSettings,
    loadVideoMetadata,
  } = exportSettings;

  // Actions
  const actions = usePreviewActions({
    recording,
    isExporting,
    setIsExporting,
    setExportProgress,
    setCurrentStep,
    setShowSocialShare,
  });

  const loadRecording = async () => {
    try {
      setLoading(true);

      // Forcer une pause minimale pour que l'écran de chargement soit visible
      await new Promise((resolve) => setTimeout(resolve, LOADING_DELAY));

      // Vérifier que recordingId existe
      if (!route.params.recordingId) {
        setRecording(null);
        return;
      }

      // Forcer une synchronisation des paramètres au chargement
      try {
        await syncWithVideoSettings();
      } catch (syncError) {}

      const foundRecording = await loadRecordingFromStorage(
        route.params.recordingId,
        t
      );

      if (foundRecording) {
        setRecording(foundRecording);
        setPreviewVideoUri(foundRecording.videoUri);

        // Calculer la taille du fichier vidéo de manière sécurisée
        try {
          const size = await calculateVideoSize(foundRecording.videoUri, t);
          setVideoSize(size);
        } catch (sizeError) {
          setVideoSize("Taille inconnue");
        }

        // Charger les métadonnées vidéo de manière sécurisée
        try {
          await loadVideoMetadata();
        } catch (metadataError) {}
      } else {
        setRecording(null);
      }
    } catch (error) {
      setRecording(null);

      // Afficher une erreur à l'utilisateur si c'est une erreur critique
      if (error instanceof Error && error.message) {}
    } finally {
      // Ajouter un délai supplémentaire pour s'assurer que l'animation de chargement est visible
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadRecording();
    }, [])
  );

  return {
    // États de base
    recording,
    loading,
    isExporting,
    exportProgress,
    currentStep,
    videoSize,
    previewVideoUri,
    isGeneratingPreview,
    showSocialShare,

    // Setters
    setShowSocialShare,

    // Actions
    handleExport: actions.handleExport,
    handleShare: actions.handleShare,
    handleBasicShare: actions.handleBasicShare,
    handleDelete: actions.handleDelete,
  };
}
