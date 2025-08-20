import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Equalizer } from './Equalizer';
import { AdvancedEqualizer } from './AdvancedEqualizer';

// Exemple simple avec l'égaliseur de base
export const SimpleEqualizerExample: React.FC = () => {
  return (
    <View style={styles.container}>
      <Equalizer 
        numBands={10} 
        sampleRate={48000}
        showSpectrum={true}
        onConfigChange={(config) => {
          console.log('Equalizer config changed:', config);
        }}
      />
    </View>
  );
};

// Exemple avancé avec tous les contrôles audio
export const AdvancedEqualizerExample: React.FC = () => {
  return (
    <View style={styles.container}>
      <AdvancedEqualizer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
