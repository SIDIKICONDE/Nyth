import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../../types';
import { getEnabledProviders, AI_PROVIDERS } from '../../../../config/aiConfig';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const useAPIValidation = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  const checkAndEnableAPIs = async (): Promise<boolean> => {
    try {
      // Vérifier les clés API disponibles
      const { AIUtilsService } = await import('../../../../services/ai/AIService');
      const apiKeys = await AIUtilsService.checkConfiguredAPIKeys();
      const hasAnyKey = Object.values(apiKeys).some(hasKey => hasKey);

      if (!hasAnyKey) {
        Alert.alert(
          t('common.error'),
          t('ai.error.noApiKey', 'Aucune clé API configurée. Veuillez configurer au moins une clé API dans les paramètres.'),
          [
            {
              text: t('common.cancel'),
              style: 'cancel'
            },
            {
              text: t('settings.title'),
              onPress: () => navigation.navigate('AISettings')
            }
          ]
        );
        return false;
      }

      // Activer automatiquement les APIs qui ont des clés
      let activated = false;
      
      if (apiKeys.openAI && (await AsyncStorage.getItem('use_custom_api')) !== 'true') {
        await AsyncStorage.setItem('use_custom_api', 'true');
        activated = true;
      }
      
      if (apiKeys.gemini && (await AsyncStorage.getItem('use_gemini')) !== 'true') {
        await AsyncStorage.setItem('use_gemini', 'true');
        activated = true;
      }
      
      if (apiKeys.mistral && (await AsyncStorage.getItem('use_mistral')) !== 'true') {
        await AsyncStorage.setItem('use_mistral', 'true');
        activated = true;
      }
      
      if (apiKeys.cohere && (await AsyncStorage.getItem('use_cohere')) !== 'true') {
        await AsyncStorage.setItem('use_cohere', 'true');
        activated = true;
      }
      
      if (apiKeys.huggingFace && (await AsyncStorage.getItem('use_huggingface')) !== 'true') {
        await AsyncStorage.setItem('use_huggingface', 'true');
        activated = true;
      }

      if (activated) {}

      // Vérifier qu'au moins un provider est maintenant activé
      const providers = await getEnabledProviders();
      const mainProviders = providers;
      
      if (mainProviders.length === 0) {
        Alert.alert(
          t('common.error'),
          t('ai.error.noActiveProvider', 'Aucun fournisseur AI actif. Veuillez activer au moins un fournisseur dans les paramètres.'),
          [
            {
              text: t('common.cancel'),
              style: 'cancel'
            },
            {
              text: t('settings.title'),
              onPress: () => navigation.navigate('AISettings')
            }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  return { checkAndEnableAPIs };
}; 