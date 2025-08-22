import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';

// Hooks et contextes
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

interface AudioScreenHeaderProps {
  isSelectionMode: boolean;
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onToggleSelectionMode: () => void;
}

export default function AudioScreenHeader({
  isSelectionMode,
  selectedCount,
  totalCount,
  onClearSelection,
  onDeleteSelected,
  onToggleSelectionMode,
}: AudioScreenHeaderProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handleDeleteSelected = () => {
    if (selectedCount === 0) return;

    Alert.alert(
      t('audio.deleteSelected.title', 'Supprimer les dossiers'),
      t(
        'audio.deleteSelected.message',
        `Êtes-vous sûr de vouloir supprimer ${selectedCount} dossier(s) ? Cette action est irréversible.`,
      ),
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        {
          text: t('common.delete', 'Supprimer'),
          style: 'destructive',
          onPress: onDeleteSelected,
        },
      ],
    );
  };

  if (isSelectionMode) {
    return (
      <View
        style={[
          tw`flex-row items-center justify-between px-4`,
          {
            paddingTop: insets.top + 16,
            backgroundColor: currentTheme.colors.background,
            borderBottomWidth: 1,
            borderBottomColor: currentTheme.colors.border,
          },
        ]}
      >
        {/* Bouton de fermeture */}
        <TouchableOpacity
          onPress={onClearSelection}
          style={tw`p-2 rounded-full`}
          activeOpacity={0.7}
        >
          <Icon name="close" size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>

        {/* Informations de sélection */}
        <View style={tw`flex-1 items-center`}>
          <Text
            style={[
              tw`text-lg font-semibold`,
              { color: currentTheme.colors.text },
            ]}
          >
            {selectedCount} / {totalCount}
          </Text>
          <Text
            style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}
          >
            {t('audio.selectionMode', 'Sélection')}
          </Text>
        </View>

        {/* Actions */}
        <View style={tw`flex-row items-center`}>
          {selectedCount > 0 && (
            <TouchableOpacity
              onPress={handleDeleteSelected}
              style={tw`p-2 rounded-full ml-2`}
              activeOpacity={0.7}
            >
              <Icon name="trash" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        tw`flex-row items-center justify-between px-4 py-4`,
        {
          paddingTop: insets.top + 16,
          backgroundColor: currentTheme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: currentTheme.colors.border,
        },
      ]}
    >
      {/* Titre */}
      <View style={tw`flex-1`}>
        <Text
          style={[tw`text-2xl font-bold`, { color: currentTheme.colors.text }]}
        >
          {t('audio.title', 'Audio')}
        </Text>
        <Text
          style={[
            tw`text-sm mt-1`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          {t(
            'audio.subtitle',
            `${totalCount} dossier${totalCount > 1 ? 's' : ''}`,
          )}
        </Text>
      </View>

      {/* Actions */}
      <View style={tw`flex-row items-center`}>
        <TouchableOpacity
          onPress={onToggleSelectionMode}
          style={tw`p-2 rounded-full mr-2`}
          activeOpacity={0.7}
        >
          <Icon
            name="checkmark-circle-outline"
            size={24}
            color={currentTheme.colors.text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
