import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface ContentEditorToolbarProps {
  content: string;
  onContentChange: (text: string) => void;
}

export default function ContentEditorToolbar({
  content,
  onContentChange
}: ContentEditorToolbarProps) {
  const { currentTheme } = useTheme();

  // Composant vide - toutes les fonctionnalités de formatage ont été supprimées
  return (
    <View style={[
      styles.container,
      { backgroundColor: currentTheme.colors.surface }
    ]} />
  );
}

const styles = StyleSheet.create({
  container: {
    height: 1,
    borderTopWidth: 0,
  }
}); 