import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Alert } from 'react-native';
import {
  GestureTooltip,
  InfoTooltip,
  LoadingIndicator,
  ProgressBar,
  SkeletonBookItem,
  createBookItemVariant,
  useBookItemVariant
} from '../ui';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { Script } from '../../types';
import tw from 'twrnc';

// Exemple d'intégration des améliorations UX dans un composant réel
export const UXIntegrationExample: React.FC = () => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');

  // Simulation de chargement avec progression
  useEffect(() => {
    const loadScripts = async () => {
      setIsLoading(true);
      setProgress(0);

      // Simulation de progression
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 1) {
            clearInterval(interval);
            setIsLoading(false);

            // Données d'exemple
            setScripts([
              {
                id: '1',
                title: 'Script de démonstration UX',
                content: 'Contenu avec tooltips et améliorations',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isFavorite: true,
                tags: ['ux', 'demo'],
              },
              {
                id: '2',
                title: 'Script avec tooltips',
                content: 'Test des interactions',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isFavorite: false,
                tags: ['test'],
              },
            ]);
            return 1;
          }
          return prev + 0.1;
        });
      }, 150);

      return () => clearInterval(interval);
    };

    loadScripts();
  }, []);

  // Déterminer la variante selon le contexte
  const variant = useBookItemVariant(viewMode);

  const handleScriptPress = (scriptId: string) => {
    Alert.alert('Script sélectionné', `ID: ${scriptId}`);
  };

  const handleLongPress = (scriptId: string) => {
    Alert.alert('Actions disponibles', `Script: ${scriptId}`);
  };

  // Props communes pour les BookItem
  const getBookItemProps = (script: Script, index: number) => ({
    script,
    onPress: () => handleScriptPress(script.id),
    onLongPress: () => handleLongPress(script.id),
    isSelected: false,
    isSelectionModeActive: false,
    index,
    onScriptShare: (id: string) => Alert.alert('Partage', `Script ${id}`),
    onScriptDuplicate: (id: string) => Alert.alert('Duplication', `Script ${id}`),
    onScriptDelete: (id: string) => Alert.alert('Suppression', `Script ${id}`),
    onToggleFavorite: (id: string) => Alert.alert('Favori', `Script ${id}`),
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: currentTheme.colors.background }}>
      {/* En-tête avec tooltips */}
      <View style={tw`p-4 border-b border-surface-20`}>
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <Text style={[tw`text-xl font-bold`, { color: currentTheme.colors.text }]}>
            📚 Bibliothèque Interactive
          </Text>

          <InfoTooltip
            info="Changez le mode d'affichage de vos scripts"
            position="left"
          >
            <View style={tw`flex-row bg-surface-10 rounded-lg p-1`}>
              {(['grid', 'list', 'compact'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    tw`px-3 py-2 rounded-md`,
                    viewMode === mode && { backgroundColor: currentTheme.colors.primary }
                  ]}
                  onPress={() => setViewMode(mode)}
                >
                  <Text style={[
                    tw`text-sm`,
                    { color: viewMode === mode ? 'white' : currentTheme.colors.text }
                  ]}>
                    {mode === 'grid' ? 'Grille' : mode === 'list' ? 'Liste' : 'Compact'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </InfoTooltip>
        </View>

        {/* Statistiques avec tooltips */}
        <View style={tw`flex-row justify-around`}>
          <InfoTooltip
            info="Nombre total de scripts dans votre bibliothèque"
            position="top"
          >
            <View style={tw`items-center`}>
              <Text style={[tw`text-lg font-bold`, { color: currentTheme.colors.text }]}>
                {scripts.length}
              </Text>
              <Text style={[tw`text-xs`, { color: currentTheme.colors.textSecondary }]}>
                Scripts
              </Text>
            </View>
          </InfoTooltip>

          <InfoTooltip
            info="Scripts marqués comme favoris"
            position="top"
          >
            <View style={tw`items-center`}>
              <Text style={[tw`text-lg font-bold`, { color: currentTheme.colors.text }]}>
                {scripts.filter(s => s.isFavorite).length}
              </Text>
              <Text style={[tw`text-xs`, { color: currentTheme.colors.textSecondary }]}>
                Favoris
              </Text>
            </View>
          </InfoTooltip>
        </View>
      </View>

      {/* État de chargement avec progression */}
      {isLoading && (
        <View style={tw`p-4`}>
          <Text style={[tw`text-lg mb-2`, { color: currentTheme.colors.text }]}>
            Chargement de la bibliothèque...
          </Text>

          <ProgressBar
            progress={progress}
            showPercentage={true}
            label="Chargement des scripts"
            color={currentTheme.colors.primary}
          />

          <View style={tw`mt-4`}>
            <SkeletonBookItem />
            <View style={tw`mt-4`}>
              <SkeletonBookItem />
            </View>
          </View>

          <View style={tw`absolute top-4 right-4`}>
            <LoadingIndicator
              size="medium"
              message="Veuillez patienter"
              type="spinner"
            />
          </View>
        </View>
      )}

      {/* Contenu principal */}
      {!isLoading && (
        <View style={tw`p-4`}>
          <Text style={[tw`text-sm font-semibold mb-3`, { color: currentTheme.colors.textSecondary }]}>
            {scripts.length === 0 ? 'Aucun script' : `Vos scripts (${scripts.length})`}
          </Text>

          {/* Scripts avec variantes */}
          <View style={[
            tw`flex-wrap`,
            viewMode === 'list' && tw`flex-col space-y-2`
          ]}>
            {scripts.map((script, index) => (
              <View key={script.id} style={viewMode !== 'list' && tw`mr-2 mb-4`}>
                {createBookItemVariant(variant, getBookItemProps(script, index))}
              </View>
            ))}
          </View>

          {/* Section d'aide avec tooltips */}
          <View style={tw`mt-8 p-4 bg-surface-10 rounded-lg`}>
            <Text style={[tw`text-sm font-semibold mb-2`, { color: currentTheme.colors.text }]}>
              💡 Conseils d'utilisation
            </Text>

            <View style={tw`space-y-2`}>
              <GestureTooltip gesture="tap" customMessage="Appuyez sur un script pour l'ouvrir">
                <View style={tw`flex-row items-center p-2 bg-surface-5 rounded`}>
                  <Text style={tw`text-primary mr-2`}>👆</Text>
                  <Text style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}>
                    Appuyez pour ouvrir un script
                  </Text>
                </View>
              </GestureTooltip>

              <GestureTooltip gesture="longPress" customMessage="Appuyez longuement pour voir les actions">
                <View style={tw`flex-row items-center p-2 bg-surface-5 rounded`}>
                  <Text style={tw`text-primary mr-2`}>👆</Text>
                  <Text style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}>
                    Appuyez longuement pour plus d'actions
                  </Text>
                </View>
              </GestureTooltip>

              <InfoTooltip
                info="Changez le mode de vue pour adapter l'affichage à vos besoins"
                position="bottom"
              >
                <View style={tw`flex-row items-center p-2 bg-surface-5 rounded`}>
                  <Text style={tw`text-primary mr-2`}>🔄</Text>
                  <Text style={[tw`text-sm`, { color: currentTheme.colors.textSecondary }]}>
                    Utilisez les boutons de vue en haut
                  </Text>
                </View>
              </InfoTooltip>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};
