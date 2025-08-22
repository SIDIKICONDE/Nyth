import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

// Hooks et contextes
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

// Types
import { AudioFolder } from '../types';

interface AudioFolderActionsProps {
  folder: AudioFolder;
  onClose: () => void;
  onEdit: (
    folderId: string,
    name: string,
    description?: string,
  ) => Promise<void>;
  onChangeColor: (folderId: string, color: string) => Promise<void>;
  onAddTag: (folderId: string, tag: string) => Promise<void>;
  onRemoveTag: (folderId: string, tag: string) => Promise<void>;
  onDuplicate: (folderId: string) => Promise<void>;
  onDelete: (folderId: string) => Promise<void>;
  onToggleFavorite: (folderId: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#4CAF50',
  '#2196F3',
  '#FF9800',
  '#9C27B0',
  '#F44336',
  '#00BCD4',
  '#8BC34A',
  '#FFC107',
  '#795548',
  '#E91E63',
  '#3F51B5',
  '#009688',
  '#CDDC39',
  '#FF5722',
  '#9E9E9E',
];

export default function AudioFolderActions({
  folder,
  onClose,
  onEdit,
  onChangeColor,
  onAddTag,
  onRemoveTag,
  onDuplicate,
  onDelete,
  onToggleFavorite,
}: AudioFolderActionsProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [editDescription, setEditDescription] = useState(
    folder.description || '',
  );
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleEdit = async () => {
    if (editName.trim()) {
      try {
        await onEdit(folder.id, editName.trim(), editDescription.trim());
        setIsEditing(false);
      } catch (error) {
        Alert.alert(
          t('common.error', 'Erreur'),
          'Impossible de modifier le dossier',
        );
      }
    }
  };

  const handleAddTag = async () => {
    if (newTag.trim() && !folder.tags.includes(newTag.trim())) {
      try {
        await onAddTag(folder.id, newTag.trim());
        setNewTag('');
        setShowTagInput(false);
      } catch (error) {
        Alert.alert(t('common.error', 'Erreur'), "Impossible d'ajouter le tag");
      }
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      await onRemoveTag(folder.id, tag);
    } catch (error) {
      Alert.alert(
        t('common.error', 'Erreur'),
        'Impossible de supprimer le tag',
      );
    }
  };

  const handleDuplicate = async () => {
    Alert.alert(
      t('audio.duplicate.title', 'Dupliquer le dossier'),
      t('audio.duplicate.message', 'Voulez-vous dupliquer ce dossier ?'),
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        {
          text: t('common.duplicate', 'Dupliquer'),
          onPress: async () => {
            try {
              await onDuplicate(folder.id);
              onClose();
            } catch (error) {
              Alert.alert(
                t('common.error', 'Erreur'),
                'Impossible de dupliquer le dossier',
              );
            }
          },
        },
      ],
    );
  };

