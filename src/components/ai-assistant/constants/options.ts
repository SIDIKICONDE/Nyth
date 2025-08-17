import { OptionItem } from '../types';

// Translation function type
type TranslationFunction = (key: string) => string;

export const getToneOptions = (t: TranslationFunction): OptionItem[] => [
  { key: 'professional', label: t('aiAssistant.options.tone.professional'), color: '#3b82f6' },
  { key: 'casual', label: t('aiAssistant.options.tone.casual'), color: '#10b981' },
  { key: 'friendly', label: t('aiAssistant.options.tone.friendly'), color: '#f59e0b' },
  { key: 'authoritative', label: t('aiAssistant.options.tone.authoritative'), color: '#7c3aed' },
  { key: 'humorous', label: t('aiAssistant.options.tone.humorous'), color: '#ef4444' },
  { key: 'dramatic', label: t('aiAssistant.options.tone.dramatic'), color: '#8b5cf6' },
  { key: 'energetic', label: t('aiAssistant.options.tone.energetic'), color: '#f97316' },
  { key: 'educational', label: t('aiAssistant.options.tone.educational'), color: '#06b6d4' },
];

export const getLengthOptions = (t: TranslationFunction): OptionItem[] => [
  { key: 'short', label: t('aiAssistant.options.length.short'), color: '#10b981' },
  { key: 'medium', label: t('aiAssistant.options.length.medium'), color: '#f59e0b' },
  { key: 'long', label: t('aiAssistant.options.length.long'), color: '#ef4444' },
];

export const getPlatformOptions = (): OptionItem[] => [
  { key: 'youtube', label: '📺 YouTube' },
  { key: 'tiktok', label: '📱 TikTok' },
  { key: 'instagram', label: '📸 Instagram' },
  { key: 'linkedin', label: '💼 LinkedIn' },
];

export const getStructureOptions = (t: TranslationFunction): OptionItem[] => [
  { key: 'introduction-development-conclusion', label: t('aiAssistant.options.structure.introduction-development-conclusion') },
  { key: 'problem-solution', label: t('aiAssistant.options.structure.problem-solution') },
  { key: 'story-telling', label: t('aiAssistant.options.structure.story-telling') },
  { key: 'comparison', label: t('aiAssistant.options.structure.comparison') },
  { key: 'list-format', label: t('aiAssistant.options.structure.list-format') },
  { key: 'question-answer', label: t('aiAssistant.options.structure.question-answer') },
];

export const getVocabularyOptions = (t: TranslationFunction): OptionItem[] => [
  { key: 'simple', label: t('aiAssistant.options.vocabulary.simple'), description: t('aiAssistant.options.vocabulary.simpleDesc') },
  { key: 'standard', label: t('aiAssistant.options.vocabulary.standard'), description: t('aiAssistant.options.vocabulary.standardDesc') },
  { key: 'advanced', label: t('aiAssistant.options.vocabulary.advanced'), description: t('aiAssistant.options.vocabulary.advancedDesc') },
];

export const getSentenceLengthOptions = (t: TranslationFunction): OptionItem[] => [
  { key: 'short', label: t('aiAssistant.options.sentenceLength.short') },
  { key: 'medium', label: t('aiAssistant.options.sentenceLength.medium') },
  { key: 'long', label: t('aiAssistant.options.sentenceLength.long') },
  { key: 'mixed', label: t('aiAssistant.options.sentenceLength.mixed') },
];

export const getEmphasisOptions = (t: TranslationFunction): OptionItem[] => [
  { key: 'subtle', label: t('aiAssistant.options.emphasis.subtle') },
  { key: 'bold', label: t('aiAssistant.options.emphasis.bold') },
  { key: 'repetition', label: t('aiAssistant.options.emphasis.repetition') },
  { key: 'exclamation', label: t('aiAssistant.options.emphasis.exclamation') },
];

export const getTabOptions = (t: TranslationFunction) => [
  { key: 'generate', label: t('aiAssistant.options.tabs.generate'), icon: 'auto-awesome' },
  { key: 'personalize', label: t('aiAssistant.options.tabs.personalize'), icon: 'tune' },
  { key: 'correct', label: t('aiAssistant.options.tabs.correct'), icon: 'spellcheck' },
  { key: 'tone', label: t('aiAssistant.options.tabs.tone'), icon: 'music-note' },
] as const;

// Legacy exports for backward compatibility (will be deprecated)
export const TONE_OPTIONS: OptionItem[] = [
  { key: 'professional', label: '💼 Professional', color: '#3b82f6' },
  { key: 'casual', label: '😊 Casual', color: '#10b981' },
  { key: 'friendly', label: '🤝 Friendly', color: '#f59e0b' },
  { key: 'authoritative', label: '👨‍💼 Authoritative', color: '#7c3aed' },
  { key: 'humorous', label: '😄 Humorous', color: '#ef4444' },
  { key: 'dramatic', label: '🎭 Dramatic', color: '#8b5cf6' },
  { key: 'energetic', label: '⚡ Energetic', color: '#f97316' },
  { key: 'educational', label: '🎓 Educational', color: '#06b6d4' },
];

export const LENGTH_OPTIONS: OptionItem[] = [
  { key: 'short', label: '⚡ Short (1-2 min)', color: '#10b981' },
  { key: 'medium', label: '📝 Medium (3-5 min)', color: '#f59e0b' },
  { key: 'long', label: '📚 Long (5-10 min)', color: '#ef4444' },
];

export const PLATFORM_OPTIONS: OptionItem[] = [
  { key: 'youtube', label: '📺 YouTube' },
  { key: 'tiktok', label: '📱 TikTok' },
  { key: 'instagram', label: '📸 Instagram' },
  { key: 'linkedin', label: '💼 LinkedIn' },
];

export const STRUCTURE_OPTIONS: OptionItem[] = [
  { key: 'introduction-development-conclusion', label: '📝 Classic (Intro-Dev-Concl)' },
  { key: 'problem-solution', label: '🔧 Problem-Solution' },
  { key: 'story-telling', label: '📖 Storytelling' },
  { key: 'comparison', label: '⚖️ Comparison' },
  { key: 'list-format', label: '📋 List Format' },
  { key: 'question-answer', label: '❓ Q&A' },
];

export const VOCABULARY_OPTIONS: OptionItem[] = [
  { key: 'simple', label: '🟢 Simple', description: 'Accessible to all' },
  { key: 'standard', label: '🟡 Standard', description: 'Clear and professional' },
  { key: 'advanced', label: '🔴 Advanced', description: 'Technical terms' },
];

export const SENTENCE_LENGTH_OPTIONS: OptionItem[] = [
  { key: 'short', label: '⚡ Very short (8-12 words)' },
  { key: 'medium', label: '📝 Medium (15-20 words)' },
  { key: 'long', label: '📚 Long (20-25 words)' },
  { key: 'mixed', label: '🎭 Varied' },
];

export const EMPHASIS_OPTIONS: OptionItem[] = [
  { key: 'subtle', label: '💫 Subtle' },
  { key: 'bold', label: '💪 BOLD' },
  { key: 'repetition', label: '🔁 Repetition' },
  { key: 'exclamation', label: '❗ Exclamations' },
];

export const TAB_OPTIONS = [
  { key: 'generate', label: '✨ Generate', icon: 'auto-awesome' },
  { key: 'personalize', label: '🎨 Personalize', icon: 'tune' },
  { key: 'correct', label: '📝 Correct', icon: 'spellcheck' },
  { key: 'tone', label: '🎭 Tone', icon: 'music-note' },
] as const; 