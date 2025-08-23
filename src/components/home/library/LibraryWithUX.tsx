import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from '../../../hooks/useTranslation';
import { useCentralizedFont } from '../../../hooks/useCentralizedFont';
import { Script } from '../../../types';
import {
  GestureTooltip,
  InfoTooltip,
  LoadingIndicator,
  createBookItemVariant,
  useBookItemVariant,
  SkeletonLibrary,
  ProgressBar
} from '../../ui';
import tw from 'twrnc';

interface LibraryWithUXProps {
  scripts: Script[];
  isLoading?: boolean;
  loadingProgress?: number;
  onScriptPress: (scriptId: string) => void;
  onScriptLongPress: (scriptId: string) => void;
  selectedScripts: string[];
  isSelectionModeActive: boolean;
  onToggleSelection: (scriptId: string) => void;
}

// Exemple d'intégration des améliorations UX dans la bibliothèque
export const LibraryWithUX: React.FC<LibraryWithUXProps> = ({
  scripts,
  isLoading = false,
  loadingProgress = 0,
  onScriptPress,
  onScriptLongPress,
  selectedScripts,
  isSelectionModeActive,
  onToggleSelection,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui, heading } = useCentralizedFont();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [showTooltips, setShowTooltips] = useState(true);

  // État de chargement avec progression
  useEffect(() => {
    if (isLoading) {
      setShowTooltips(false); // Masquer les tooltips pendant le chargement
    } else {
      // Réactiver les tooltips après un délai
      const timer = setTimeout(() => setShowTooltips(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Utiliser le hook pour déterminer la variante selon le contexte
  const variant = useBookItemVariant(viewMode === 'compact' ? 'grid' : viewMode as 'grid' | 'list');
  const effectiveVariant = showTooltips && variant === 'interactive' ? 'interactive' : variant;

  // Fonction pour créer un script avec tooltips
  const createScriptWithTooltips = (script: Script, index: number) => {
    const baseProps = {
      script,
      onPress: () => onScriptPress(script.id),
      onLongPress: () => onScriptLongPress(script.id),
      isSelected: selectedScripts.includes(script.id),
      onToggleSelection: () => onToggleSelection(script.id),
      isSelectionModeActive,
      index,
    };

    // Ajouter des tooltips selon le contexte
    if (showTooltips && effectiveVariant === 'interactive') {
      return (
        <View key={script.id}>
          {createBookItemVariant(effectiveVariant, {
            ...baseProps,
            onScriptShare: (id) => console.log('Share', id),
            onScriptDuplicate: (id) => console.log('Duplicate', id),
            onScriptDelete: (id) => console.log('Delete', id),
            onToggleFavorite: (id) => console.log('Toggle favorite', id),
          })}
        </View>
      );
    }

    return (
      <View key={script.id}>
        {createBookItemVariant(effectiveVariant, baseProps)}
      </View>
    );
  };

  // Affichage de chargement
  if (isLoading) {
    return (
      <View style={tw`flex-1`}>
        {/* En-tête avec progression */}
        <View style={tw`p-4`}>
          <Text style={[heading, tw`text-lg mb-2`, { color: currentTheme.colors.text }]}>
            {t('library.loading', 'Chargement de la bibliothèque...')}
          </Text>
          <ProgressBar
            progress={loadingProgress}
            showPercentage={true}
            label={t('library.loadingScripts', 'Chargement des scripts')}
            color={currentTheme.colors.primary}
          />
        </View>

        {/* Skeletons de chargement */}
        <SkeletonLibrary type="books" shelfCount={3} />

        {/* Indicateur de chargement */}
        <View style={tw`absolute bottom-4 right-4`}>
          <LoadingIndicator
            size="medium"
            message={t('library.pleaseWait', 'Veuillez patienter...')}
            type="spinner"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={tw`flex-1`}>
      {/* En-tête avec contrôles de vue */}
      <View style={tw`p-4 border-b border-surface-20`}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <Text style={[heading, { color: currentTheme.colors.text }]}>
            {t('library.title', 'Ma Bibliothèque')}
          </Text>

          <InfoTooltip
            info={t('library.viewModeHelp', 'Changez le mode d\'affichage de vos scripts')}
            position="left"
          >
            <View style={tw`flex-row bg-surface-10 rounded-lg p-1`}>
              <TouchableOpacity
                style={[
                  tw`px-3 py-2 rounded-md`,
                  viewMode === 'grid' && { backgroundColor: currentTheme.colors.primary }
                ]}
                onPress={() => setViewMode('grid')}
              >
                <Text style={[
                  ui,
                  tw`text-sm`,
                  { color: viewMode === 'grid' ? 'white' : currentTheme.colors.text }
                ]}>
                  {t('library.grid', 'Grille')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  tw`px-3 py-2 rounded-md`,
                  viewMode === 'list' && { backgroundColor: currentTheme.colors.primary }
                ]}
                onPress={() => setViewMode('list')}
              >
                <Text style={[
                  ui,
                  tw`text-sm`,
                  { color: viewMode === 'list' ? 'white' : currentTheme.colors.text }
                ]}>
                  {t('library.list', 'Liste')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  tw`px-3 py-2 rounded-md`,
                  viewMode === 'compact' && { backgroundColor: currentTheme.colors.primary }
                ]}
                onPress={() => setViewMode('compact')}
              >
                <Text style={[
                  ui,
                  tw`text-sm`,
                  { color: viewMode === 'compact' ? 'white' : currentTheme.colors.text }
                ]}>
                  {t('library.compact', 'Compact')}
                </Text>
              </TouchableOpacity>
            </View>
          </InfoTooltip>
        </View>

        {/* Statistiques avec tooltips */}
        <View style={tw`flex-row justify-around`}>
          <InfoTooltip
            info={t('library.totalScriptsInfo', 'Nombre total de scripts dans votre bibliothèque')}
            position="top"
          >
            <View style={tw`items-center`}>
              <Text style={[heading, { color: currentTheme.colors.text }]}>
                {scripts.length}
              </Text>
              <Text style={[ui, tw`text-xs`, { color: currentTheme.colors.textSecondary }]}>
                {t('library.scripts', 'Scripts')}
              </Text>
            </View>
          </InfoTooltip>

          <InfoTooltip
            info={t('library.favoritesInfo', 'Scripts marqués comme favoris')}
            position="top"
          >
            <View style={tw`items-center`}>
              <Text style={[heading, { color: currentTheme.colors.text }]}>
                {scripts.filter(s => s.isFavorite).length}
              </Text>
              <Text style={[ui, tw`text-xs`, { color: currentTheme.colors.textSecondary }]}>
                {t('library.favorites', 'Favoris')}
              </Text>
            </View>
          </InfoTooltip>

          <InfoTooltip
            info={t('library.recentInfo', 'Scripts créés dans les dernières 24h')}
            position="top"
          >
            <View style={tw`items-center`}>
              <Text style={[heading, { color: currentTheme.colors.text }]}>
                {scripts.filter(s => {
                  const created = new Date(s.createdAt);
                  const now = new Date();
                  return (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
                }).length}
              </Text>
              <Text style={[ui, tw`text-xs`, { color: currentTheme.colors.textSecondary }]}>
                {t('library.recent', 'Récents')}
              </Text>
            </View>
          </InfoTooltip>
        </View>
      </View>

      {/* Contenu principal */}
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {scripts.length === 0 ? (
          <View style={tw`flex-1 items-center justify-center p-8`}>
            <GestureTooltip
              gesture="longPress"
              customMessage={t('library.emptyHelp', 'Appuyez longuement n\'importe où pour commencer')}
            >
              <View style={tw`items-center`}>
                <Text style={[heading, tw`text-xl mb-2`, { color: currentTheme.colors.textSecondary }]}>
                  {t('library.empty', 'Aucun script')}
                </Text>
                <Text style={[ui, tw`text-center`, { color: currentTheme.colors.textSecondary }]}>
                  {t('library.emptyDescription', 'Commencez par créer votre premier script')}
                </Text>
              </View>
            </GestureTooltip>
          </View>
        ) : (
          <View style={tw`p-4`}>
            {/* Organisation par étagères */}
            <View style={tw`mb-6`}>
              <Text style={[ui, tw`text-sm font-semibold mb-3`, { color: currentTheme.colors.textSecondary }]}>
                {t('library.allScripts', 'Tous vos scripts')}
              </Text>

              {/* Scripts en lignes */}
              {Array.from({ length: Math.ceil(scripts.length / (viewMode === 'compact' ? 4 : 3)) }).map((_, shelfIndex) => {
                const shelfScripts = scripts.slice(
                  shelfIndex * (viewMode === 'compact' ? 4 : 3),
                  (shelfIndex + 1) * (viewMode === 'compact' ? 4 : 3)
                );

                return (
                  <View key={`shelf-${shelfIndex}`} style={tw`mb-6`}>
                    <View style={[
                      tw`flex-row justify-center items-end mb-2`,
                      viewMode === 'list' && tw`flex-col space-y-2`
                    ]}>
                      {shelfScripts.map((script, scriptIndex) =>
                        createScriptWithTooltips(
                          script,
                          shelfIndex * (viewMode === 'compact' ? 4 : 3) + scriptIndex
                        )
                      )}
                    </View>

                    {/* Étage de la bibliothèque */}
                    <View
                      style={[
                        tw`h-3 mx-4 rounded-sm`,
                        { backgroundColor: currentTheme.colors.border + '40' }
                      ]}
                    />
                  </View>
                );
              })}
            </View>

            {/* Scripts favoris (si il y en a) */}
            {scripts.filter(s => s.isFavorite).length > 0 && (
              <View style={tw`mb-6`}>
                <Text style={[ui, tw`text-sm font-semibold mb-3`, { color: currentTheme.colors.textSecondary }]}>
                  ⭐ {t('library.favorites', 'Favoris')}
                </Text>

                <View style={tw`flex-row flex-wrap justify-start`}>
                  {scripts
                    .filter(s => s.isFavorite)
                    .map((script, index) =>
                      createScriptWithTooltips(script, index)
                    )}
                </View>
              </View>
            )}

            {/* Scripts récents (si il y en a) */}
            {scripts.filter(s => {
              const created = new Date(s.createdAt);
              const now = new Date();
              return (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
            }).length > 0 && (
              <View style={tw`mb-6`}>
                <Text style={[ui, tw`text-sm font-semibold mb-3`, { color: currentTheme.colors.textSecondary }]}>
                  🕐 {t('library.recent', 'Récents')}
                </Text>

                <View style={tw`flex-row flex-wrap justify-start`}>
                  {scripts
                    .filter(s => {
                      const created = new Date(s.createdAt);
                      const now = new Date();
                      return (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
                    })
                    .map((script, index) =>
                      createScriptWithTooltips(script, index)
                    )}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Mode de sélection actif - indicateur */}
      {isSelectionModeActive && (
        <View style={tw`absolute top-4 left-4 right-4`}>
          <InfoTooltip
            info={t('library.selectionModeHelp', 'Sélectionnez les scripts à modifier')}
            position="bottom"
          >
            <View style={[
              tw`p-3 rounded-lg items-center`,
              { backgroundColor: currentTheme.colors.primary + '20' }
            ]}>
              <Text style={[ui, tw`font-semibold`, { color: currentTheme.colors.primary }]}>
                {t('library.selectionMode', 'Mode de sélection actif')}
              </Text>
              <Text style={[ui, tw`text-xs`, { color: currentTheme.colors.textSecondary }]}>
                {selectedScripts.length} {t('library.selected', 'sélectionné(s)')}
              </Text>
            </View>
          </InfoTooltip>
        </View>
      )}
    </View>
  );
};
