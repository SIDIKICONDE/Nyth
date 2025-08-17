import { useState } from 'react';
import { AIAssistantState, PersonalizationState, GenerationOptionsState, AIAssistantTab } from '../types';
import { AIPrompt } from '../../../types/ai';

const initialState: AIAssistantState = {
  isVisible: false,
  activeTab: 'generate',
  isLoading: false,
  prompt: '',
  tone: 'professional',
  duration: 'medium',
  topic: '',
  audience: '',
  platform: 'youtube',
};

const initialPersonalization: PersonalizationState = {
  characterCount: undefined,
  paragraphCount: undefined,
  sentenceLength: 'medium',
  vocabulary: 'standard',
  scriptStructure: 'introduction-development-conclusion',
  includePersonalAnecdotes: false,
  includeStatistics: false,
  includeQuestions: false,
  emphasisStyle: 'subtle',
  readingPace: 'normal',
};

const initialOptions: GenerationOptionsState = {
  includeHooks: true,
  includeCallToAction: true,
  includeHashtags: true,
  customInstructions: '',
  useNumberedPoints: false,
  useBulletPoints: false,
  includeTransitions: true,
  addTimestamps: false,
  useExamples: true,
  includeMetaphors: false,
  addEmojis: false,
};

export function useAIAssistantState() {
  const [state, setState] = useState<AIAssistantState>(initialState);
  const [personalization, setPersonalization] = useState<PersonalizationState>(initialPersonalization);
  const [options, setOptions] = useState<GenerationOptionsState>(initialOptions);

  // Fonctions pour mettre à jour l'état principal
  const setIsVisible = (visible: boolean) => {
    setState(prev => ({ ...prev, isVisible: visible }));
  };

  const setActiveTab = (tab: AIAssistantTab) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  const setIsLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  const setPrompt = (prompt: string) => {
    setState(prev => ({ ...prev, prompt }));
  };

  const setTone = (tone: AIPrompt['tone']) => {
    setState(prev => ({ ...prev, tone }));
  };

  const setDuration = (duration: AIPrompt['duration']) => {
    setState(prev => ({ ...prev, duration }));
  };

  const setPlatform = (platform: AIPrompt['platform']) => {
    setState(prev => ({ ...prev, platform }));
  };

  const setAudience = (audience: string) => {
    setState(prev => ({ ...prev, audience }));
  };

  // Fonctions pour mettre à jour la personnalisation
  const updatePersonalization = <K extends keyof PersonalizationState>(
    key: K,
    value: PersonalizationState[K]
  ) => {
    setPersonalization(prev => ({ ...prev, [key]: value }));
  };

  // Fonctions pour mettre à jour les options
  const updateOptions = <K extends keyof GenerationOptionsState>(
    key: K,
    value: GenerationOptionsState[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  // Fonction pour réinitialiser le prompt
  const resetPrompt = () => {
    setPrompt('');
  };

  return {
    // État
    state,
    personalization,
    options,
    
    // Actions état principal
    setIsVisible,
    setActiveTab,
    setIsLoading,
    setPrompt,
    setTone,
    setDuration,
    setPlatform,
    setAudience,
    resetPrompt,
    
    // Actions personnalisation
    updatePersonalization,
    
    // Actions options
    updateOptions,
  };
} 