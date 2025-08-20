import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../../../../hooks/useTranslation';
import { AIPrompt } from '../../../../types/ai';
import { AIService } from '../../../../services/ai/AIService';
import { TemplateManager, ScriptTemplate } from '../../../../services/ai/TemplateManager';
import { PreferenceAnalyzer } from '../../../../services/ai/PreferenceAnalyzer';
import { createScript } from '../utils/scriptCreator';
import { detectLanguage } from '../../../../utils/languageDetector';
import { useNavigation } from '@react-navigation/native';

export type GeneratorTab = 'basic' | 'advanced' | 'templates';

export const useAdvancedAIGenerator = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  // Main states
  const [activeTab, setActiveTab] = useState<GeneratorTab>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState<AIPrompt>({
    topic: '',
    platform: 'youtube',
    tone: 'professional',
    duration: 'medium',
    language: 'auto',
    creativity: 0.7,
  });
  
  // Template state
  const [templates, setTemplates] = useState<ScriptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const loadedTemplates = await TemplateManager.getTemplates();
        setTemplates(loadedTemplates);
        
        // Select first template by default
        if (loadedTemplates.length > 0 && !selectedTemplate) {
          setSelectedTemplate(loadedTemplates[0].id);
        }
      } catch (error) {}
    };
    
    loadTemplates();
  }, []);
  
  // Load suggested preferences
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const suggestions = await PreferenceAnalyzer.getSuggestedParameters();
        
        // Only update if suggestions exist
        if (Object.keys(suggestions).length > 0) {
          setPrompt(prev => ({
            ...prev,
            ...suggestions,
          }));
        }
      } catch (error) {}
    };
    
    loadSuggestions();
  }, []);
  
  // Generate script from template
  const handleGenerateFromTemplate = async () => {
    if (!selectedTemplate) {
      Alert.alert(t('common.error'), t('ai.templates.noTemplateSelected'));
      return;
    }
    
    if (!prompt.topic) {
      Alert.alert(t('common.error'), t('ai.error.noTopic'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Automatically detect language
      const detectedLanguage = detectLanguage(prompt.topic);
      
      const result = await TemplateManager.generateFromTemplate(
        selectedTemplate,
        prompt.topic,
        {
          language: detectedLanguage,
          creativity: prompt.creativity,
        }
      );
      
      // Create new script
      await createScript({
        content: result,
        topic: prompt.topic,
        prompt,
        t
      });
      
      // Record this generation in history
      await PreferenceAnalyzer.recordGenerationUsage(prompt, true);
      
    } catch (error) {
      Alert.alert(t('common.error'), t('ai.templates.generationError'));

      // Record this failed generation in history
      await PreferenceAnalyzer.recordGenerationUsage(prompt, false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate standard script
  const handleGenerate = async () => {
    if (!prompt.topic) {
      Alert.alert(t('common.error'), t('ai.error.noTopic'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Automatically detect language
      const detectedLanguage = detectLanguage(prompt.topic);
      
      // Generate with standard AI service
      const result = await AIService.generateScript({
        ...prompt,
        language: detectedLanguage
      });
      
      // Create new script
      await createScript({
        content: result.content,
        topic: prompt.topic,
        prompt: {
          ...prompt,
          language: detectedLanguage
        },
        t
      });
      
      // Record this generation in history
      await PreferenceAnalyzer.recordGenerationUsage(prompt, true);
      
    } catch (error) {
      Alert.alert(t('common.error'), t('ai.error.generationError'));

      // Record this failed generation in history
      await PreferenceAnalyzer.recordGenerationUsage(prompt, false);
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    // States
    activeTab,
    setActiveTab,
    isLoading,
    prompt,
    setPrompt,
    templates,
    selectedTemplate,
    setSelectedTemplate,
    
    // Actions
    handleGenerateFromTemplate,
    handleGenerate,
  };
}; 