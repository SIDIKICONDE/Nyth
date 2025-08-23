import React from 'react';
import { View, FlatList, Alert, Text, TouchableOpacity } from 'react-native';
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
import { useEqualizer } from '../../components/equalizer/hooks/useEqualizer';
import { useNoiseReduction } from '../../components/equalizer/hooks/useNoiseReduction';

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
    rmsLevel,
    rmsLevelDB,
    isSilent,
    hasClipping,
    availableDevices,
    currentDevice,
    statistics,
    hasPermission,
    lastError,
    errorCount,
    isRecovering,
    retryCount,
    startRecording: startNativeRecording,
    stopRecording: stopNativeRecording,
    pauseRecording: pauseNativeRecording,
    resumeRecording: resumeNativeRecording,
    selectDevice,
    updateConfig,
    resetStatistics,
    resetPeakLevel,
    analyzeAudioFile,
  } = useAudioCapture({
    onError: error => {
      Alert.alert(t('audio.error'), error.message);
      logger.error('🎤 Erreur audio:', error.message);
    },
    onAnalysis: analysis => {
      // Mise à jour en temps réel des niveaux audio
      logger.debug('📊 Analyse audio:', analysis);
    },
  });

  // Hook pour l'égaliseur (amélioration automatique)
  const {
    isInitialized: equalizerInitialized,
    enabled: equalizerEnabled,
    masterGain,
    bands,
    setBandGain,
    updateMasterGain,
    toggleEnabled,
    resetAllBands,
    isProcessing: equalizerProcessing,
  } = useEqualizer(10, 48000);

  // Hook pour la réduction de bruit (amélioration automatique)
  const {
    isEnabled: noiseReductionEnabled,
    mode: noiseReductionMode,
    rnnoiseAggressiveness,
    config: noiseReductionConfig,
    toggleEnabled: toggleNoiseReduction,
    changeMode: setNoiseReductionMode,
    setAggressiveness: setNoiseReductionAggressiveness,
    updateConfig: setNoiseReductionConfig,
  } = useNoiseReduction();

  // Activation automatique de l'égaliseur lors de l'enregistrement
  React.useEffect(() => {
    if (equalizerInitialized && isNativeRecording && !equalizerEnabled) {
      // Activer l'égaliseur automatiquement
      toggleEnabled();
      // Appliquer un preset optimisé automatiquement (reset des bandes)
      setTimeout(() => resetAllBands(), 500);
      logger.debug('🎛️ Égaliseur activé automatiquement pour l\'enregistrement');
    }
  }, [equalizerInitialized, isNativeRecording, equalizerEnabled, toggleEnabled, resetAllBands]);

  // Activation automatique de la réduction de bruit lors de l'enregistrement
  React.useEffect(() => {
    if (isNativeRecording && !noiseReductionEnabled) {
      // Activer la réduction de bruit automatiquement
      toggleNoiseReduction();
      // Configurer un mode agressif pour les environnements bruyants
      setNoiseReductionMode('rnnoise');
      setNoiseReductionAggressiveness(1.5); // Agressivité modérée

      // Configurer les paramètres avancés de réduction de bruit
      setNoiseReductionConfig({
        enabled: true,
        mode: 'rnnoise',
        rnnoiseAggressiveness: 1.5,
        highPassEnabled: true,
        highPassHz: 80, // Coupe-bas à 80Hz
        thresholdDb: -20,
        ratio: 4.0,
        floorDb: -40,
        attackMs: 10,
        releaseMs: 100,
      });
      logger.debug('🔇 Réduction de bruit activée automatiquement');
    }
  }, [isNativeRecording, noiseReductionEnabled, toggleNoiseReduction, setNoiseReductionMode, setNoiseReductionAggressiveness, setNoiseReductionConfig]);

  // Ajustement automatique du gain selon les niveaux audio
  React.useEffect(() => {
    if (equalizerEnabled && currentLevel > 0.8) {
      // Réduire le gain si le niveau est trop élevé
      const newGain = Math.max(-6, masterGain - 2);
      updateMasterGain(newGain);
    } else if (equalizerEnabled && currentLevel < 0.3 && masterGain < 6) {
      // Augmenter le gain si le niveau est trop faible
      const newGain = Math.min(6, masterGain + 1);
      updateMasterGain(newGain);
    }
  }, [currentLevel, equalizerEnabled, masterGain, updateMasterGain]);

  // Ajustement automatique de la réduction de bruit selon les conditions
  React.useEffect(() => {
    if (noiseReductionEnabled) {
      // Si le signal est très faible, réduire l'agressivité pour éviter les artefacts
      if (isSilent) {
        setNoiseReductionAggressiveness(Math.max(0.5, rnnoiseAggressiveness - 0.3));
      }
      // Si le niveau est très élevé, augmenter légèrement l'agressivité
      else if (currentLevel > 0.7) {
        setNoiseReductionAggressiveness(Math.min(2.5, rnnoiseAggressiveness + 0.2));
      }
      // Ajustement selon le bruit de fond estimé
      else if (hasClipping) {
        setNoiseReductionAggressiveness(Math.min(3.0, rnnoiseAggressiveness + 0.5));
      }
    }
  }, [noiseReductionEnabled, isSilent, currentLevel, hasClipping, rnnoiseAggressiveness, setNoiseReductionAggressiveness]);

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
        rmsLevel={rmsLevel}
        rmsLevelDB={rmsLevelDB}
        isRecording={isNativeRecording}
        isPaused={isRecordingPaused}
        isSilent={isSilent}
        hasClipping={hasClipping}
        statistics={statistics}
        equalizerEnabled={equalizerEnabled}
        equalizerProcessing={equalizerProcessing}
        masterGain={masterGain}
        equalizerAutoMode={true}
      />

      {/* Affichage des erreurs du module natif */}
      {(lastError || isRecovering) && (
        <View
          style={tw`mx-4 mb-4 p-3 rounded-lg ${
            lastError ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'
          }`}
        >
          {lastError && (
            <View style={tw`flex-row items-start mb-2`}>
              <Text style={tw`text-red-500 mr-2`}>⚠️</Text>
              <View style={tw`flex-1`}>
                <Text style={tw`text-red-700 dark:text-red-300 font-medium`}>
                  Erreur Audio
                </Text>
                <Text style={tw`text-red-600 dark:text-red-400 text-sm mt-1`}>
                  {lastError.message}
                </Text>
                <Text style={tw`text-red-500 dark:text-red-500 text-xs mt-1`}>
                  Code: {lastError.code}
                </Text>
              </View>
            </View>
          )}

          {isRecovering && (
            <View style={tw`flex-row items-center`}>
              <Text style={tw`text-yellow-500 mr-2`}>🔄</Text>
              <Text style={tw`text-yellow-700 dark:text-yellow-300 text-sm`}>
                Tentative de récupération... ({retryCount}/3)
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Boutons d'outils audio (uniquement pendant l'enregistrement) */}
      {isNativeRecording && (
        <View style={tw`mx-4 mb-4 flex-row justify-center space-x-2 flex-wrap`}>
          <TouchableOpacity
            onPress={resetStatistics}
            style={tw`bg-blue-500 px-3 py-2 rounded-lg mb-2`}
          >
            <Text style={tw`text-white text-sm font-medium`}>📊 Reset Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={resetPeakLevel}
            style={tw`bg-orange-500 px-3 py-2 rounded-lg mb-2`}
          >
            <Text style={tw`text-white text-sm font-medium`}>🔝 Reset Peak</Text>
          </TouchableOpacity>

          {availableDevices && availableDevices.length > 1 && (
            <TouchableOpacity
              onPress={() => {
                const nextDevice = availableDevices.find(d => d.id !== currentDevice?.id);
                if (nextDevice) {
                  selectDevice(nextDevice.id);
                  Alert.alert('✅', `Périphérique changé: ${nextDevice.name}`);
                }
              }}
              style={tw`bg-green-500 px-3 py-2 rounded-lg mb-2`}
            >
              <Text style={tw`text-white text-sm font-medium`}>🎤 Changer Périphérique</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              updateConfig({ sampleRate: 48000 }); // Exemple de changement de config
              Alert.alert('✅', 'Configuration mise à jour (48kHz)');
            }}
            style={tw`bg-purple-500 px-3 py-2 rounded-lg mb-2`}
          >
            <Text style={tw`text-white text-sm font-medium`}>⚙️ Mettre à jour Config</Text>
          </TouchableOpacity>
        </View>
      )}

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
