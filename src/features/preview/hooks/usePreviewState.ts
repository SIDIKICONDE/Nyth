import { useState } from 'react';
import { PreviewState } from '../types/preview.types';

export const usePreviewState = (): PreviewState & {
  setRecording: (recording: PreviewState['recording']) => void;
  setLoading: (loading: boolean) => void;
  setIsExporting: (isExporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  setCurrentStep: (step: string) => void;
  setVideoSize: (size: string) => void;
  setPreviewVideoUri: (uri: string | null) => void;
  setIsGeneratingPreview: (generating: boolean) => void;
  setShowSocialShare: (show: boolean) => void;
} => {
  const [recording, setRecording] = useState<PreviewState['recording']>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [videoSize, setVideoSize] = useState<string>('Calcul...');
  const [previewVideoUri, setPreviewVideoUri] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showSocialShare, setShowSocialShare] = useState(false);

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
}; 