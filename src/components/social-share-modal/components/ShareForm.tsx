import React from 'react';
import { View, Text, TextInput } from 'react-native';
import tw from 'twrnc';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from '../../../hooks/useTranslation';
import { ShareFormProps } from '../types';

export const ShareForm: React.FC<ShareFormProps> = ({
  platform,
  formData,
  onFormChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[
      tw`p-3 rounded-lg mb-4`,
      {
        backgroundColor: currentTheme.colors.surface,
        borderWidth: 1,
        borderColor: currentTheme.colors.border
      }
    ]}>
      <Text style={[
        tw`text-base font-semibold mb-3`,
        { color: currentTheme.colors.text }
      ]}>
        ✏️ {t('socialShare.form.customize', 'Personnaliser')}
      </Text>

      {/* Titre */}
      <View style={tw`mb-3`}>
        <Text style={[
          tw`text-xs font-medium mb-1`,
          { color: currentTheme.colors.textSecondary }
        ]}>
          {t('socialShare.form.title', 'Titre')}
        </Text>
        <TextInput
          value={formData.title}
          onChangeText={(title) => onFormChange({ title })}
          placeholder={t('socialShare.form.titlePlaceholder', 'Titre de votre vidéo...')}
          style={[
            tw`p-2 rounded border`,
            {
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text
            }
          ]}
          placeholderTextColor={currentTheme.colors.textSecondary}
        />
      </View>

      {/* Description */}
      <View style={tw`mb-3`}>
        <Text style={[
          tw`text-xs font-medium mb-1`,
          { color: currentTheme.colors.textSecondary }
        ]}>
          {t('socialShare.form.description', 'Description')}
        </Text>
        <TextInput
          value={formData.description}
          onChangeText={(description) => onFormChange({ description })}
          placeholder={t('socialShare.form.descriptionPlaceholder', 'Décrivez votre vidéo...')}
          multiline
          numberOfLines={2}
          style={[
            tw`p-2 rounded border`,
            {
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
              textAlignVertical: 'top'
            }
          ]}
          placeholderTextColor={currentTheme.colors.textSecondary}
        />
      </View>

      {/* Hashtags */}
      <View style={tw`mb-3`}>
        <Text style={[
          tw`text-xs font-medium mb-1`,
          { color: currentTheme.colors.textSecondary }
        ]}>
          {t('socialShare.form.hashtags', 'Hashtags')}
        </Text>
        <TextInput
          value={formData.hashtags}
          onChangeText={(hashtags) => onFormChange({ hashtags })}
          placeholder={t('socialShare.form.hashtagsPlaceholder', '#hashtag1 #hashtag2')}
          style={[
            tw`p-2 rounded border`,
            {
              backgroundColor: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text
            }
          ]}
          placeholderTextColor={currentTheme.colors.textSecondary}
        />
      </View>

      {/* Aperçu */}
      <View style={[
        tw`p-2 rounded`,
        { backgroundColor: platform.color + '10' }
      ]}>
        <Text style={[
          tw`text-xs font-semibold mb-1`,
          { color: platform.color }
        ]}>
          👀 {t('socialShare.form.preview', 'Aperçu')}
        </Text>
        <Text style={[
          tw`text-xs`,
          { color: currentTheme.colors.text }
        ]}>
          {formData.title || t('socialShare.form.titlePlaceholder', 'Titre de votre vidéo')}
          {formData.description && `\n${formData.description}`}
          {formData.hashtags && `\n${formData.hashtags}`}
        </Text>
      </View>
    </View>
  );
}; 