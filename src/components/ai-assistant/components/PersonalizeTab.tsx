import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { OptionButton } from './OptionButton';
import { 
  getStructureOptions, 
  getVocabularyOptions, 
  getSentenceLengthOptions, 
  getEmphasisOptions 
} from '../constants/options';
import { PersonalizationState } from '../types';
import { AIPrompt } from '../../../types/ai';
import { useTranslation } from '../../../hooks/useTranslation';

interface PersonalizeTabProps {
  personalization: PersonalizationState;
  isDarkMode: boolean;
  onUpdate: <K extends keyof PersonalizationState>(key: K, value: PersonalizationState[K]) => void;
}

export function PersonalizeTab({
  personalization,
  isDarkMode,
  onUpdate
}: PersonalizeTabProps) {
  const { t } = useTranslation();

  return (
    <View>
      <Text style={[
        tw`text-lg font-semibold mb-4`,
        { color: isDarkMode ? '#ffffff' : '#1e293b' }
      ]}>
        {t('ai.assistant.personalize.title')}
      </Text>

      {/* Character count */}
      <View style={tw`mb-4`}>
        <Text style={[
          tw`text-sm font-medium mb-2`,
          { color: isDarkMode ? '#cccccc' : '#4b5563' }
        ]}>
          {t('ai.assistant.personalize.characterCount')}
        </Text>
        <TextInput
          style={[
            tw`p-3 rounded-lg text-base`,
            {
              backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
              borderWidth: 1,
              borderColor: isDarkMode ? '#2a2a2a' : '#e2e8f0',
              color: isDarkMode ? '#ffffff' : '#000000',
            }
          ]}
          placeholder={t('ai.assistant.personalize.characterPlaceholder')}
          placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
          value={personalization.characterCount?.toString() || ''}
          onChangeText={(text) => onUpdate('characterCount', text ? parseInt(text) || undefined : undefined)}
          keyboardType="numeric"
        />
      </View>

      {/* Paragraph count */}
      <View style={tw`mb-4`}>
        <Text style={[
          tw`text-sm font-medium mb-2`,
          { color: isDarkMode ? '#cccccc' : '#4b5563' }
        ]}>
          {t('ai.assistant.personalize.paragraphCount')}
        </Text>
        <TextInput
          style={[
            tw`p-3 rounded-lg text-base`,
            {
              backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
              borderWidth: 1,
              borderColor: isDarkMode ? '#2a2a2a' : '#e2e8f0',
              color: isDarkMode ? '#ffffff' : '#000000',
            }
          ]}
          placeholder={t('ai.assistant.personalize.paragraphPlaceholder')}
          placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
          value={personalization.paragraphCount?.toString() || ''}
          onChangeText={(text) => onUpdate('paragraphCount', text ? parseInt(text) || undefined : undefined)}
          keyboardType="numeric"
        />
      </View>

      {/* Script structure */}
      <View style={tw`mb-4`}>
        <Text style={[
          tw`text-sm font-medium mb-2`,
          { color: isDarkMode ? '#cccccc' : '#4b5563' }
        ]}>
          {t('ai.assistant.personalize.scriptStructure')}
        </Text>
        <View style={tw`flex-row flex-wrap gap-2`}>
          {getStructureOptions(t).map((option) => (
            <OptionButton
              key={option.key}
              option={option}
              isSelected={personalization.scriptStructure === option.key}
              onPress={() => onUpdate('scriptStructure', option.key as AIPrompt['scriptStructure'])}
              isDarkMode={isDarkMode}
            />
          ))}
        </View>
      </View>

      {/* Vocabulary */}
      <View style={tw`mb-4`}>
        <Text style={[
          tw`text-sm font-medium mb-2`,
          { color: isDarkMode ? '#cccccc' : '#4b5563' }
        ]}>
          {t('ai.assistant.personalize.vocabularyLevel')}
        </Text>
        <View style={tw`flex-row flex-wrap gap-2`}>
          {getVocabularyOptions(t).map((option) => (
            <OptionButton
              key={option.key}
              option={option}
              isSelected={personalization.vocabulary === option.key}
              onPress={() => onUpdate('vocabulary', option.key as AIPrompt['vocabulary'])}
              isDarkMode={isDarkMode}
            />
          ))}
        </View>
      </View>

      {/* Sentence length */}
      <View style={tw`mb-4`}>
        <Text style={[
          tw`text-sm font-medium mb-2`,
          { color: isDarkMode ? '#cccccc' : '#4b5563' }
        ]}>
          {t('ai.assistant.personalize.sentenceLength')}
        </Text>
        <View style={tw`flex-row flex-wrap gap-2`}>
          {getSentenceLengthOptions(t).map((option) => (
            <OptionButton
              key={option.key}
              option={option}
              isSelected={personalization.sentenceLength === option.key}
              onPress={() => onUpdate('sentenceLength', option.key as AIPrompt['sentenceLength'])}
              isDarkMode={isDarkMode}
            />
          ))}
        </View>
      </View>

      {/* Emphasis style */}
      <View style={tw`mb-4`}>
        <Text style={[
          tw`text-sm font-medium mb-2`,
          { color: isDarkMode ? '#cccccc' : '#4b5563' }
        ]}>
          {t('ai.assistant.personalize.emphasisStyle')}
        </Text>
        <View style={tw`flex-row flex-wrap gap-2`}>
          {getEmphasisOptions(t).map((option) => (
            <OptionButton
              key={option.key}
              option={option}
              isSelected={personalization.emphasisStyle === option.key}
              onPress={() => onUpdate('emphasisStyle', option.key as AIPrompt['emphasisStyle'])}
              isDarkMode={isDarkMode}
            />
          ))}
        </View>
      </View>

      {/* Boolean options */}
      <View style={tw`mb-4`}>
        <Text style={[
          tw`text-sm font-medium mb-2`,
          { color: isDarkMode ? '#cccccc' : '#4b5563' }
        ]}>
          {t('ai.assistant.personalize.includeInScript')}
        </Text>
        
        {[
          { key: 'includePersonalAnecdotes', label: t('ai.assistant.personalize.personalAnecdotes') },
          { key: 'includeStatistics', label: t('ai.assistant.personalize.statistics') },
          { key: 'includeQuestions', label: t('ai.assistant.personalize.rhetoricalQuestions') },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => onUpdate(item.key as keyof PersonalizationState, !personalization[item.key as keyof PersonalizationState])}
            style={[
              tw`flex-row items-center p-3 rounded-lg mb-2`,
              {
                backgroundColor: personalization[item.key as keyof PersonalizationState] 
                  ? '#8b5cf6' 
                  : (isDarkMode ? '#2a2a2a' : '#f1f5f9')
              }
            ]}
          >
            <Text style={[
              tw`text-sm font-medium`,
              { 
                color: personalization[item.key as keyof PersonalizationState] 
                  ? '#ffffff' 
                  : (isDarkMode ? '#ffffff' : '#1e293b') 
              }
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
} 