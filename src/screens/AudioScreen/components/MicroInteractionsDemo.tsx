/**
 * Démonstration des micro-interactions ajoutées à l'AudioScreen
 * Ce fichier montre toutes les améliorations apportées
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'react-native-linear-gradient';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';

// Hooks et contextes
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

// Composants avec micro-interactions
import RippleButton, { useMicroInteractions } from './RippleButton';
import AudioFAB from './AudioFAB';
import AudioFolderCard from './AudioFolderCard';
import EmptyState from './EmptyState';

// Types
import { AudioFolder } from '../types';

export default function MicroInteractionsDemo() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Hook pour les micro-interactions
  const { triggerSuccess, triggerError, triggerWarning, triggerImpact } =
    useMicroInteractions();

  // État pour la démonstration
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

  // Dossier de démonstration
  const demoFolder: AudioFolder = {
    id: 'demo-1',
    name: 'Dossier Démo',
    description: 'Dossier pour tester les micro-interactions',
    createdAt: new Date(),
    updatedAt: new Date(),
    recordingCount: 5,
    totalDuration: 1800,
    isFavorite: true,
    color: '#4CAF50',
    icon: 'folder',
    tags: ['demo', 'test'],
  };

  // Gestionnaires d'événements
  const handleRecordingToggle = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setRecordingDuration(0);
      triggerSuccess();
    } else {
      triggerImpact('medium');
    }
  };

  const handleFolderPress = () => {
    Alert.alert('Dossier pressé', 'Micro-interaction réussie ! 🎉');
    triggerImpact('light');
  };

  const handleFolderLongPress = () => {
    Alert.alert('Appui long détecté', 'Animation spéciale activée ! ✨');
    triggerImpact('heavy');
  };

  const handleFolderDelete = () => {
    Alert.alert(
      'Suppression',
      "Cette action déclencherait une vibration d'erreur",
      [
        {
          text: 'Annuler',
          onPress: () => triggerImpact('light'),
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => triggerError(),
        },
      ],
    );
  };

  const handleCreateFolder = () => {
    Alert.alert('Nouveau dossier', 'Micro-interaction de succès ! 🎊');
    triggerSuccess();
  };

  const handleHapticTest = (
    type: 'success' | 'error' | 'warning' | 'light' | 'medium' | 'heavy',
  ) => {
    switch (type) {
      case 'success':
        triggerSuccess();
        break;
      case 'error':
        triggerError();
        break;
      case 'warning':
        triggerWarning();
        break;
      default:
        triggerImpact(type as 'light' | 'medium' | 'heavy');
    }
  };

  return (
    <ScrollView
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={tw`pb-8`}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={[currentTheme.colors.accent, currentTheme.colors.accent + '80']}
        style={[tw`pt-12 pb-6 px-6 mb-6`, { paddingTop: insets.top + 12 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={tw`text-white text-2xl font-bold text-center mb-2`}>
          🎯 Micro-Interactions
        </Text>
        <Text style={tw`text-white/80 text-center text-sm`}>
          Découvrez toutes les améliorations apportées
        </Text>
      </LinearGradient>

      {/* Section RippleButton */}
      <View style={tw`px-4 mb-6`}>
        <Text
          style={[
            tw`text-lg font-bold mb-4`,
            { color: currentTheme.colors.text },
          ]}
        >
          🌊 RippleButton - Effets de vague
        </Text>

        <View style={tw`space-y-3`}>
          <RippleButton
            onPress={() => handleHapticTest('light')}
            style={tw`p-4 rounded-xl bg-blue-500`}
            rippleColor="rgba(255,255,255,0.4)"
            hapticType="light"
          >
            <Text style={tw`text-white font-semibold text-center`}>
              Bouton avec effet ripple bleu
            </Text>
          </RippleButton>

          <RippleButton
            onPress={() => handleHapticTest('success')}
            style={tw`p-4 rounded-xl bg-green-500`}
            rippleColor="rgba(255,255,255,0.4)"
            hapticType="success"
          >
            <Text style={tw`text-white font-semibold text-center`}>
              Bouton de succès (vibration différente)
            </Text>
          </RippleButton>

          <RippleButton
            onPress={() => handleHapticTest('error')}
            style={tw`p-4 rounded-xl bg-red-500`}
            rippleColor="rgba(255,255,255,0.4)"
            hapticType="error"
          >
            <Text style={tw`text-white font-semibold text-center`}>
              Bouton d'erreur (vibration d'alerte)
            </Text>
          </RippleButton>
        </View>
      </View>

      {/* Section AudioFAB amélioré */}
      <View style={tw`px-4 mb-6`}>
        <Text
          style={[
            tw`text-lg font-bold mb-4`,
            { color: currentTheme.colors.text },
          ]}
        >
          🎙️ AudioFAB - Animations sophistiquées
        </Text>

        <Text
          style={[
            tw`text-sm mb-4`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          • Effet de glow pendant l'appui{'\n'}• Rotation lors du changement
          d'état{'\n'}• Haptic feedback contextuel{'\n'}• Bordures lumineuses
          animées
        </Text>

        <View style={tw`items-center`}>
          <AudioFAB
            onPress={handleRecordingToggle}
            isRecording={isRecording}
            recordingDuration={recordingDuration}
          />
        </View>
      </View>

      {/* Section AudioFolderCard amélioré */}
      <View style={tw`px-4 mb-6`}>
        <Text
          style={[
            tw`text-lg font-bold mb-4`,
            { color: currentTheme.colors.text },
          ]}
        >
          📁 AudioFolderCard - Interactions enrichies
        </Text>

        <Text
          style={[
            tw`text-sm mb-4`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          • Animation de bounce sur press{'\n'}• Effet de glow subtil{'\n'}•
          Micro-interactions haptiques{'\n'}• RippleButton intégré
        </Text>

        <AudioFolderCard
          folder={demoFolder}
          isSelected={selectedFolders.includes(demoFolder.id)}
          isSelectionMode={false}
          onPress={handleFolderPress}
          onLongPress={handleFolderLongPress}
          onDelete={handleFolderDelete}
        />
      </View>

      {/* Section EmptyState amélioré */}
      <View style={tw`px-4 mb-6`}>
        <Text
          style={[
            tw`text-lg font-bold mb-4`,
            { color: currentTheme.colors.text },
          ]}
        >
          📭 EmptyState - Animations fluides
        </Text>

        <Text
          style={[
            tw`text-sm mb-4`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          • Animation de pulse continue sur l'icône{'\n'}• Effet de glow sur le
          bouton{'\n'}• RippleButton pour le CTA{'\n'}• Transitions orchestrées
        </Text>

        <EmptyState onCreateFolder={handleCreateFolder} isLoading={false} />
      </View>

      {/* Section Types de haptic feedback */}
      <View style={tw`px-4 mb-6`}>
        <Text
          style={[
            tw`text-lg font-bold mb-4`,
            { color: currentTheme.colors.text },
          ]}
        >
          📳 Types de Haptic Feedback
        </Text>

        <View style={tw`space-y-3`}>
          {[
            {
              type: 'light' as const,
              label: 'Impact léger',
              color: 'bg-blue-500',
            },
            {
              type: 'medium' as const,
              label: 'Impact moyen',
              color: 'bg-purple-500',
            },
            {
              type: 'heavy' as const,
              label: 'Impact lourd',
              color: 'bg-indigo-500',
            },
            {
              type: 'success' as const,
              label: 'Succès',
              color: 'bg-green-500',
            },
            {
              type: 'warning' as const,
              label: 'Avertissement',
              color: 'bg-yellow-500',
            },
            { type: 'error' as const, label: 'Erreur', color: 'bg-red-500' },
          ].map(({ type, label, color }) => (
            <RippleButton
              key={type}
              onPress={() => handleHapticTest(type)}
              style={tw`p-4 rounded-xl ${color}`}
              rippleColor="rgba(255,255,255,0.4)"
              hapticType={type}
            >
              <Text style={tw`text-white font-semibold text-center`}>
                {label}
              </Text>
            </RippleButton>
          ))}
        </View>
      </View>

      {/* Section Fonctionnalités avancées */}
      <View style={tw`px-4 mb-6`}>
        <Text
          style={[
            tw`text-lg font-bold mb-4`,
            { color: currentTheme.colors.text },
          ]}
        >
          ⚡ Fonctionnalités Avancées
        </Text>

        <View
          style={[
            tw`p-4 rounded-xl`,
            {
              backgroundColor: currentTheme.colors.accent + '10',
              borderWidth: 1,
              borderColor: currentTheme.colors.accent + '30',
            },
          ]}
        >
          <Text
            style={[
              tw`text-sm font-semibold mb-3`,
              { color: currentTheme.colors.accent },
            ]}
          >
            🎨 Effets visuels ajoutés :
          </Text>
          <Text
            style={[
              tw`text-sm leading-5`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            • Effets de vague (ripple) sur tous les boutons{'\n'}• Animations de
            glow et de pulse{'\n'}• Transitions smooth avec spring physics{'\n'}
            • Bordures lumineuses animées{'\n'}• Feedbacks haptiques contextuels
            {'\n'}• Animations orchestrées et synchronisées{'\n'}• Scale effects
            avec damping personnalisé{'\n'}• Rotation et transformations 3D
            subtiles
          </Text>
        </View>
      </View>

      {/* Call to action */}
      <View style={tw`px-4`}>
        <LinearGradient
          colors={[
            currentTheme.colors.accent,
            currentTheme.colors.accent + 'E6',
          ]}
          style={tw`p-6 rounded-2xl`}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={tw`text-white text-lg font-bold text-center mb-2`}>
            🎉 Expérience Ultra-Moderne !
          </Text>
          <Text style={tw`text-white/80 text-center text-sm mb-4`}>
            Toutes ces micro-interactions sont maintenant intégrées dans votre
            AudioScreen pour une expérience utilisateur exceptionnelle.
          </Text>

          <Text style={tw`text-white/70 text-center text-xs`}>
            💡 Chaque interaction est maintenant accompagnée d'un feedback
            visuel et tactile qui rend l'application plus vivante et intuitive.
          </Text>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}
