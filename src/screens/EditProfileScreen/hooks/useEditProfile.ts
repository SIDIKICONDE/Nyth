import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { UserProfileUpdate, SocialLinks } from '../../../types/user';
import { useUserProfile } from '../../../contexts/UserProfileContext';
import { useTranslation } from '../../../hooks/useTranslation';
import { SOCIAL_FIELDS } from '../constants';
import { extractUsername, buildSocialUrl } from '../utils';
import { EditProfileScreenNavigationProp } from '../types';

export const useEditProfile = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const { t } = useTranslation();
  const { profile, updateProfile, isLoading: isProfileLoading } = useUserProfile();
  
  const [isLoading, setIsLoading] = useState(false);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });
  const [formData, setFormData] = useState<UserProfileUpdate>({
    displayName: '',
    firstName: '',
    lastName: '',
    bio: '',
    phoneNumber: '',
    profession: '',
    company: '',
    website: '',
    socials: {},
  });
  
  // État pour stocker les noms d'utilisateur uniquement
  const [socialUsernames, setSocialUsernames] = useState<Record<string, string>>({});

  // Mettre à jour le formulaire quand le profil se charge
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        bio: profile.bio || '',
        phoneNumber: profile.phoneNumber || '',
        profession: profile.profession || '',
        company: profile.company || '',
        website: profile.website || '',
        socials: profile.socials || {},
      });
      
      // Extraire les noms d'utilisateur des URLs existantes
      const usernames: Record<string, string> = {};
      if (profile.socials) {
        SOCIAL_FIELDS.forEach(field => {
          const url = profile.socials?.[field.name];
          if (url) {
            usernames[field.name] = extractUsername(url, field.baseUrl);
          }
        });
      }
      setSocialUsernames(usernames);
    }
  }, [profile]);

  const handleUpdateFormData = useCallback((data: Partial<UserProfileUpdate>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const handleUpdateSocialUsername = useCallback((field: string, value: string) => {
    setSocialUsernames(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCloseAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, visible: false }));
    if (alertState.type === 'success') {
      navigation.goBack();
    }
  }, [alertState.type, navigation]);

  const handleSave = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Construire les URLs complètes à partir des noms d'utilisateur
      const socialsWithUrls: SocialLinks = {};
      SOCIAL_FIELDS.forEach(field => {
        const username = socialUsernames[field.name];
        if (username) {
          socialsWithUrls[field.name] = buildSocialUrl(username, field.baseUrl);
        }
      });
      
      // Mettre à jour avec les URLs complètes
      const dataToSave = {
        ...formData,
        socials: socialsWithUrls
      };
      
      await updateProfile(dataToSave);
      setAlertState({
        visible: true,
        type: 'success',
        title: t('profile.editProfile.success.title') || 'Succès!',
        message: t('profile.editProfile.success.message') || 'Votre profil a été mis à jour avec succès',
      });
    } catch (error) {
      setAlertState({
        visible: true,
        type: 'error',
        title: t('profile.editProfile.error.title') || 'Erreur',
        message: t('profile.editProfile.error.message') || 'Une erreur est survenue lors de la mise à jour',
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, socialUsernames, updateProfile, t]);

  return {
    formData,
    socialUsernames,
    isLoading,
    isProfileLoading,
    alertState,
    handleUpdateFormData,
    handleUpdateSocialUsername,
    handleSave,
    handleCloseAlert,
  };
}; 