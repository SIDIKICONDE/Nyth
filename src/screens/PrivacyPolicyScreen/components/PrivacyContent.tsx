import * as React from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import tw from 'twrnc';
import { PrivacyContentProps } from '../types';
import { createPrivacyData } from '../constants/privacyData';
import { PrivacySectionItem } from './PrivacySectionItem';
import { useTranslation } from '../../../hooks/useTranslation';

export const PrivacyContent = ({ onScroll, hasScrolledToBottom, currentTheme }: PrivacyContentProps) => {
  const { t } = useTranslation();
  const privacyData = createPrivacyData(t);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);
  
  React.useEffect(() => {
    if (!hasScrolledToBottom) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [hasScrolledToBottom]);
  
  return (
    <ScrollView
      style={tw`flex-1`}
      contentContainerStyle={tw`p-4 pb-6`}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      {/* Introduction avec design moderne */}
      <Animated.View style={[
        tw`mb-6`,
        { opacity: fadeAnim }
      ]}>
        <LinearGradient
          colors={[currentTheme.colors.primary + '10', currentTheme.colors.primary + '05']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`p-4 rounded-2xl mb-4`}
        >
          <Text style={[
            tw`text-lg font-bold mb-2`,
            { color: currentTheme.colors.text }
          ]}>
            {t('privacy.welcome', '🔒 Bienvenue sur CamPrompt AI')}
          </Text>
          <Text style={[
            tw`text-sm leading-6`,
            { color: currentTheme.colors.textSecondary, lineHeight: 22 }
          ]}>
            {t('privacy.introduction', 'Cette politique de confidentialité explique comment nous protégeons vos données personnelles.')}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Sections principales avec animations */}
      {privacyData.map((section, index) => (
        <PrivacySectionItem
          key={index}
          section={section}
          index={index}
          currentTheme={currentTheme}
        />
      ))}

      {/* Note importante avec nouveau design */}
      <View style={[
        tw`p-4 rounded-2xl mb-6 border`,
        { 
          backgroundColor: currentTheme.colors.warning + '10',
          borderColor: currentTheme.colors.warning + '30'
        }
      ]}>
        <Text style={[
          tw`font-bold mb-1`,
          { color: currentTheme.colors.warning }
        ]}>
          {t('privacy.importantNote', 'Note Importante')}
        </Text>
        <Text style={[
          tw`text-sm leading-5`,
          { color: currentTheme.colors.text }
        ]}>
          {t('privacy.importantNoteContent', 'En utilisant cette application, vous acceptez cette politique de confidentialité.')}
        </Text>
      </View>

      {/* Indicateur de défilement amélioré */}
      {!hasScrolledToBottom && (
        <Animated.View style={[
          tw`items-center py-4`,
          { transform: [{ scale: pulseAnim }] }
        ]}>
          <LinearGradient
            colors={[currentTheme.colors.primary + '20', currentTheme.colors.primary + '10']}
            style={tw`px-6 py-3 rounded-full flex-row items-center`}
          >
            <MaterialCommunityIcons
              name="gesture-swipe-down"
              size={20}
              color={currentTheme.colors.primary}
              style={tw`mr-2`}
            />
            <Text style={[
              tw`text-sm font-medium`,
              { color: currentTheme.colors.primary }
            ]}>
              {t('privacy.scrollToContinue', 'Faites défiler pour continuer')}
            </Text>
          </LinearGradient>
        </Animated.View>
      )}
    </ScrollView>
  );
}; 