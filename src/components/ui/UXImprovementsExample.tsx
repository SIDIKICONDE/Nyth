import React, { useState } from 'react';
import { ScrollView, View, TouchableOpacity, Text } from 'react-native';
import { GestureTooltip, InfoTooltip, DestructiveActionTooltip } from './Tooltip';
import { ProgressBar, LoadingIndicator, StatusIndicator, DownloadIndicator } from './ProgressIndicators';
import { SkeletonLibrary } from './SkeletonLoading';
import { createBookItemVariant, useBookItemVariant } from '../home/library/BookItemVariants';
import { createVideoItemVariant, useVideoItemVariant } from '../home/video-library/VideoItemVariants';
import { useTheme } from '../../contexts/ThemeContext';
import { useCentralizedFont } from '../../hooks/useCentralizedFont';
import { Script, Recording } from '../../types';
import tw from 'twrnc';

// Exemple d'utilisation des améliorations UX
export const UXImprovementsExample: React.FC = () => {
  const { currentTheme } = useTheme();
  const { ui } = useCentralizedFont();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<'books' | 'videos'>('books');

  // Données d'exemple
  const mockScript: Script = {
    id: 'example-script',
    title: 'Script d\'exemple avec tooltips',
    content: 'Contenu d\'exemple',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
    tags: ['example'],
  };

  const mockRecording: Recording = {
    id: 'example-recording',
    videoUri: '/path/to/example.mp4',
    scriptId: 'example-script',
    duration: 120,
    quality: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hasOverlay: true,
    thumbnailUri: '/path/to/thumbnail.jpg',
    scriptTitle: 'Script d\'exemple',
  };

  const mockCallbacks = {
    onPress: () => console.log('Pressed'),
    onLongPress: () => console.log('Long pressed'),
    onToggleSelection: () => console.log('Selection toggled'),
  };

  // Simulation de chargement
  const simulateLoading = () => {
    setIsLoading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 1) {
          clearInterval(interval);
          setIsLoading(false);
          return 1;
        }
        return prev + 0.1;
      });
    }, 200);
  };

  return (
    <ScrollView style={tw`flex-1 p-4`}>
      {/* Section des Tooltips */}
      <View style={tw`mb-8`}>
        <Text style={[ui, tw`text-lg font-bold mb-4`, { color: currentTheme.colors.text }]}>
          🎯 Tooltips Informatifs
        </Text>

        {/* Tooltip de geste */}
        <View style={tw`mb-4`}>
          <GestureTooltip gesture="longPress" customMessage="Appuyez longuement pour voir plus d'options">
            <TouchableOpacity
              style={tw`p-4 rounded-lg bg-primary-20`}
              onLongPress={() => console.log('Long press detected')}
            >
              <Text style={[ui, { color: currentTheme.colors.text }]}>
                Test du tooltip de geste
              </Text>
            </TouchableOpacity>
          </GestureTooltip>
        </View>

        {/* Tooltip d'information */}
        <View style={tw`mb-4`}>
          <InfoTooltip info="Cette fonctionnalité vous permet de gérer vos scripts" position="bottom">
            <TouchableOpacity style={tw`p-4 rounded-lg bg-info-20`}>
              <Text style={[ui, { color: currentTheme.colors.text }]}>
                Information sur les scripts
              </Text>
            </TouchableOpacity>
          </InfoTooltip>
        </View>

        {/* Tooltip d'action destructive */}
        <View style={tw`mb-4`}>
          <DestructiveActionTooltip action="supprimer ce script définitivement">
            <TouchableOpacity style={tw`p-4 rounded-lg bg-error-20`}>
              <Text style={[ui, { color: currentTheme.colors.text }]}>
                Action dangereuse
              </Text>
            </TouchableOpacity>
          </DestructiveActionTooltip>
        </View>
      </View>

      {/* Section des Indicateurs de Progrès */}
      <View style={tw`mb-8`}>
        <Text style={[ui, tw`text-lg font-bold mb-4`, { color: currentTheme.colors.text }]}>
          📊 Indicateurs de Progrès
        </Text>

        {/* Barre de progrès simple */}
        <View style={tw`mb-4`}>
          <ProgressBar
            progress={0.7}
            label="Chargement du script"
            showPercentage={true}
          />
        </View>

        {/* Indicateur de téléchargement */}
        <View style={tw`mb-4`}>
          <DownloadIndicator
            progress={progress}
            speed="2.1 MB/s"
            remainingTime="00:32"
            fileName="script_video.mp4"
          />
        </View>

        {/* Indicateurs de statut */}
        <View style={tw`mb-4 flex-row justify-around`}>
          <StatusIndicator status="loading" message="Chargement..." />
          <StatusIndicator status="success" message="Terminé" />
          <StatusIndicator status="error" message="Erreur" />
          <StatusIndicator status="warning" message="Attention" />
        </View>
      </View>

      {/* Section des Skeletons */}
      <View style={tw`mb-8`}>
        <Text style={[ui, tw`text-lg font-bold mb-4`, { color: currentTheme.colors.text }]}>
          🦴 Skeletons de Chargement
        </Text>

        <TouchableOpacity
          style={tw`p-4 rounded-lg mb-4 bg-primary`}
          onPress={simulateLoading}
        >
          <Text style={[ui, tw`text-center text-white font-bold`]}>
            Simuler le chargement
          </Text>
        </TouchableOpacity>

        {isLoading && (
          <View style={tw`mb-4`}>
            <SkeletonLibrary
              type={selectedVariant}
              shelfCount={2}
            />
          </View>
        )}
      </View>

      {/* Section des Variantes de Composants */}
      <View style={tw`mb-8`}>
        <Text style={[ui, tw`text-lg font-bold mb-4`, { color: currentTheme.colors.text }]}>
          🎨 Variantes de Composants
        </Text>

        {/* Sélecteur de variante */}
        <View style={tw`flex-row mb-4`}>
          <TouchableOpacity
            style={[
              tw`flex-1 p-3 rounded-lg mr-2`,
              { backgroundColor: selectedVariant === 'books' ? currentTheme.colors.primary : currentTheme.colors.surface }
            ]}
            onPress={() => setSelectedVariant('books')}
          >
            <Text style={[ui, tw`text-center`, { color: selectedVariant === 'books' ? 'white' : currentTheme.colors.text }]}>
              Livres
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              tw`flex-1 p-3 rounded-lg ml-2`,
              { backgroundColor: selectedVariant === 'videos' ? currentTheme.colors.primary : currentTheme.colors.surface }
            ]}
            onPress={() => setSelectedVariant('videos')}
          >
            <Text style={[ui, tw`text-center`, { color: selectedVariant === 'videos' ? 'white' : currentTheme.colors.text }]}>
              Vidéos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Exemples de variantes */}
        <View style={tw`space-y-4`}>
          {selectedVariant === 'books' && (
            <View>
              <Text style={[ui, tw`mb-2`, { color: currentTheme.colors.text }]}>
                Variantes de BookItem:
              </Text>

              <View style={tw`flex-row flex-wrap justify-around`}>
                {createBookItemVariant('compact', {
                  script: mockScript,
                  ...mockCallbacks,
                  isSelected: false,
                  isSelectionModeActive: false,
                  index: 0,
                })}

                {createBookItemVariant('mini', {
                  script: mockScript,
                  ...mockCallbacks,
                  isSelected: false,
                  isSelectionModeActive: false,
                  index: 1,
                })}
              </View>
            </View>
          )}

          {selectedVariant === 'videos' && (
            <View>
              <Text style={[ui, tw`mb-2`, { color: currentTheme.colors.text }]}>
                Variantes de VideoItem:
              </Text>

              <View style={tw`flex-row flex-wrap justify-around`}>
                {createVideoItemVariant('compact', {
                  recording: mockRecording,
                  scripts: [mockScript],
                  ...mockCallbacks,
                  isSelected: false,
                  isSelectionModeActive: false,
                  index: 0,
                })}

                {createVideoItemVariant('mini', {
                  recording: mockRecording,
                  scripts: [mockScript],
                  ...mockCallbacks,
                  isSelected: false,
                  isSelectionModeActive: false,
                  index: 1,
                })}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Section des Hooks Utilitaires */}
      <View style={tw`mb-8`}>
        <Text style={[ui, tw`text-lg font-bold mb-4`, { color: currentTheme.colors.text }]}>
          🪝 Hooks Utilitaires
        </Text>

        <View style={tw`p-4 rounded-lg bg-surface-20`}>
          <Text style={[ui, tw`mb-2`, { color: currentTheme.colors.text }]}>
            Hook useBookItemVariant:
          </Text>
          <Text style={[ui, tw`text-sm mb-3`, { color: currentTheme.colors.textSecondary }]}>
            Contexte 'grid' → variante '{useBookItemVariant('grid')}'
          </Text>
          <Text style={[ui, tw`text-sm mb-3`, { color: currentTheme.colors.textSecondary }]}>
            Contexte 'favorites' → variante '{useBookItemVariant('favorites')}'
          </Text>

          <Text style={[ui, tw`mb-2`, { color: currentTheme.colors.text }]}>
            Hook useVideoItemVariant:
          </Text>
          <Text style={[ui, tw`text-sm mb-3`, { color: currentTheme.colors.textSecondary }]}>
            Contexte 'timeline' → variante '{useVideoItemVariant('timeline')}'
          </Text>
          <Text style={[ui, tw`text-sm`, { color: currentTheme.colors.textSecondary }]}>
            Contexte 'downloads' → variante '{useVideoItemVariant('downloads')}'
          </Text>
        </View>
      </View>

      {/* Section des Bonnes Pratiques UX */}
      <View style={tw`mb-8`}>
        <Text style={[ui, tw`text-lg font-bold mb-4`, { color: currentTheme.colors.text }]}>
          ✨ Bonnes Pratiques UX Implémentées
        </Text>

        <View style={tw`space-y-3`}>
          <View style={tw`p-3 rounded-lg bg-success-10`}>
            <Text style={[ui, tw`font-semibold mb-1`, { color: currentTheme.colors.text }]}>
              ✅ Feedback Visuel Immédiat
            </Text>
            <Text style={[ui, tw`text-sm`, { color: currentTheme.colors.textSecondary }]}>
              Animations, tooltips, et indicateurs de statut
            </Text>
          </View>

          <View style={tw`p-3 rounded-lg bg-info-10`}>
            <Text style={[ui, tw`font-semibold mb-1`, { color: currentTheme.colors.text }]}>
              ✅ Accessibilité Renforcée
            </Text>
            <Text style={[ui, tw`text-sm`, { color: currentTheme.colors.textSecondary }]}>
              Lecteurs d'écran, contrastes, navigation clavier
            </Text>
          </View>

          <View style={tw`p-3 rounded-lg bg-warning-10`}>
            <Text style={[ui, tw`font-semibold mb-1`, { color: currentTheme.colors.text }]}>
              ✅ États de Chargement Riches
            </Text>
            <Text style={[ui, tw`text-sm`, { color: currentTheme.colors.textSecondary }]}>
              Skeletons, spinners, barres de progrès contextuelles
            </Text>
          </View>

          <View style={tw`p-3 rounded-lg bg-primary-10`}>
            <Text style={[ui, tw`font-semibold mb-1`, { color: currentTheme.colors.text }]}>
              ✅ Variantes Contextuelles
            </Text>
            <Text style={[ui, tw`text-sm`, { color: currentTheme.colors.textSecondary }]}>
              Composants adaptés à chaque contexte d'utilisation
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
