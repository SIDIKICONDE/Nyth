import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import tw from 'twrnc';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from '../../../hooks/useTranslation';
import { Note, NoteTemplate } from '../types';
import { useNoteEditor } from '../hooks/useNoteEditor';

interface NoteListProps {
  onNoteSelect: (note: Note) => void;
  selectedNoteId?: string;
}

export default function NoteList({ onNoteSelect, selectedNoteId }: NoteListProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const {
    filteredNotes,
    searchQuery,
    setSearchQuery,
    createNote,
    togglePinNote,
    toggleArchiveNote,
    deleteNote,
    templates,
  } = useNoteEditor();

  const [showTemplates, setShowTemplates] = useState(false);

  // Render note item
  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[
        tw`mx-4 my-2 p-4 rounded-xl border`,
        {
          backgroundColor: selectedNoteId === item.id
            ? currentTheme.colors.primary + '10'
            : currentTheme.colors.surface,
          borderColor: selectedNoteId === item.id
            ? currentTheme.colors.primary
            : currentTheme.colors.border,
        }
      ]}
      onPress={() => onNoteSelect(item)}
      activeOpacity={0.7}
    >
      <View style={tw`flex-row items-start justify-between`}>
        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center mb-1`}>
            {item.isPinned && (
              <MaterialIcons
                name="push-pin"
                size={14}
                color={currentTheme.colors.primary}
                style={tw`mr-1`}
              />
            )}
            <Text
              style={[
                tw`font-semibold text-base flex-1`,
                { color: currentTheme.colors.text }
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </View>

          <Text
            style={[
              tw`text-sm mb-2`,
              { color: currentTheme.colors.textMuted }
            ]}
            numberOfLines={2}
          >
            {item.content.replace(/\n/g, ' ').substring(0, 100)}...
          </Text>

          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <MaterialIcons
                name="access-time"
                size={12}
                color={currentTheme.colors.textMuted}
              />
              <Text
                style={[
                  tw`ml-1 text-xs`,
                  { color: currentTheme.colors.textMuted }
                ]}
              >
                {item.updatedAt.toLocaleDateString()}
              </Text>
            </View>

            {item.tags.length > 0 && (
              <View style={tw`flex-row items-center`}>
                <MaterialIcons
                  name="tag"
                  size={12}
                  color={currentTheme.colors.textMuted}
                />
                <Text
                  style={[
                    tw`ml-1 text-xs`,
                    { color: currentTheme.colors.textMuted }
                  ]}
                >
                  {item.tags.length}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={tw`flex-col items-end space-y-1`}>
          <TouchableOpacity
            onPress={() => togglePinNote(item.id)}
            style={tw`p-1 rounded`}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={item.isPinned ? "push-pin" : "push-pin-outline"}
              size={16}
              color={item.isPinned ? currentTheme.colors.primary : currentTheme.colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                t('notes.confirm_delete'),
                t('notes.delete_message'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => deleteNote(item.id)
                  },
                ]
              );
            }}
            style={tw`p-1 rounded`}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="delete-outline"
              size={16}
              color={currentTheme.colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render template item
  const renderTemplateItem = ({ item }: { item: NoteTemplate }) => (
    <TouchableOpacity
      style={[
        tw`mx-4 my-2 p-3 rounded-lg border`,
        {
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }
      ]}
      onPress={() => {
        const newNote = createNote(item);
        onNoteSelect(newNote);
        setShowTemplates(false);
      }}
      activeOpacity={0.7}
    >
      <View style={tw`flex-row items-center`}>
        <View style={[
          tw`w-10 h-10 rounded-lg items-center justify-center mr-3`,
          { backgroundColor: currentTheme.colors.primary + '20' }
        ]}>
          <MaterialIcons
            name={item.icon as any}
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
            {item.name}
          </Text>
          <Text
            style={[
              tw`text-sm`,
              { color: currentTheme.colors.textMuted }
            ]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        </View>

        <MaterialIcons
          name="add"
          size={20}
          color={currentTheme.colors.primary}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}>
      {/* Header */}
      <View style={[
        tw`px-4 py-3 border-b`,
        {
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }
      ]}>
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <Text
            style={[
              tw`text-xl font-bold`,
              { color: currentTheme.colors.text }
            ]}
          >
            {t('notes.my_notes')}
          </Text>

          <View style={tw`flex-row items-center space-x-2`}>
            <TouchableOpacity
              onPress={() => setShowTemplates(!showTemplates)}
              style={[
                tw`p-2 rounded-lg`,
                { backgroundColor: currentTheme.colors.primary + '20' }
              ]}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={showTemplates ? "template-outline" : "add"}
                size={20}
                color={currentTheme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={[
          tw`flex-row items-center px-3 py-2 rounded-lg`,
          { backgroundColor: currentTheme.colors.background }
        ]}>
          <MaterialIcons
            name="search"
            size={20}
            color={currentTheme.colors.textMuted}
          />
          <TextInput
            style={[
              tw`flex-1 ml-2 text-base`,
              { color: currentTheme.colors.text }
            ]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('notes.search_placeholder')}
            placeholderTextColor={currentTheme.colors.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={tw`p-1`}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="clear"
                size={20}
                color={currentTheme.colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Templates */}
      {showTemplates && (
        <View style={[
          tw`px-4 py-3 border-b`,
          {
            backgroundColor: currentTheme.colors.background,
            borderColor: currentTheme.colors.border,
          }
        ]}>
          <Text
            style={[
              tw`text-lg font-semibold mb-3`,
              { color: currentTheme.colors.text }
            ]}
          >
            {t('notes.templates')}
          </Text>

          <FlatList
            data={templates}
            renderItem={renderTemplateItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 200 }}
          />
        </View>
      )}

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`py-2`}
        ListEmptyComponent={
          <View style={[tw`items-center justify-center py-12`, { backgroundColor: currentTheme.colors.background }]}>
            <MaterialIcons
              name="note-add"
              size={48}
              color={currentTheme.colors.textMuted}
            />
            <Text style={[tw`mt-4 text-lg`, { color: currentTheme.colors.textMuted }]}>
              {searchQuery ? t('notes.no_search_results') : t('notes.no_notes')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                const newNote = createNote();
                onNoteSelect(newNote);
              }}
              style={[
                tw`mt-4 px-6 py-3 rounded-lg`,
                { backgroundColor: currentTheme.colors.primary }
              ]}
              activeOpacity={0.8}
            >
              <Text style={[tw`text-white font-semibold`, { color: 'white' }]}>
                {t('notes.create_first')}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
