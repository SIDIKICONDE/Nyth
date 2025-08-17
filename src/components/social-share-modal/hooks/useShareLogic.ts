import { useCallback } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import { useTranslation } from '../../../hooks/useTranslation';
import SocialShareService, { SocialPlatform } from '../../../services/social-share';
import { useInstalledApps } from '../../../hooks/useInstalledApps';
import { ShareFormData } from '../types';

export const useShareLogic = () => {
  const { t } = useTranslation();
  const { isAppInstalled, openApp } = useInstalledApps();
  const socialService = SocialShareService.getInstance();

  const handleShare = useCallback(async (
    videoUri: string,
    platform: SocialPlatform,
    formData: ShareFormData,
    onSuccess: () => void,
    onError: (error: Error) => void
  ) => {
    try {
      const hashtagArray = formData.hashtags
        .split(' ')
        .map(tag => tag.replace('#', '').trim())
        .filter(tag => tag.length > 0);

      // Vérifier si l'app est installée
      const appInstalled = isAppInstalled(platform.id);

      if (!appInstalled) {
        // Proposer d'ouvrir l'app ou d'aller au store
        Alert.alert(
          t('socialShare.alerts.appNotInstalled.title', `${platform.icon} ${platform.name} non installé`),
          t('socialShare.alerts.appNotInstalled.message', `L'application ${platform.name} n'est pas installée sur votre appareil.\n\nVotre vidéo a été sauvegardée dans votre galerie.`, { platformName: platform.name }),
          [
            {
              text: t('socialShare.alerts.appNotInstalled.install', `Installer ${platform.name}`, { platformName: platform.name }),
              onPress: () => {
                // Ouvrir le store
                const storeUrl = Platform.OS === 'ios' 
                  ? `https://apps.apple.com/search?term=${encodeURIComponent(platform.name)}`
                  : `https://play.google.com/store/apps/details?id=${platform.packageName}`;
                Linking.openURL(storeUrl);
              }
            },
            {
              text: t('socialShare.alerts.appNotInstalled.tryAnyway', 'Essayer quand même'),
              onPress: async () => {
                // Essayer d'ouvrir avec notre service amélioré
                const opened = await openApp(platform.id);
                if (!opened) {
                  Alert.alert(
                    t('common.error', '❌ Erreur'), 
                    t('socialShare.alerts.cannotOpen', `Impossible d'ouvrir ${platform.name}`, { platformName: platform.name })
                  );
                }
              }
            },
            {
              text: t('common.cancel', 'Annuler'),
              style: 'cancel'
            }
          ]
        );
        return;
      }

      await socialService.shareToSocial(videoUri, platform, {
        title: formData.title,
        description: formData.description,
        hashtags: hashtagArray
      });

      onSuccess();
    } catch (error) {
      onError(error as Error);
    }
  }, [t, isAppInstalled, openApp, socialService]);

  const generateHashtags = useCallback((platform: SocialPlatform, title: string) => {
    return socialService.generateHashtags(platform, title);
  }, [socialService, t]);

  const validateFormData = useCallback((formData: ShareFormData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push(t('socialShare.validation.titleRequired', 'Le titre est requis'));
    }

    if (formData.title.length > 100) {
      errors.push(t('socialShare.validation.titleTooLong', 'Le titre est trop long (max 100 caractères)'));
    }

    if (formData.description.length > 500) {
      errors.push(t('socialShare.validation.descriptionTooLong', 'La description est trop longue (max 500 caractères)'));
    }

    const hashtagCount = formData.hashtags.split(' ').filter(tag => tag.trim().length > 0).length;
    if (hashtagCount > 10) {
      errors.push(t('socialShare.validation.tooManyHashtags', 'Trop de hashtags (max 10)'));
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [t]);

  return {
    handleShare,
    generateHashtags,
    validateFormData,
  };
}; 