  const handleDelete = async () => {
    Alert.alert(
      t('audio.deleteFolder.title', 'Supprimer le dossier'),
      t(
        'audio.deleteFolder.message',
        `Êtes-vous sûr de vouloir supprimer "${folder.name}" ? Cette action est irréversible.`,
      ),
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        {
          text: t('common.delete', 'Supprimer'),
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(folder.id);
              onClose();
            } catch (error) {
              Alert.alert(
                t('common.error', 'Erreur'),
                'Impossible de supprimer le dossier',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View
      style={[
        tw`absolute inset-0 bg-black/50 justify-end`,
        { paddingBottom: insets.bottom },
      ]}
    >
      <View
        style={[
          tw`bg-white dark:bg-gray-800 rounded-t-3xl p-6`,
          { maxHeight: '80%' },
        ]}
      >
        {/* Header */}
        <View style={tw`flex-row items-center justify-between mb-6`}>
          <View style={tw`flex-1`}>
            <Text
              style={[
                tw`text-xl font-bold`,
                { color: currentTheme.colors.text },
              ]}
            >
              {isEditing ? t('audio.editFolder', 'Modifier') : folder.name}
            </Text>
            {folder.description && !isEditing && (
              <Text
                style={[
                  tw`text-sm mt-1`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                {folder.description}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={tw`p-2 rounded-full bg-gray-100 dark:bg-gray-700`}
          >
            <Icon name="close" size={20} color={currentTheme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Mode édition */}
        {isEditing ? (
          <View style={tw`mb-6`}>
            <TextInput
              style={[
                tw`border rounded-lg p-3 mb-3`,
                {
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                  backgroundColor: currentTheme.colors.background,
                },
              ]}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('audio.folderName', 'Nom du dossier')}
              placeholderTextColor={currentTheme.colors.textSecondary}
            />
            <TextInput
              style={[
                tw`border rounded-lg p-3 mb-4 h-20`,
                {
                  borderColor: currentTheme.colors.border,
                  color: currentTheme.colors.text,
                  backgroundColor: currentTheme.colors.background,
                },
              ]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder={t(
                'audio.folderDescription',
                'Description (optionnel)',
              )}
              placeholderTextColor={currentTheme.colors.textSecondary}
              multiline
              numberOfLines={3}
            />
            <View style={tw`flex-row justify-end space-x-3`}>
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                style={tw`px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700`}
              >
                <Text style={{ color: currentTheme.colors.text }}>
                  {t('common.cancel', 'Annuler')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEdit}
                style={tw`px-4 py-2 rounded-lg bg-blue-500`}
              >
                <Text style={tw`text-white font-semibold`}>
                  {t('common.save', 'Sauvegarder')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Actions principales */}
            <View style={tw`space-y-4 mb-6`}>
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={tw`flex-row items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700`}
              >
                <Icon
                  name="pencil"
                  size={20}
                  color={currentTheme.colors.text}
                  style={tw`mr-3`}
                />
                <Text style={{ color: currentTheme.colors.text }}>
                  {t('audio.editFolder', 'Modifier le dossier')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowColorPicker(!showColorPicker)}
                style={tw`flex-row items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700`}
              >
                <View
                  style={[
                    tw`w-4 h-4 rounded-full mr-3`,
                    { backgroundColor: folder.color },
                  ]}
                />
                <Text style={{ color: currentTheme.colors.text }}>
                  {t('audio.changeColor', 'Changer la couleur')}
                </Text>
                <Icon
                  name={showColorPicker ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={currentTheme.colors.textSecondary}
                  style={tw`ml-auto`}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onToggleFavorite(folder.id)}
                style={tw`flex-row items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700`}
              >
                <Icon
                  name={folder.isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={
                    folder.isFavorite ? '#EF4444' : currentTheme.colors.text
                  }
                  style={tw`mr-3`}
                />
                <Text style={{ color: currentTheme.colors.text }}>
                  {folder.isFavorite
                    ? t('audio.removeFavorite', 'Retirer des favoris')
                    : t('audio.addFavorite', 'Ajouter aux favoris')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDuplicate}
                style={tw`flex-row items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700`}
              >
                <Icon
                  name="copy"
                  size={20}
                  color={currentTheme.colors.text}
                  style={tw`mr-3`}
                />
                <Text style={{ color: currentTheme.colors.text }}>
                  {t('audio.duplicateFolder', 'Dupliquer le dossier')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sélecteur de couleurs */}
            {showColorPicker && (
              <View style={tw`mb-6`}>
                <Text
                  style={[
                    tw`text-sm font-semibold mb-3`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  {t('audio.selectColor', 'Choisir une couleur')}
                </Text>
                <View style={tw`flex-row flex-wrap`}>
                  {PRESET_COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => onChangeColor(folder.id, color)}
                      style={[
                        tw`w-8 h-8 rounded-full m-1 border-2`,
                        {
                          backgroundColor: color,
                          borderColor:
                            folder.color === color
                              ? currentTheme.colors.text
                              : 'transparent',
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Gestion des tags */}
            <View style={tw`mb-6`}>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <Text
                  style={[
                    tw`text-sm font-semibold`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  {t('audio.tags', 'Tags')}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTagInput(!showTagInput)}
                  style={tw`p-1`}
                >
                  <Icon
                    name="add"
                    size={16}
                    color={currentTheme.colors.accent}
                  />
                </TouchableOpacity>
              </View>

              {/* Tags existants */}
              <View style={tw`flex-row flex-wrap mb-3`}>
                {folder.tags.map(tag => (
                  <View
                    key={tag}
                    style={tw`flex-row items-center bg-blue-100 dark:bg-blue-900 rounded-full px-3 py-1 mr-2 mb-2`}
                  >
                    <Text
                      style={tw`text-blue-800 dark:text-blue-200 text-xs mr-1`}
                    >
                      {tag}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTag(tag)}
                      style={tw`p-0.5`}
                    >
                      <Icon name="close" size={10} color="#1e40af" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Ajout de tag */}
              {showTagInput && (
                <View style={tw`flex-row items-center`}>
                  <TextInput
                    style={[
                      tw`flex-1 border rounded-lg p-2 mr-2`,
                      {
                        borderColor: currentTheme.colors.border,
                        color: currentTheme.colors.text,
                        backgroundColor: currentTheme.colors.background,
                      },
                    ]}
                    value={newTag}
                    onChangeText={setNewTag}
                    placeholder={t('audio.addTag', 'Nouveau tag')}
                    placeholderTextColor={currentTheme.colors.textSecondary}
                    onSubmitEditing={handleAddTag}
                  />
                  <TouchableOpacity
                    onPress={handleAddTag}
                    style={tw`bg-blue-500 rounded-lg p-2`}
                  >
                    <Icon name="checkmark" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Statistiques */}
            <View style={tw`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6`}>
              <Text
                style={[
                  tw`text-sm font-semibold mb-3`,
                  { color: currentTheme.colors.text },
                ]}
              >
                {t('audio.statistics', 'Statistiques')}
              </Text>
              <View style={tw`space-y-2`}>
                <View style={tw`flex-row justify-between`}>
                  <Text style={{ color: currentTheme.colors.textSecondary }}>
                    {t('audio.recordings', 'Enregistrements')}:
                  </Text>
                  <Text style={{ color: currentTheme.colors.text }}>
                    {folder.recordingCount}
                  </Text>
                </View>
                <View style={tw`flex-row justify-between`}>
                  <Text style={{ color: currentTheme.colors.textSecondary }}>
                    {t('audio.totalDuration', 'Durée totale')}:
                  </Text>
                  <Text style={{ color: currentTheme.colors.text }}>
                    {Math.floor(folder.totalDuration / 3600)}h{' '}
                    {Math.floor((folder.totalDuration % 3600) / 60)}min
                  </Text>
                </View>
                <View style={tw`flex-row justify-between`}>
                  <Text style={{ color: currentTheme.colors.textSecondary }}>
                    {t('audio.lastModified', 'Dernière modif')}:
                  </Text>
                  <Text style={{ color: currentTheme.colors.text }}>
                    {folder.updatedAt.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action de suppression */}
            <TouchableOpacity
              onPress={handleDelete}
              style={tw`flex-row items-center justify-center p-3 rounded-lg bg-red-100 dark:bg-red-900`}
            >
              <Icon name="trash" size={20} color="#EF4444" style={tw`mr-2`} />
              <Text style={tw`text-red-600 dark:text-red-400 font-semibold`}>
                {t('audio.deleteFolder', 'Supprimer le dossier')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
