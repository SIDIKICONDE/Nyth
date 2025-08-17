import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../contexts/ThemeContext';
import tw from 'twrnc';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export const LanguageSelector: React.FC = () => {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const { currentLanguage, changeLanguage, availableLanguages, getCurrentLanguage } = useLanguage();

  const handleLanguageChange = (languageCode: string) => {
    if (languageCode === currentLanguage) return;
    
    Alert.alert(
      t('settings.language.changeTitle', 'Change Language'),
      t('settings.language.changeMessage', 'Do you want to change the language to {{language}}?', { 
        language: availableLanguages.find(l => l.code === languageCode)?.name 
      }),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('common.continue', 'Continue'),
          onPress: () => changeLanguage(languageCode),
        },
      ]
    );
  };

  const currentLang = getCurrentLanguage();

  return (
    <View style={[
      tw`px-4 py-3 rounded-lg`,
      { backgroundColor: currentTheme.colors.surface }
    ]}>
      <View style={tw`flex-row items-center justify-between`}>
        <View style={tw`flex-row items-center flex-1`}>
          <MaterialIcons 
            name="language" 
            size={24} 
            color={currentTheme.colors.primary} 
            style={tw`mr-3`}
          />
          <View style={tw`flex-1`}>
            <Text style={[
              tw`text-base font-medium`,
              { color: currentTheme.colors.text }
            ]}>
              {t('common.language', 'Language')}
            </Text>
            <Text style={[
              tw`text-sm mt-0.5`,
              { color: currentTheme.colors.textSecondary }
            ]}>
              {currentLang.flag} {currentLang.name}
            </Text>
          </View>
        </View>
        
        <View style={tw`flex-row items-center`}>
          {availableLanguages.map((language, index) => (
            <TouchableOpacity
              key={language.code}
              style={[
                tw`px-3 py-1.5 rounded-md`,
                index > 0 && tw`ml-2`,
                currentLanguage === language.code 
                  ? { backgroundColor: currentTheme.colors.primary }
                  : { backgroundColor: currentTheme.colors.surface }
              ]}
              onPress={() => handleLanguageChange(language.code)}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  tw`text-sm font-medium`,
                  { 
                    color: currentLanguage === language.code 
                      ? '#FFFFFF'
                      : currentTheme.colors.textSecondary 
                  }
                ]}
              >
                {language.code.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}; 