import { useState } from 'react';
import { PreviewState } from '../types';

export function usePreviewState() {
  const [state, setState] = useState<PreviewState>({
    recording: null,
    loading: true,
    isExporting: false,
    exportProgress: 0,
    currentStep: '',
    videoSize: '',
    previewVideoUri: null,
    isGeneratingPreview: false,
    showSocialShare: false,
  });

  const setRecording = (recording: PreviewState['recording']) => 
    setState(prev => ({ ...prev, recording }));
  
  const setLoading = (loading: boolean) => 
    setState(prev => ({ ...prev, loading }));
  
  const setIsExporting = (isExporting: boolean) => 
    setState(prev => ({ ...prev, isExporting }));
  
  const setExportProgress = (exportProgress: number) => 
    setState(prev => ({ ...prev, exportProgress }));
  
  const setCurrentStep = (currentStep: string) => 
    setState(prev => ({ ...prev, currentStep }));
  
  const setVideoSize = (videoSize: string) => 
    setState(prev => ({ ...prev, videoSize }));
  
  const setPreviewVideoUri = (previewVideoUri: string | null) => 
    setState(prev => ({ ...prev, previewVideoUri }));
  
  const setIsGeneratingPreview = (isGeneratingPreview: boolean) => 
    setState(prev => ({ ...prev, isGeneratingPreview }));
  
  const setShowSocialShare = (showSocialShare: boolean) => 
    setState(prev => ({ ...prev, showSocialShare }));

  return {
    ...state,
    setRecording,
    setLoading,
    setIsExporting,
    setExportProgress,
    setCurrentStep,
    setVideoSize,
    setPreviewVideoUri,
    setIsGeneratingPreview,
    setShowSocialShare,
  };
}
