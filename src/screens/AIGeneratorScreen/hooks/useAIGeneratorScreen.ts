import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from '../../../hooks/useTranslation';
import { RootStackParamList } from '../../../types';
import { SCRIPT_DURATION, getEnabledProviders } from '../../../config/aiConfig';
import { AIStatusIndicatorRef } from '../../../components/ai/AIStatusIndicator';
import { useUserPreferences } from './useUserPreferences';
import { useScriptGeneration } from './useScriptGeneration';

type AIGeneratorScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AIGenerator'>;

export const useAIGeneratorScreen = () => {
  const navigation = useNavigation<AIGeneratorScreenNavigationProp>();
  const { t } = useTranslation();
  
  // Référence pour l'indicateur de statut AI
  const statusIndicatorRef = useRef<AIStatusIndicatorRef>(null);
  
  // États principaux
  const [topic, setTopic] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('tiktok');
  const [tone, setTone] = useState('casual');
  const [duration, setDuration] = useState(SCRIPT_DURATION.MEDIUM.seconds);
  const [creativity, setCreativity] = useState(0.7);
  const [maxCharacters, setMaxCharacters] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);

  // Utiliser les hooks personnalisés
  useUserPreferences(
    setSelectedPlatform,
    setTone,
    setDuration,
    setCreativity,
    setMaxCharacters,
    selectedPlatform,
    tone,
    duration,
    creativity,
    maxCharacters
  );

  const { handleGenerate } = useScriptGeneration();

  // Tracer l'affichage de l'écran
  useEffect(() => {
    // Recharger les préférences API au montage pour s'assurer qu'elles sont à jour
    const refreshApiStatus = async () => {
      try {
        // Vérifie si les API sont activées et mises à jour
        const enabledProviders = await getEnabledProviders();

        // Forcer un rafraîchissement du hook useAIStatus
        if (statusIndicatorRef.current && statusIndicatorRef.current.refresh) {
          statusIndicatorRef.current.refresh();
        }
      } catch (error) {}
    };

    refreshApiStatus();

    return () => {};
  }, [t]);

  // Navigation vers les paramètres avec authentification si nécessaire
  const handleNavigateToSettings = async () => {
    navigation.navigate('AISettings');
  };

  // Wrapper pour handleGenerate avec les paramètres actuels
  const onGenerate = () => {
    handleGenerate(
      topic,
      selectedPlatform,
      tone,
      duration,
      creativity,
      maxCharacters,
      setIsLoading
    );
  };

  return {
    // Refs
    statusIndicatorRef,
    
    // States
    topic,
    setTopic,
    selectedPlatform,
    setSelectedPlatform,
    tone,
    setTone,
    duration,
    setDuration,
    creativity,
    setCreativity,
    maxCharacters,
    setMaxCharacters,
    isLoading,
    
    // Handlers
    handleNavigateToSettings,
    onGenerate
  };
}; 