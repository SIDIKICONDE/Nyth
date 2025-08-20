import { useState, useCallback } from 'react';
import { SocialPlatform } from '../../../services/social-share';
import { ShareState, ShareFormData } from '../types';

/**
 * Hook pour gérer l'état du partage social
 * Gère la plateforme sélectionnée, les données du formulaire et l'état de partage
 */
export const useShareState = (initialTitle?: string) => {
  const [shareState, setShareState] = useState<ShareState>({
    selectedPlatform: null,
    formData: {
      title: initialTitle || '',
      description: '',
      hashtags: '',
    },
    isSharing: false,
  });

  const selectPlatform = useCallback((platform: SocialPlatform | null) => {
    setShareState(prev => ({
      ...prev,
      selectedPlatform: platform,
    }));
  }, []);

  const updateFormData = useCallback((data: Partial<ShareFormData>) => {
    setShareState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...data },
    }));
  }, []);

  const setIsSharing = useCallback((isSharing: boolean) => {
    setShareState(prev => ({
      ...prev,
      isSharing,
    }));
  }, []);

  const resetState = useCallback(() => {
    setShareState({
      selectedPlatform: null,
      formData: {
        title: initialTitle || '',
        description: '',
        hashtags: '',
      },
      isSharing: false,
    });
  }, [initialTitle]);

  // Fonction utilitaire pour valider l'état
  const isReadyToShare = useCallback(() => {
    return shareState.selectedPlatform !== null && 
           shareState.formData.title.trim().length > 0 &&
           !shareState.isSharing;
  }, [shareState]);

  return {
    shareState,
    selectPlatform,
    updateFormData,
    setIsSharing,
    resetState,
    isReadyToShare,
  };
}; 