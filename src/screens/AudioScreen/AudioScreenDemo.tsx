/**
 * Fichier de démonstration pour l'écran AudioScreen
 * Ce fichier montre comment intégrer et utiliser l'écran AudioScreen dans votre application
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from 'twrnc';

// Import des composants
import { AudioFAB } from './components';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

export default function AudioScreenDemo() {
  const navigation = useNavigation();
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  // État pour la démonstration du bouton d'enregistrement
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Gestion de l'enregistrement
  const handleRecordingToggle = () => {
    if (isRecording) {
      // Arrêter l'enregistrement
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      Alert.alert(
        'Enregistrement terminé',
        `Durée: ${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60)
          .toString()
          .padStart(2, '0')}`,
      );
    } else {
      // Démarrer l'enregistrement
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  // Nettoyer l'intervalle
  React.useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  return (
    <View style={tw`flex-1`}>
      {/* Header de démonstration */}
      <View style={[tw`p-4`, { backgroundColor: currentTheme.colors.accent }]}>
        <Text style={tw`text-white text-lg font-bold`}>
          🎙️ Démonstration - Bouton d'Enregistrement
        </Text>
        <Text style={tw`text-white/80 mt-1`}>
          Bouton qui grandit et change de couleur pendant l'enregistrement
        </Text>
      </View>

      {/* Animation du bouton d'enregistrement */}
      <View style={tw`flex-1 items-center justify-center p-4`}>
        <Text
          style={[
            tw`text-lg font-semibold mb-4`,
            { color: currentTheme.colors.text },
          ]}
        >
          🎙️ Testez le bouton d'enregistrement
        </Text>

        <Text
          style={[
            tw`text-sm text-center mb-8`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          Appuyez sur le bouton pour voir les animations d'enregistrement.{'\n'}
          Le bouton grandit et change de couleur (rouge) pendant
          l'enregistrement.
        </Text>

        {/* Bouton d'enregistrement avec animations */}
        <AudioFAB
          onPress={handleRecordingToggle}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
        />

        {/* État actuel */}
        <View
          style={tw`mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg w-full`}
        >
          <Text
            style={[
              tw`text-sm font-medium mb-2`,
              { color: currentTheme.colors.text },
            ]}
          >
            📊 État actuel :
          </Text>
          <Text
            style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}
          >
            • Enregistrement: {isRecording ? '✅ Actif' : '⏸️ Arrêté'}
            {'\n'}• Durée: {Math.floor(recordingDuration / 60)}:
            {(recordingDuration % 60).toString().padStart(2, '0')}
            {'\n'}• Animation:{' '}
            {isRecording ? '🔴 Rouge + agrandissement' : '🔵 Normal'}
          </Text>
        </View>
      </View>

      {/* Explication des animations */}
      <View style={tw`p-4`}>
        <Text style={tw`text-lg font-semibold mb-2`}>
          🎨 Animations du bouton d'enregistrement :
        </Text>
        <Text style={tw`text-sm leading-5 mb-3`}>
          • <Text style={tw`font-semibold`}>Croissance :</Text> Le bouton passe
          de 64px à 80px (×1.3){'\n'}•{' '}
          <Text style={tw`font-semibold`}>Changement de couleur :</Text> Bleu →
          Rouge pendant l'enregistrement{'\n'}•{' '}
          <Text style={tw`font-semibold`}>Pulse rouge :</Text> Cercle animé
          rouge autour du bouton{'\n'}•{' '}
          <Text style={tw`font-semibold`}>Chronomètre :</Text> Affichage MM:SS
          intégré{'\n'}• <Text style={tw`font-semibold`}>Icône :</Text>{' '}
          Basculement entre "add" et "radio"{'\n'}•{' '}
          <Text style={tw`font-semibold`}>Transitions :</Text> Animations
          fluides de 200-300ms
        </Text>

        <TouchableOpacity
          style={[
            tw`rounded-lg p-3 items-center mt-4`,
            { backgroundColor: currentTheme.colors.accent },
          ]}
          onPress={() => {
            // Navigation vers l'écran AudioScreen
            navigation.navigate('AudioScreen' as never);
          }}
        >
          <Text style={tw`text-white font-semibold`}>
            🚀 Voir l'écran complet
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
