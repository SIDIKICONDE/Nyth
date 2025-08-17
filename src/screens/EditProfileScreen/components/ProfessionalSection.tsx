import React from 'react';
import { View, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import tw from 'twrnc';
import { UserProfileUpdate } from '../../../types/user';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from '../../../hooks/useTranslation';
import { InputField } from './InputField';

interface ProfessionalSectionProps {
  formData: UserProfileUpdate;
  onUpdateFormData: (data: Partial<UserProfileUpdate>) => void;
}

export const ProfessionalSection: React.FC<ProfessionalSectionProps> = ({
  formData,
  onUpdateFormData,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={tw`flex-1`}>
      {/* En-tête de section avec gradient */}
      <LinearGradient
        colors={['#2563EB', '#1E40AF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          tw`p-6 rounded-3xl mb-6`,
          {
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }
        ]}
      >
        <View style={tw`flex-row items-center`}>
          <View style={[
            tw`p-3 rounded-2xl mr-4`,
            { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
          ]}>
            <MaterialCommunityIcons 
              name="briefcase" 
              size={28} 
              color="#FFFFFF" 
            />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-2xl font-bold text-white`}>
              {t('profile.editProfile.sections.professional')}
            </Text>
            <Text style={tw`text-sm mt-1 text-white opacity-90`}>
              Informations professionnelles et carrière
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Champs du formulaire avec nouveau style */}
      <View style={[
        tw`rounded-3xl overflow-hidden`,
        { 
          backgroundColor: currentTheme.colors.surface,
        }
      ]}>
        {/* Effet de bordure gradient */}
        <LinearGradient
          colors={['#2563EB20', '#2563EB05']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`p-0.5`}
        >
          <View style={[
            tw`p-6 rounded-3xl`,
            { 
              backgroundColor: currentTheme.colors.surface,
            }
          ]}>
            <InputField
              label={t('profile.editProfile.fields.profession')}
              value={formData.profession || ''}
              onChangeText={(text) => onUpdateFormData({ profession: text })}
              placeholder={t('profile.editProfile.placeholders.profession') || 'Profession'}
              icon="account-tie"
            />

            <InputField
              label={t('profile.editProfile.fields.company')}
              value={formData.company || ''}
              onChangeText={(text) => onUpdateFormData({ company: text })}
              placeholder={t('profile.editProfile.placeholders.company') || 'Entreprise'}
              icon="office-building"
            />

            <InputField
              label={t('profile.editProfile.fields.website')}
              value={formData.website || ''}
              onChangeText={(text) => onUpdateFormData({ website: text })}
              placeholder={t('profile.editProfile.placeholders.website') || 'Site web'}
              icon="web"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}; 