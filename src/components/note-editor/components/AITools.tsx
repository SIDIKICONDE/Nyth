import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import tw from 'twrnc';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from '../../../hooks/useTranslation';
import { useNoteAI } from '../hooks/useNoteAI';
import { Note } from '../types';

interface AIToolsProps {
  note: Note;
  onContentUpdate: (content: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function AITools({
  note,
  onContentUpdate,
  isVisible,
  onClose,
}: AIToolsProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const {
    isLoading,
    analysis,
    aiActions,
    analyzeNote,
    executeAction,
    suggestTitle,
    suggestTags,
  } = useNoteAI();

  const [activeTab, setActiveTab] = useState<'actions' | 'analysis'>('actions');

  const handleAction = async (actionId: string) => {
    try {
      const result = await executeAction(actionId, note.content);
      onContentUpdate(result);
    } catch (error) {
      console.error('AI action failed:', error);
    }
  };

  const handleAnalyze = async () => {
    try {
      await analyzeNote(note.content);
      setActiveTab('analysis');
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleSuggestTitle = async () => {
    try {
      const title = await suggestTitle(note.content);
      // Here you would update the note title through a callback
      console.log('Suggested title:', title);
    } catch (error) {
      console.error('Title suggestion failed:', error);
    }
  };

  const renderActionsTab = () => (
    <ScrollView style={tw`flex-1 px-4`}>
      {/* Quick Actions */}
      <View style={tw`mb-6`}>
        <Text
          style={[
            tw`text-lg font-semibold mb-3`,
            { color: currentTheme.colors.text }
          ]}
        >
          Actions rapides
        </Text>

        <View style={tw`flex-row space-x-2 mb-4`}>
          <TouchableOpacity
            onPress={handleAnalyze}
            disabled={isLoading}
            style={[
              tw`flex-1 py-3 px-4 rounded-lg items-center`,
              {
                backgroundColor: isLoading
                  ? currentTheme.colors.textMuted + '20'
                  : currentTheme.colors.primary + '20',
              }
            ]}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="analytics"
              size={20}
              color={isLoading ? currentTheme.colors.textMuted : currentTheme.colors.primary}
            />
            <Text
              style={[
                tw`text-sm font-medium mt-1`,
                {
                  color: isLoading
                    ? currentTheme.colors.textMuted
                    : currentTheme.colors.primary,
                }
              ]}
            >
              Analyser
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSuggestTitle}
            disabled={isLoading}
            style={[
              tw`flex-1 py-3 px-4 rounded-lg items-center`,
              {
                backgroundColor: isLoading
                  ? currentTheme.colors.textMuted + '20'
                  : currentTheme.colors.secondary + '20',
              }
            ]}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="title"
              size={20}
              color={isLoading ? currentTheme.colors.textMuted : currentTheme.colors.secondary}
            />
            <Text
              style={[
                tw`text-sm font-medium mt-1`,
                {
                  color: isLoading
                    ? currentTheme.colors.textMuted
                    : currentTheme.colors.secondary,
                }
              ]}
            >
              Titre
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Actions */}
      <View>
        <Text
          style={[
            tw`text-lg font-semibold mb-3`,
            { color: currentTheme.colors.text }
          ]}
        >
          Actions IA
        </Text>

        {aiActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => handleAction(action.id)}
            disabled={isLoading}
            style={[
              tw`flex-row items-center p-4 rounded-lg mb-2`,
              {
                backgroundColor: currentTheme.colors.surface,
                borderWidth: 1,
                borderColor: currentTheme.colors.border,
              }
            ]}
            activeOpacity={0.7}
          >
            <View style={[
              tw`w-10 h-10 rounded-lg items-center justify-center mr-3`,
              { backgroundColor: currentTheme.colors.primary + '20' }
            ]}>
              <MaterialIcons
                name={action.icon as any}
                size={20}
                color={currentTheme.colors.primary}
              />
            </View>

            <View style={tw`flex-1`}>
              <Text
                style={[
                  tw`font-semibold`,
                  { color: currentTheme.colors.text }
                ]}
              >
                {action.name}
              </Text>
              <Text
                style={[
                  tw`text-sm`,
                  { color: currentTheme.colors.textMuted }
                ]}
              >
                {action.description}
              </Text>
            </View>

            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={currentTheme.colors.primary}
              />
            ) : (
              <MaterialIcons
                name="arrow-forward"
                size={20}
                color={currentTheme.colors.textMuted}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderAnalysisTab = () => {
    if (!analysis) {
      return (
        <View style={[tw`flex-1 items-center justify-center`, { backgroundColor: currentTheme.colors.background }]}>
          <MaterialIcons
            name="analytics"
            size={48}
            color={currentTheme.colors.textMuted}
          />
          <Text style={[tw`mt-4 text-center`, { color: currentTheme.colors.textMuted }]}>
            Cliquez sur "Analyser" pour voir l'analyse de votre note
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={tw`flex-1 px-4`}>
        {/* Summary */}
        <View style={tw`mb-6`}>
          <Text
            style={[
              tw`text-lg font-semibold mb-3`,
              { color: currentTheme.colors.text }
            ]}
          >
            Résumé
          </Text>
          <Text
            style={[
              tw`text-sm p-3 rounded-lg`,
              {
                color: currentTheme.colors.text,
                backgroundColor: currentTheme.colors.surface,
              }
            ]}
          >
            {analysis.summary}
          </Text>
        </View>

        {/* Key Points */}
        {analysis.keyPoints.length > 0 && (
          <View style={tw`mb-6`}>
            <Text
              style={[
                tw`text-lg font-semibold mb-3`,
                { color: currentTheme.colors.text }
              ]}
            >
              Points clés
            </Text>
            {analysis.keyPoints.map((point, index) => (
              <View
                key={index}
                style={tw`flex-row items-start mb-2`}
              >
                <Text style={[tw`mr-2 text-primary`, { color: currentTheme.colors.primary }]}>
                  •
                </Text>
                <Text
                  style={[
                    tw`text-sm flex-1`,
                    { color: currentTheme.colors.text }
                  ]}
                >
                  {point}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Topics */}
        <View style={tw`mb-6`}>
          <Text
            style={[
              tw`text-lg font-semibold mb-3`,
              { color: currentTheme.colors.text }
            ]}
          >
            Sujets
          </Text>
          <View style={tw`flex-row flex-wrap`}>
            {analysis.topics.map((topic, index) => (
              <View
                key={index}
                style={[
                  tw`px-3 py-1 rounded-full mr-2 mb-2`,
                  { backgroundColor: currentTheme.colors.primary + '20' }
                ]}
              >
                <Text
                  style={[
                    tw`text-sm`,
                    { color: currentTheme.colors.primary }
                  ]}
                >
                  {topic}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Items */}
        {analysis.actionItems.length > 0 && (
          <View style={tw`mb-6`}>
            <Text
              style={[
                tw`text-lg font-semibold mb-3`,
                { color: currentTheme.colors.text }
              ]}
            >
              Actions à suivre
            </Text>
            {analysis.actionItems.map((item, index) => (
              <View
                key={index}
                style={tw`flex-row items-center mb-2`}
              >
                <MaterialIcons
                  name="radio-button-unchecked"
                  size={16}
                  color={currentTheme.colors.textMuted}
                  style={tw`mr-2`}
                />
                <Text
                  style={[
                    tw`text-sm flex-1`,
                    { color: currentTheme.colors.text }
                  ]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={[
          tw`p-4 rounded-lg`,
          { backgroundColor: currentTheme.colors.surface }
        ]}>
          <Text
            style={[
              tw`text-sm font-semibold mb-2`,
              { color: currentTheme.colors.text }
            ]}
          >
            Statistiques
          </Text>

          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={{ color: currentTheme.colors.textMuted }}>Sentiment:</Text>
            <Text style={{ color: currentTheme.colors.text }}>
              {analysis.sentiment === 'positive' ? 'Positif' :
               analysis.sentiment === 'negative' ? 'Négatif' : 'Neutre'}
            </Text>
          </View>

          <View style={tw`flex-row justify-between`}>
            <Text style={{ color: currentTheme.colors.textMuted }}>Complexité:</Text>
            <Text style={{ color: currentTheme.colors.text }}>
              {analysis.complexity === 'simple' ? 'Simple' :
               analysis.complexity === 'moderate' ? 'Modérée' : 'Complexe'}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}>
        {/* Header */}
        <View style={[
          tw`flex-row items-center justify-between px-4 py-4 border-b`,
          {
            backgroundColor: currentTheme.colors.surface,
            borderColor: currentTheme.colors.border,
          }
        ]}>
          <TouchableOpacity onPress={onClose} style={tw`p-2`} activeOpacity={0.7}>
            <MaterialIcons
              name="close"
              size={24}
              color={currentTheme.colors.text}
            />
          </TouchableOpacity>

          <Text
            style={[
              tw`text-lg font-semibold`,
              { color: currentTheme.colors.text }
            ]}
          >
            Outils IA
          </Text>

          <View style={tw`w-10`} />
        </View>

        {/* Tabs */}
        <View style={[
          tw`flex-row border-b`,
          { borderColor: currentTheme.colors.border }
        ]}>
          {[
            { key: 'actions', label: 'Actions' },
            { key: 'analysis', label: 'Analyse' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              style={[
                tw`flex-1 py-3 items-center`,
                {
                  backgroundColor: activeTab === tab.key
                    ? currentTheme.colors.primary + '10'
                    : 'transparent',
                }
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  tw`font-medium`,
                  {
                    color: activeTab === tab.key
                      ? currentTheme.colors.primary
                      : currentTheme.colors.textMuted,
                  }
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {activeTab === 'actions' ? renderActionsTab() : renderAnalysisTab()}

        {isLoading && (
          <View style={[
            tw`absolute inset-0 items-center justify-center`,
            { backgroundColor: currentTheme.colors.background + '80' }
          ]}>
            <ActivityIndicator size="large" color={currentTheme.colors.primary} />
            <Text style={[tw`mt-2`, { color: currentTheme.colors.text }]}>
              Traitement en cours...
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
