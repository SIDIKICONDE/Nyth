import React from 'react';
import { View, FlatList, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import tw from 'twrnc';
import { useNavigation } from '@react-navigation/native';
import RNFS from 'react-native-fs';

// Hooks et contextes
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useOrientation } from '@/hooks/useOrientation';

// Composants
import AudioScreenHeader from './components/AudioScreenHeader';
import AudioFolderCard from './components/AudioFolderCard';
import AudioFAB from './components/AudioFAB';
import EmptyState from './components/EmptyState';
import AudioFolderActions from './components/AudioFolderActions';
import AudioSearchBar from './components/AudioSearchBar';
import AudioLevelIndicator from './components/AudioLevelIndicator';

// Hooks personnalisés
import { useAudioFolders } from './hooks/useAudioFolders';
import { useAudioScreenState } from './hooks/useAudioScreenState';
import { useAudioCapture } from './hooks/useAudioCapture';

// Types
import { AudioFolder } from './types';

// Services
import { createOptimizedLogger } from '@/utils/optimizedLogger';
const logger = createOptimizedLogger('AudioScreen');

export default function AudioScreen() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const orientation = useOrientation();

  // État de l'écran
  const {
    isSelectionMode,
    selectedFolders,
    toggleSelectionMode,
    toggleFolderSelection,
    clearSelection,
  } = useAudioScreenState();

  // Hook pour la capture audio native (TurboModule)
  const {
    isRecording: isNativeRecording,
    isPaused: isRecordingPaused,
    recordingInfo,
    currentLevel,
    peakLevel,
    hasPermission,
    startRecording: startNativeRecording,
    stopRecording: stopNativeRecording,
    pauseRecording: pauseNativeRecording,
    resumeRecording: resumeNativeRecording,
    analyzeAudioFile,
  } = useAudioCapture({
    onError: error => {
      Alert.alert(t('audio.error'), error);
      logger.error('🎤 Erreur audio:', error);
    },
    onAnalysis: analysis => {
      // Mise à jour en temps réel des niveaux audio
      logger.debug('📊 Analyse audio:', analysis);
    },
  });

  // État d'enregistrement (utilise maintenant le module natif)
  const [recordingDuration, setRecordingDuration] = React.useState(0);
  const recordingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // État de recherche et organisation
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<
    'name' | 'date' | 'count' | 'duration'
  >('date');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = React.useState<
    'all' | 'favorites' | 'recent' | 'empty'
  >('all');

  // État des actions de dossier
  const [selectedFolder, setSelectedFolder] =
    React.useState<AudioFolder | null>(null);
  const [showFolderActions, setShowFolderActions] = React.useState(false);

  // Gestion de l'enregistrement
  const startRecording = React.useCallback(async () => {
    // Générer un nom de fichier unique pour l'enregistrement
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `audio_${timestamp}.wav`;
    const filePath = `${RNFS.DocumentDirectoryPath}/recordings/${fileName}`;

    // Démarrer l'enregistrement avec le module natif
    const success = await startNativeRecording(filePath, {
      format: 'wav',
      maxDuration: 3600, // 1 heure max
    });

    if (success) {
      setRecordingDuration(0);

      // Démarrer le chronomètre
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      logger.debug('🎤 Enregistrement démarré:', filePath);
    }
  }, [startNativeRecording]);

  // Données des dossiers
  const {
    folders,
    isLoading,
    createFolder,
    deleteFolder,
    deleteSelectedFolders,
    updateFolder,
    editFolder,
    changeFolderColor,
    addFolderTag,
    removeFolderTag,
    duplicateFolder,
    toggleFavorite,
    sortFolders,
    filterFolders,
    searchFolders,
    refreshFolders,
  } = useAudioFolders();

  const stopRecording = React.useCallback(async () => {
    const success = stopNativeRecording();

    if (success) {
      // Arrêter le chronomètre
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      // Analyser le fichier enregistré si disponible
      if (recordingInfo?.path) {
        const analysis = await analyzeAudioFile(recordingInfo.path);
        logger.debug('📊 Analyse du fichier enregistré:', analysis);

        // Rafraîchir la liste des dossiers pour afficher le nouvel enregistrement
        await refreshFolders();
      }

      logger.debug(
        `🎵 Enregistrement arrêté, durée: ${recordingDuration} secondes`,
      );
    }
  }, [
    stopNativeRecording,
    recordingInfo,
    analyzeAudioFile,
    refreshFolders,
    recordingDuration,
  ]);

  // Nettoyer l'intervalle au démontage
  React.useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Handlers
  // Gestion des dossiers avec actions étendues
  const handleCloseFolderActions = () => {
    setShowFolderActions(false);
    setSelectedFolder(null);
  };

  const handleEditFolder = async (
    folderId: string,
    name: string,
    description?: string,
  ) => {
    await editFolder(folderId, name, description);
  };

  const handleChangeFolderColor = async (folderId: string, color: string) => {
    await changeFolderColor(folderId, color);
  };

  const handleAddFolderTag = async (folderId: string, tag: string) => {
    await addFolderTag(folderId, tag);
  };

  const handleRemoveFolderTag = async (folderId: string, tag: string) => {
    await removeFolderTag(folderId, tag);
  };

  const handleDuplicateFolder = async (folderId: string) => {
    await duplicateFolder(folderId);
  };

  // Gestion de la recherche et du tri
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSortChange = (
    newSortBy: 'name' | 'date' | 'count' | 'duration',
    newSortOrder: 'asc' | 'desc',
  ) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    sortFolders(newSortBy, newSortOrder);
  };

  const handleFilterChange = (
    newFilter: 'all' | 'favorites' | 'recent' | 'empty',
  ) => {
    setFilterBy(newFilter);
  };

  // Dossiers filtrés et triés
  const getFilteredFolders = React.useCallback(() => {
    let filtered = folders;

    // Appliquer le filtre
    if (filterBy !== 'all') {
      filtered = filterFolders(filterBy);
    }

    // Appliquer la recherche
    if (searchQuery.trim()) {
      filtered = searchFolders(searchQuery);
    }

    return filtered;
  }, [folders, filterBy, searchQuery, filterFolders, searchFolders]);

  const handleFABPress = () => {
    if (isNativeRecording) {
      stopRecording();
    } else {
      // Pour l'instant, on simule l'enregistrement
      // Dans un vrai projet, vous pourriez demander le nom du dossier d'abord
      startRecording();
    }
  };

  const handleCreateFolder = async () => {
    try {
      Alert.prompt(
        t('audio.createFolder.title', 'Nouveau dossier'),
        t('audio.createFolder.message', 'Entrez le nom du dossier'),
        [
          { text: t('common.cancel', 'Annuler'), style: 'cancel' },
          {
            text: t('common.create', 'Créer'),
            onPress: async folderName => {
              if (folderName && folderName.trim()) {
                await createFolder(folderName.trim());
                logger.debug('📁 Dossier créé:', folderName);
              }
            },
          },
        ],
      );
    } catch (error) {
      logger.error('❌ Erreur lors de la création du dossier:', error);
      Alert.alert(
        t('common.error', 'Erreur'),
        t('audio.createFolder.error', 'Impossible de créer le dossier'),
      );
    }
  };

  const handleFolderPress = (folder: AudioFolder) => {
    if (isSelectionMode) {
      toggleFolderSelection(folder.id);
    } else {
      // Navigation vers les détails du dossier
      // TODO: Implémenter la navigation vers AudioFolderDetail
      console.log('Navigation vers le dossier:', folder.name);
    }
  };

  const handleFolderLongPress = (folder: AudioFolder) => {
    if (!isSelectionMode) {
      toggleSelectionMode();
      toggleFolderSelection(folder.id);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder(folderId);
      logger.debug('🗑️ Dossier supprimé:', folderId);
    } catch (error) {
      logger.error('❌ Erreur lors de la suppression:', error);
      Alert.alert(
        t('common.error', 'Erreur'),
        t('audio.deleteFolder.error', 'Impossible de supprimer le dossier'),
      );
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await deleteSelectedFolders(selectedFolders);
      clearSelection();
      logger.debug(
        '🗑️ Dossiers sélectionnés supprimés:',
        selectedFolders.length,
      );
    } catch (error) {
      logger.error('❌ Erreur lors de la suppression multiple:', error);
      Alert.alert(
        t('common.error', 'Erreur'),
        t(
          'audio.deleteSelected.error',
          'Impossible de supprimer les dossiers sélectionnés',
        ),
      );
    }
  };

  const renderFolder = ({ item }: { item: AudioFolder }) => (
    <AudioFolderCard
      folder={item}
      isSelected={selectedFolders.includes(item.id)}
      isSelectionMode={isSelectionMode}
      onPress={() => handleFolderPress(item)}
      onLongPress={() =>
        isSelectionMode
          ? toggleFolderSelection(item.id)
          : handleFolderLongPress(item)
      }
      onDelete={() => handleDeleteFolder(item.id)}
    />
  );

  const renderEmptyState = () => (
    <EmptyState onCreateFolder={handleCreateFolder} isLoading={isLoading} />
  );

  return (
    <View
      style={[tw`flex-1`, { backgroundColor: currentTheme.colors.background }]}
    >
      {/* Gradient de fond */}
      <LinearGradient
        colors={[`${currentTheme.colors.accent}15`, 'transparent']}
        style={tw`absolute top-0 left-0 right-0 h-40`}
      />

      {/* Header */}
      <AudioScreenHeader
        isSelectionMode={isSelectionMode}
        selectedCount={selectedFolders.length}
        totalCount={folders.length}
        onClearSelection={clearSelection}
        onDeleteSelected={handleDeleteSelected}
        onToggleSelectionMode={toggleSelectionMode}
      />

      {/* Barre de recherche et filtres */}
      <AudioSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(newSortBy, newSortOrder) => {
          setSortBy(newSortBy);
          setSortOrder(newSortOrder);
          sortFolders(newSortBy, newSortOrder);
        }}
        filterBy={filterBy}
        onFilterChange={setFilterBy}
      />

      {/* Indicateur de niveau audio pendant l'enregistrement */}
      <AudioLevelIndicator
        currentLevel={currentLevel}
        peakLevel={peakLevel}
        isRecording={isNativeRecording}
        isPaused={isRecordingPaused}
      />

      {/* Liste des dossiers */}
      <FlatList
        testID="folders-flatlist"
        data={getFilteredFolders()}
        renderItem={renderFolder}
        keyExtractor={item => item.id}
        numColumns={orientation.orientation === 'portrait' ? 2 : 3}
        contentContainerStyle={[
          tw`p-4`,
          getFilteredFolders().length === 0 && tw`flex-1 justify-center`,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshing={isLoading}
        onRefresh={() => {
          refreshFolders();
        }}
      />

      {/* Actions des dossiers */}
      {showFolderActions && selectedFolder && (
        <AudioFolderActions
          folder={selectedFolder}
          onClose={handleCloseFolderActions}
          onEdit={handleEditFolder}
          onChangeColor={handleChangeFolderColor}
          onAddTag={handleAddFolderTag}
          onRemoveTag={handleRemoveFolderTag}
          onDuplicate={handleDuplicateFolder}
          onDelete={deleteFolder}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* FAB pour créer un nouveau dossier */}
      {!isSelectionMode && (
        <AudioFAB
          onPress={handleFABPress}
          onPausePress={pauseNativeRecording}
          onResumePress={resumeNativeRecording}
          isRecording={isNativeRecording}
          isPaused={isRecordingPaused}
          recordingDuration={recordingDuration}
        />
      )}
    </View>
  );
}
