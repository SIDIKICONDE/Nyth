import React, { useState } from 'react';
import { View, Dimensions } from 'react-native';
import tw from 'twrnc';
import { useTheme } from '../../contexts/ThemeContext';
import { Note } from './types';
import NoteList from './components/NoteList';
import AdvancedNoteEditor from './components/AdvancedNoteEditor';

interface AdvancedNoteEditorProps {
  isFullscreen?: boolean;
}

export default function AdvancedNoteEditorMain({
  isFullscreen = false,
}: AdvancedNoteEditorProps) {
  const { currentTheme } = useTheme();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isListVisible, setIsListVisible] = useState(true);

  const { width } = Dimensions.get('window');
  const isLargeScreen = width > 768; // Tablet or large phone

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    if (!isLargeScreen) {
      setIsListVisible(false);
    }
  };

  const handleBackToList = () => {
    setIsListVisible(true);
  };

  const handleNoteChange = (note: Note | null) => {
    setSelectedNote(note);
  };

  const handleSave = (note: Note) => {
    // Here you would typically save to your backend/storage
    console.log('Saving note:', note);
  };

  if (isLargeScreen || isFullscreen) {
    // Large screen or fullscreen: show both list and editor side by side
    return (
      <View style={[tw`flex-1 flex-row`, { backgroundColor: currentTheme.colors.background }]}>
        <View style={tw`w-1/3 border-r ${isFullscreen ? 'w-1/4' : 'w-1/3'}`}>
          <NoteList
            onNoteSelect={handleNoteSelect}
            selectedNoteId={selectedNote?.id}
          />
        </View>

        <View style={tw`flex-1`}>
          <AdvancedNoteEditor
            note={selectedNote}
            onNoteChange={handleNoteChange}
            onSave={handleSave}
            isFullscreen={isFullscreen}
          />
        </View>
      </View>
    );
  }

  // Small screen: show either list or editor
  if (isListVisible) {
    return (
      <NoteList
        onNoteSelect={handleNoteSelect}
        selectedNoteId={selectedNote?.id}
      />
    );
  }

  return (
    <View style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}>
      <AdvancedNoteEditor
        note={selectedNote}
        onNoteChange={handleNoteChange}
        onSave={handleSave}
        isFullscreen={false}
      />
    </View>
  );
}
