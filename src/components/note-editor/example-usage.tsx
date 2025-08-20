import React from 'react';
import { View, StyleSheet } from 'react-native';
import AdvancedNoteEditor from './index';

/**
 * Exemple d'utilisation de l'éditeur de notes avancé
 * dans un écran de votre application
 */
export default function NotesScreen() {
  return (
    <View style={styles.container}>
      <AdvancedNoteEditor
        isFullscreen={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

/**
 * Exemple avec navigation (si vous utilisez React Navigation)
 */
export function NotesScreenWithNavigation() {
  return (
    <View style={{ flex: 1 }}>
      {/* Header avec titre */}
      <View style={{ padding: 16, backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#e9ecef' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#212529' }}>
          Mes Notes
        </Text>
      </View>

      {/* Éditeur */}
      <AdvancedNoteEditor />
    </View>
  );
}

/**
 * Exemple intégré dans un Tab Navigator
 */
export function NotesTabScreen() {
  return (
    <AdvancedNoteEditor
      isFullscreen={true}
    />
  );
}

/**
 * Exemple avec gestion d'état personnalisée
 */
export function NotesScreenWithState() {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Button
        title={isFullscreen ? "Mode Fenêtré" : "Plein Écran"}
        onPress={() => setIsFullscreen(!isFullscreen)}
      />

      <AdvancedNoteEditor
        isFullscreen={isFullscreen}
      />
    </View>
  );
}
