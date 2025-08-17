import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../contexts/ThemeContext';
import { TabType } from '../types';
import { AIFriendlyIcon } from '../../../components/icons';

interface ActionButtonsProps {
  selectionMode: boolean;
  activeTab: TabType;
  scripts: any[];
  recordings: any[];
  selectedScripts: string[];
  selectedRecordings: string[];
  onAIChat: () => void;
  onSettings: () => void;
  onClearSelection: () => void;
  onToggleScriptSelection: (id: string) => void;
  onToggleRecordingSelection: (id: string) => void;
}

export function ActionButtons({
  selectionMode,
  activeTab,
  scripts,
  recordings,
  selectedScripts,
  selectedRecordings,
  onAIChat,
  onSettings,
  onClearSelection,
  onToggleScriptSelection,
  onToggleRecordingSelection,
}: ActionButtonsProps) {
  const { currentTheme } = useTheme();

  // Boutons normaux
  const normalActionButtons = [
    {
      icon: 'ai-friendly',
      onPress: onAIChat,
      backgroundColor: 'transparent',
      iconComponent: (
        <AIFriendlyIcon 
          size={32} 
          primaryColor={currentTheme.colors.accent}
          secondaryColor={currentTheme.colors.primary}
          animated={true}
        />
      )
    },
    {
      icon: 'cog',
      onPress: onSettings,
      backgroundColor: `${currentTheme.colors.background}`,
      iconComponent: (
        <MaterialCommunityIcons 
          name="cog" 
          size={22} 
          color={currentTheme.colors.textSecondary} 
        />
      )
    }
  ];

  // Boutons en mode sélection
  const selectionActionButtons = [
    {
      icon: 'close',
      onPress: onClearSelection,
      backgroundColor: `${currentTheme.colors.primary}15`,
      iconComponent: (
        <MaterialCommunityIcons 
          name="close" 
          size={22} 
          color={currentTheme.colors.primary} 
        />
      )
    },
    {
      icon: 'select-all',
      onPress: () => {
        if (activeTab === 'scripts') {
          const allSelected = scripts.length === selectedScripts.length;
          if (allSelected) {
            // Désélectionner tout
            selectedScripts.forEach(id => onToggleScriptSelection(id));
          } else {
            // Sélectionner tout
            scripts.forEach(script => {
              if (!selectedScripts.includes(script.id)) {
                onToggleScriptSelection(script.id);
              }
            });
          }
        } else {
          const allSelected = recordings.length === selectedRecordings.length;
          if (allSelected) {
            // Désélectionner tout
            selectedRecordings.forEach(id => onToggleRecordingSelection(id));
          } else {
            // Sélectionner tout
            recordings.forEach(recording => {
              if (!selectedRecordings.includes(recording.id)) {
                onToggleRecordingSelection(recording.id);
              }
            });
          }
        }
      },
      backgroundColor: `${currentTheme.colors.accent}15`,
      iconComponent: (
        <MaterialCommunityIcons 
          name="select-all" 
          size={22} 
          color={currentTheme.colors.accent} 
        />
      )
    }
  ];

  return selectionMode ? selectionActionButtons : normalActionButtons;
} 