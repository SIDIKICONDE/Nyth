import { AIPrompt, AIGenerationOptions } from '../../../types/ai';

export interface AIAssistantProps {
  isDarkMode: boolean;
  onScriptGenerated: (title: string, content: string) => void;
  currentText?: string;
  onTextCorrected?: (correctedText: string) => void;
}

export type AIAssistantTab = 'generate' | 'personalize' | 'correct' | 'tone';

export interface AIAssistantState {
  isVisible: boolean;
  activeTab: AIAssistantTab;
  isLoading: boolean;
  prompt: string;
  tone: AIPrompt['tone'];
  duration: AIPrompt['duration'];
  topic: string;
  audience: string;
  platform: AIPrompt['platform'];
}

export interface PersonalizationState {
  characterCount?: number;
  paragraphCount?: number;
  sentenceLength: AIPrompt['sentenceLength'];
  vocabulary: AIPrompt['vocabulary'];
  scriptStructure: AIPrompt['scriptStructure'];
  includePersonalAnecdotes: boolean;
  includeStatistics: boolean;
  includeQuestions: boolean;
  emphasisStyle: AIPrompt['emphasisStyle'];
  readingPace: AIPrompt['readingPace'];
}

export interface GenerationOptionsState {
  includeHooks: boolean;
  includeCallToAction: boolean;
  includeHashtags: boolean;
  customInstructions: string;
  useNumberedPoints: boolean;
  useBulletPoints: boolean;
  includeTransitions: boolean;
  addTimestamps: boolean;
  useExamples: boolean;
  includeMetaphors: boolean;
  addEmojis: boolean;
}

export interface OptionItem {
  key: string;
  label: string;
  color?: string;
  description?: string;
} 