import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface TeleprompterEditorProps {
  navigation: any;
}

export const TeleprompterEditor = ({ navigation }: TeleprompterEditorProps) => {
  const { currentTheme } = useTheme();
  const backgroundColor = currentTheme.colors.background;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: backgroundColor }]}>
      {/* Tout le contenu de formatage a été supprimé */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
}); 