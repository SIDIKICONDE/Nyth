import { useState, useCallback } from 'react';
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

  const setRecording = useCallback((recording: PreviewState['recording']) => 
    setState(prev => ({ ...prev, recording })), []);
  
  const setLoading = useCallback((loading: boolean) => 
    setState(prev => ({ ...prev, loading })), []);
  
  const setIsExporting = useCallback((isExporting: boolean) => 
    setState(prev => ({ ...prev, isExporting })), []);
  
  const setExportProgress = useCallback((exportProgress: number) => 
    setState(prev => ({ ...prev, exportProgress })), []);
  
  const setCurrentStep = useCallback((currentStep: string) => 
    setState(prev => ({ ...prev, currentStep })), []);
  
  const setVideoSize = useCallback((videoSize: string) => 
    setState(prev => ({ ...prev, videoSize })), []);
  
  const setPreviewVideoUri = useCallback((previewVideoUri: string | null) => 
    setState(prev => ({ ...prev, previewVideoUri })), []);
  
  const setIsGeneratingPreview = useCallback((isGeneratingPreview: boolean) => 
    setState(prev => ({ ...prev, isGeneratingPreview })), []);
  
  const setShowSocialShare = useCallback((showSocialShare: boolean) => 
    setState(prev => ({ ...prev, showSocialShare })), []);

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
