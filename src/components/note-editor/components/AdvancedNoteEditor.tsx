import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Keyboard,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import tw from 'twrnc';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from '../../../hooks/useTranslation';
import { Note, NoteEditorState } from '../types';
import AITools from './AITools';

interface AdvancedNoteEditorProps {
  note: Note | null;
  onNoteChange: (note: Note | null) => void;
  onSave: (note: Note) => void;
  isFullscreen?: boolean;
}

export default function AdvancedNoteEditor({
  note,
  onNoteChange,
  onSave,
  isFullscreen = false,
}: AdvancedNoteEditorProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const [editorState, setEditorState] = useState<NoteEditorState>({
    currentNote: note,
    isEditing: false,
    selection: { start: 0, end: 0 },
    undoStack: [],
    redoStack: [],
    isFullscreen,
    wordWrap: true,
    showToolbar: true,
    zoom: 1,
  });

  const [showAITools, setShowAITools] = useState(false);

  const textInputRef = useRef<TextInput>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (editorState.currentNote && editorState.isEditing) {
      onSave(editorState.currentNote);
    }
  }, [editorState.currentNote, editorState.isEditing, onSave]);

  // Debounced auto-save
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editorState.currentNote?.content, autoSave]);

  // Handle content changes
  const handleContentChange = useCallback((content: string) => {
    if (!editorState.currentNote) return;

    const updatedNote: Note = {
      ...editorState.currentNote,
      content,
      updatedAt: new Date(),
      metadata: {
        ...editorState.currentNote.metadata!,
        wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: content.length,
        readingTime: Math.ceil(content.split(/\s+/).length / 200), // 200 words per minute
      }
    };

    setEditorState(prev => ({
      ...prev,
      currentNote: updatedNote,
      undoStack: [...prev.undoStack, prev.currentNote!.content],
      redoStack: [],
    }));

    onNoteChange(updatedNote);
  }, [editorState.currentNote, onNoteChange]);

  // Handle title changes
  const handleTitleChange = useCallback((title: string) => {
    if (!editorState.currentNote) return;

    const updatedNote: Note = {
      ...editorState.currentNote,
      title,
      updatedAt: new Date(),
    };

    setEditorState(prev => ({
      ...prev,
      currentNote: updatedNote,
    }));

    onNoteChange(updatedNote);
  }, [editorState.currentNote, onNoteChange]);

  // Handle AI content updates
  const handleAIContentUpdate = useCallback((newContent: string) => {
    if (!editorState.currentNote) return;

    const updatedNote: Note = {
      ...editorState.currentNote,
      content: newContent,
      updatedAt: new Date(),
      metadata: {
        ...editorState.currentNote.metadata!,
        wordCount: newContent.split(/\s+/).filter(word => word.length > 0).length,
        characterCount: newContent.length,
        readingTime: Math.ceil(newContent.split(/\s+/).length / 200),
      }
    };

    setEditorState(prev => ({
      ...prev,
      currentNote: updatedNote,
      undoStack: [...prev.undoStack, prev.currentNote!.content],
      redoStack: [],
    }));

    onNoteChange(updatedNote);
  }, [editorState.currentNote, onNoteChange]);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      isFullscreen: !prev.isFullscreen,
    }));
  }, []);

  // Toggle toolbar visibility
  const toggleToolbar = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      showToolbar: !prev.showToolbar,
    }));
  }, []);

  // Format text (bold, italic, etc.)
  const formatText = useCallback((format: 'bold' | 'italic' | 'underline') => {
    if (!textInputRef.current || !editorState.currentNote) return;

    const { start, end } = editorState.selection;
    const selectedText = editorState.currentNote.content.slice(start, end);

    if (!selectedText) return;

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
    }

    const newContent =
      editorState.currentNote.content.slice(0, start) +
      formattedText +
      editorState.currentNote.content.slice(end);

    handleContentChange(newContent);
  }, [editorState.selection, editorState.currentNote, handleContentChange]);

  // Insert template
  const insertTemplate = useCallback((template: string) => {
    if (!editorState.currentNote) return;

    const newContent = editorState.currentNote.content + '\n\n' + template;
    handleContentChange(newContent);
  }, [editorState.currentNote, handleContentChange]);

  // Quick actions toolbar
  const renderToolbar = () => {
    if (!editorState.showToolbar) return null;

    return (
      <View style={[
        tw`flex-row items-center justify-between px-4 py-2 border-t`,
        {
          backgroundColor: currentTheme.colors.surface,
          borderColor: currentTheme.colors.border,
        }
      ]}>
        <View style={tw`flex-row items-center space-x-2`}>
          <TouchableOpacity
            onPress={() => formatText('bold')}
            style={tw`p-2 rounded-lg`}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="format-bold"
              size={20}
              color={currentTheme.colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => formatText('italic')}
            style={tw`p-2 rounded-lg`}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="format-italic"
              size={20}
              color={currentTheme.colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => formatText('underline')}
            style={tw`p-2 rounded-lg`}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="format-underlined"
              size={20}
              color={currentTheme.colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={tw`flex-row items-center space-x-2`}>
          <TouchableOpacity
            onPress={() => setShowAITools(true)}
            style={tw`p-2 rounded-lg`}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="auto-awesome"
              size={20}
              color={currentTheme.colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleFullscreen}
            style={tw`p-2 rounded-lg`}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={editorState.isFullscreen ? "fullscreen-exit" : "fullscreen"}
              size={20}
              color={currentTheme.colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Keyboard.dismiss()}
            style={tw`p-2 rounded-lg`}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="keyboard-hide"
              size={20}
              color={currentTheme.colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!editorState.currentNote) {
    return (
      <View style={[tw`flex-1 items-center justify-center`, { backgroundColor: currentTheme.colors.background }]}>
        <MaterialIcons name="note-add" size={48} color={currentTheme.colors.textMuted} />
        <Text style={[tw`mt-4 text-lg`, { color: currentTheme.colors.textMuted }]}>
          {t('notes.select_or_create')}
        </Text>
      </View>
    );
  }

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
        <TextInput
          style={[
            tw`text-xl font-bold`,
            {
              color: currentTheme.colors.text,
              backgroundColor: 'transparent',
            }
          ]}
          value={editorState.currentNote.title}
          onChangeText={handleTitleChange}
          placeholder={t('notes.title_placeholder')}
          placeholderTextColor={currentTheme.colors.textMuted}
          maxLength={100}
        />

        <View style={tw`flex-row items-center justify-between mt-2`}>
          <View style={tw`flex-row items-center`}>
            <MaterialIcons name="access-time" size={14} color={currentTheme.colors.textMuted} />
            <Text style={[tw`ml-1 text-xs`, { color: currentTheme.colors.textMuted }]}>
              {t('notes.last_modified')}: {editorState.currentNote.updatedAt.toLocaleString()}
            </Text>
          </View>

          <View style={tw`flex-row items-center`}>
            <MaterialIcons name="text-fields" size={14} color={currentTheme.colors.textMuted} />
            <Text style={[tw`ml-1 text-xs`, { color: currentTheme.colors.textMuted }]}>
              {editorState.currentNote.metadata?.wordCount || 0} {t('notes.words')}
            </Text>
          </View>
        </View>
      </View>

      {/* Editor */}
      <ScrollView style={tw`flex-1`}>
        <TextInput
          ref={textInputRef}
          style={[
            tw`p-4 text-base`,
            {
              color: currentTheme.colors.text,
              backgroundColor: currentTheme.colors.background,
              lineHeight: 24,
              minHeight: 400,
            }
          ]}
          value={editorState.currentNote.content}
          onChangeText={handleContentChange}
          onSelectionChange={(event) => {
            setEditorState(prev => ({
              ...prev,
              selection: event.nativeEvent.selection,
            }));
          }}
          placeholder={t('notes.content_placeholder')}
          placeholderTextColor={currentTheme.colors.textMuted}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
          autoCorrect
          spellCheck
          autoCapitalize="sentences"
        />
      </ScrollView>

      {/* Toolbar */}
      {renderToolbar()}

      {/* AI Tools Modal */}
      <AITools
        note={editorState.currentNote!}
        onContentUpdate={handleAIContentUpdate}
        isVisible={showAITools}
        onClose={() => setShowAITools(false)}
      />
    </View>
  );
}
