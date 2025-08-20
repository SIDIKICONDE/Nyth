import React, { useEffect, useCallback } from 'react';
import { Modal, ScrollView, View, Alert } from 'react-native';
import tw from 'twrnc';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import SocialShareService, { SOCIAL_PLATFORMS, SocialPlatform } from '../../services/social-share';
import { SocialShareModalProps } from './types';
import { useShareState } from './hooks/useShareState';
import { useShareLogic } from './hooks/useShareLogic';
import { ShareModalHeader } from './components/ShareModalHeader';
import { PlatformGrid } from './components/PlatformGrid';
import { ShareForm } from './components/ShareForm';
import { ShareTips } from './components/ShareTips';

export default function SocialShareModal({
  visible,
  onClose,
  videoUri,
  videoTitle,
  aspectRatio = { width: 16, height: 9 }
}: SocialShareModalProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  
  // Hooks de gestion d'état et logique
  const { shareState, selectPlatform, updateFormData, setIsSharing, resetState } = useShareState(videoTitle);
  const { handleShare, generateHashtags } = useShareLogic();
  
  // Services
  const socialService = SocialShareService.getInstance();
  const recommendedPlatforms = socialService.getRecommendedPlatforms(aspectRatio).map(rec => rec.platform);

  // Gestion de la sélection de plateforme
  const handlePlatformSelect = useCallback((platform: SocialPlatform | null) => {
    selectPlatform(platform);
    
    if (platform) {
      // Générer des hashtags suggérés
      const suggestedHashtags = generateHashtags(platform, shareState.formData.title);
      updateFormData({ hashtags: suggestedHashtags.join(' ') });
    }
  }, [selectPlatform, generateHashtags, shareState.formData.title, updateFormData]);

  // Gestion du partage
  const handleShareSubmit = useCallback(async () => {
    if (!shareState.selectedPlatform) return;

    setIsSharing(true);
    
    await handleShare(
      videoUri,
      shareState.selectedPlatform,
      shareState.formData,
      () => {
        // Succès
        onClose();
        resetState();
      },
      (error) => {
        // Erreur
        Alert.alert(
          String(t('common.error', '❌ Erreur')), 
          String(t('preview.shareError.message', 'Une erreur est survenue lors du partage'))
        );
      }
    );
    
    setIsSharing(false);
  }, [
    shareState.selectedPlatform,
    shareState.formData,
    videoUri,
    handleShare,
    setIsSharing,
    onClose,
    resetState,
    t
  ]);

  // Réinitialiser l'état quand le modal se ferme
  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible, resetState]);

  const canShare = Boolean(shareState.selectedPlatform && !shareState.isSharing);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[
        tw`flex-1`,
        { backgroundColor: currentTheme.colors.background }
      ]}>
        {/* Header */}
        <ShareModalHeader
          onClose={onClose}
          onShare={handleShareSubmit}
          canShare={canShare}
          isSharing={shareState.isSharing}
        />

        <ScrollView style={tw`flex-1 p-3`}>
          {/* Sélection de plateforme */}
          <PlatformGrid
            platforms={SOCIAL_PLATFORMS}
            selectedPlatform={shareState.selectedPlatform}
            onPlatformSelect={handlePlatformSelect}
            recommendedPlatforms={recommendedPlatforms}
          />

          {/* Formulaire de partage */}
          {shareState.selectedPlatform && (
            <ShareForm
              platform={shareState.selectedPlatform}
              formData={shareState.formData}
              onFormChange={updateFormData}
            />
          )}

          {/* Conseils */}
          <ShareTips />
        </ScrollView>
      </View>
    </Modal>
  );
} 