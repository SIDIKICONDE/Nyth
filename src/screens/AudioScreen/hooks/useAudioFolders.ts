import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioFolder } from '../types';
import { createOptimizedLogger } from '@/utils/optimizedLogger';

const logger = createOptimizedLogger('useAudioFolders');
const AUDIO_FOLDERS_KEY = 'audio_folders';

// Données de test pour démarrer
const defaultFolders: AudioFolder[] = [
  {
    id: '1',
    name: 'Enregistrements personnels',
    description: 'Notes et mémos personnels',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    recordingCount: 12,
    totalDuration: 3600,
    isFavorite: true,
    color: '#4CAF50',
    icon: 'person',
    tags: ['personnel', 'notes'],
    lastRecordingDate: new Date('2024-01-20'),
  },
  {
    id: '2',
    name: 'Réunions de travail',
    description: 'Enregistrements des réunions professionnelles',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    recordingCount: 8,
    totalDuration: 7200,
    isFavorite: false,
    color: '#2196F3',
    icon: 'work',
    tags: ['travail', 'réunions'],
    lastRecordingDate: new Date('2024-01-18'),
  },
  {
    id: '3',
    name: 'Idées créatives',
    description: 'Brainstorming et idées pour projets',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-19'),
    recordingCount: 15,
    totalDuration: 5400,
    isFavorite: true,
    color: '#FF9800',
    icon: 'lightbulb',
    tags: ['créativité', 'projets'],
    lastRecordingDate: new Date('2024-01-19'),
  },
];

export function useAudioFolders() {
  const [folders, setFolders] = useState<AudioFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les dossiers depuis AsyncStorage
  const loadFolders = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(AUDIO_FOLDERS_KEY);

      if (stored) {
        const parsedFolders = JSON.parse(stored).map((folder: any) => ({
          ...folder,
          createdAt: new Date(folder.createdAt),
          updatedAt: new Date(folder.updatedAt),
          lastRecordingDate: folder.lastRecordingDate
            ? new Date(folder.lastRecordingDate)
            : undefined,
        }));
        setFolders(parsedFolders);
      } else {
        // Initialiser avec les données par défaut
        setFolders(defaultFolders);
        await AsyncStorage.setItem(
          AUDIO_FOLDERS_KEY,
          JSON.stringify(defaultFolders),
        );
      }

      logger.debug('📁 Dossiers chargés:', folders.length);
    } catch (error) {
      logger.error('❌ Erreur lors du chargement des dossiers:', error);
      setFolders(defaultFolders);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sauvegarder les dossiers
  const saveFolders = useCallback(async (newFolders: AudioFolder[]) => {
    try {
      await AsyncStorage.setItem(AUDIO_FOLDERS_KEY, JSON.stringify(newFolders));
      logger.debug('💾 Dossiers sauvegardés');
    } catch (error) {
      logger.error('❌ Erreur lors de la sauvegarde:', error);
      throw error;
    }
  }, []);

  // Créer un nouveau dossier
  const createFolder = useCallback(
    async (name: string, description?: string) => {
      try {
        const newFolder: AudioFolder = {
          id: Date.now().toString(),
          name,
          description,
          createdAt: new Date(),
          updatedAt: new Date(),
          recordingCount: 0,
          totalDuration: 0,
          isFavorite: false,
          color: '#9C27B0', // Couleur par défaut
          icon: 'folder',
          tags: [],
        };

        const updatedFolders = [...folders, newFolder];
        setFolders(updatedFolders);
        await saveFolders(updatedFolders);

        logger.debug('➕ Dossier créé:', name);
        return newFolder;
      } catch (error) {
        logger.error('❌ Erreur lors de la création du dossier:', error);
        throw error;
      }
    },
    [folders, saveFolders],
  );

  // Supprimer un dossier
  const deleteFolder = useCallback(
    async (folderId: string) => {
      try {
        const updatedFolders = folders.filter(folder => folder.id !== folderId);
        setFolders(updatedFolders);
        await saveFolders(updatedFolders);

        logger.debug('🗑️ Dossier supprimé:', folderId);
      } catch (error) {
        logger.error('❌ Erreur lors de la suppression:', error);
        throw error;
      }
    },
    [folders, saveFolders],
  );

  // Supprimer plusieurs dossiers
  const deleteSelectedFolders = useCallback(
    async (folderIds: string[]) => {
      try {
        const updatedFolders = folders.filter(
          folder => !folderIds.includes(folder.id),
        );
        setFolders(updatedFolders);
        await saveFolders(updatedFolders);

        logger.debug('🗑️ Dossiers supprimés:', folderIds.length);
      } catch (error) {
        logger.error('❌ Erreur lors de la suppression multiple:', error);
        throw error;
      }
    },
    [folders, saveFolders],
  );

  // Mettre à jour un dossier
  const updateFolder = useCallback(
    async (folderId: string, updates: Partial<AudioFolder>) => {
      try {
        const updatedFolders = folders.map(folder =>
          folder.id === folderId
            ? { ...folder, ...updates, updatedAt: new Date() }
            : folder,
        );
        setFolders(updatedFolders);
        await saveFolders(updatedFolders);

        logger.debug('✏️ Dossier mis à jour:', folderId);
      } catch (error) {
        logger.error('❌ Erreur lors de la mise à jour:', error);
        throw error;
      }
    },
    [folders, saveFolders],
  );

  // Basculer le statut favori
  const toggleFavorite = useCallback(
    async (folderId: string) => {
      try {
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
          await updateFolder(folderId, { isFavorite: !folder.isFavorite });
        }
      } catch (error) {
        logger.error('❌ Erreur lors du basculement favori:', error);
        throw error;
      }
    },
    [folders, updateFolder],
  );

  // Éditer un dossier (nom, description)
  const editFolder = useCallback(
    async (folderId: string, name: string, description?: string) => {
      try {
        await updateFolder(folderId, { name, description });
        logger.debug(`✏️ Dossier édité: ${folderId} - ${name}`);
      } catch (error) {
        logger.error("❌ Erreur lors de l'édition:", error);
        throw error;
      }
    },
    [updateFolder],
  );

  // Changer la couleur d'un dossier
  const changeFolderColor = useCallback(
    async (folderId: string, color: string) => {
      try {
        await updateFolder(folderId, { color });
        logger.debug(`🎨 Couleur du dossier changée: ${folderId} - ${color}`);
      } catch (error) {
        logger.error('❌ Erreur lors du changement de couleur:', error);
        throw error;
      }
    },
    [updateFolder],
  );

  // Ajouter un tag à un dossier
  const addFolderTag = useCallback(
    async (folderId: string, tag: string) => {
      try {
        const folder = folders.find(f => f.id === folderId);
        if (folder && !folder.tags.includes(tag)) {
          await updateFolder(folderId, { tags: [...folder.tags, tag] });
          logger.debug(`🏷️ Tag ajouté: ${folderId} - ${tag}`);
        }
      } catch (error) {
        logger.error("❌ Erreur lors de l'ajout du tag:", error);
        throw error;
      }
    },
    [folders, updateFolder],
  );

  // Supprimer un tag d'un dossier
  const removeFolderTag = useCallback(
    async (folderId: string, tag: string) => {
      try {
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
          await updateFolder(folderId, {
            tags: folder.tags.filter(t => t !== tag),
          });
          logger.debug(`🏷️ Tag supprimé: ${folderId} - ${tag}`);
        }
      } catch (error) {
        logger.error('❌ Erreur lors de la suppression du tag:', error);
        throw error;
      }
    },
    [folders, updateFolder],
  );

  // Dupliquer un dossier
  const duplicateFolder = useCallback(
    async (folderId: string, newName?: string) => {
      try {
        const folder = folders.find(f => f.id === folderId);
        if (!folder) throw new Error('Dossier non trouvé');

        const newFolder: AudioFolder = {
          ...folder,
          id: Date.now().toString(),
          name: newName || `${folder.name} (Copie)`,
          createdAt: new Date(),
          updatedAt: new Date(),
          recordingCount: 0,
          totalDuration: 0,
        };

        const updatedFolders = [...folders, newFolder];
        setFolders(updatedFolders);
        await saveFolders(updatedFolders);

        logger.debug(`📋 Dossier dupliqué: ${folderId} → ${newFolder.id}`);
        return newFolder;
      } catch (error) {
        logger.error('❌ Erreur lors de la duplication:', error);
        throw error;
      }
    },
    [folders, saveFolders],
  );

  // Obtenir les statistiques d'un dossier
  const getFolderStats = useCallback(
    (folderId: string) => {
      const folder = folders.find(f => f.id === folderId);
      if (!folder) return null;

      const averageRecordingLength =
        folder.recordingCount > 0
          ? folder.totalDuration / folder.recordingCount
          : 0;

      return {
        ...folder,
        averageRecordingLength,
        totalSize: folder.recordingCount * 1024 * 1024, // Estimation 1MB par enregistrement
      };
    },
    [folders],
  );

  // Obtenir les statistiques globales
  const getGlobalStats = useCallback(() => {
    const totalFolders = folders.length;
    const totalRecordings = folders.reduce(
      (sum, folder) => sum + folder.recordingCount,
      0,
    );
    const totalDuration = folders.reduce(
      (sum, folder) => sum + folder.totalDuration,
      0,
    );
    const favoriteFolders = folders.filter(f => f.isFavorite).length;

    return {
      totalFolders,
      totalRecordings,
      totalDuration,
      favoriteFolders,
      averageRecordingsPerFolder:
        totalFolders > 0 ? totalRecordings / totalFolders : 0,
      averageDurationPerFolder:
        totalFolders > 0 ? totalDuration / totalFolders : 0,
    };
  }, [folders]);

  // Trier les dossiers
  const sortFolders = useCallback(
    (
      sortBy: 'name' | 'date' | 'count' | 'duration',
      order: 'asc' | 'desc' = 'asc',
    ) => {
      const sorted = [...folders].sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'date':
            aValue = a.updatedAt.getTime();
            bValue = b.updatedAt.getTime();
            break;
          case 'count':
            aValue = a.recordingCount;
            bValue = b.recordingCount;
            break;
          case 'duration':
            aValue = a.totalDuration;
            bValue = b.totalDuration;
            break;
          default:
            return 0;
        }

        if (order === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      });

      setFolders(sorted);
      logger.debug(`🔄 Dossiers triés: ${sortBy} - ${order}`);
    },
    [folders],
  );

  // Filtrer les dossiers
  const filterFolders = useCallback(
    (filter: 'all' | 'favorites' | 'recent' | 'empty') => {
      let filtered: AudioFolder[] = [];

      switch (filter) {
        case 'all':
          filtered = folders;
          break;
        case 'favorites':
          filtered = folders.filter(f => f.isFavorite);
          break;
        case 'recent':
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          filtered = folders.filter(f => f.updatedAt > oneWeekAgo);
          break;
        case 'empty':
          filtered = folders.filter(f => f.recordingCount === 0);
          break;
      }

      logger.debug(
        `🔍 Dossiers filtrés: ${filter} - ${filtered.length} résultats`,
      );
      return filtered;
    },
    [folders],
  );

  // Rechercher des dossiers
  const searchFolders = useCallback(
    (query: string) => {
      if (!query.trim()) return folders;

      const searchTerm = query.toLowerCase();
      const filtered = folders.filter(
        folder =>
          folder.name.toLowerCase().includes(searchTerm) ||
          folder.description?.toLowerCase().includes(searchTerm) ||
          folder.tags.some(tag => tag.toLowerCase().includes(searchTerm)),
      );

      logger.debug(
        `🔎 Recherche dossiers: "${query}" - ${filtered.length} résultats`,
      );
      return filtered;
    },
    [folders],
  );

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  return {
    folders,
    isLoading,
    // CRUD de base
    createFolder,
    deleteFolder,
    deleteSelectedFolders,
    updateFolder,
    toggleFavorite,
    // Fonctionnalités avancées
    editFolder,
    changeFolderColor,
    addFolderTag,
    removeFolderTag,
    duplicateFolder,
    // Statistiques
    getFolderStats,
    getGlobalStats,
    // Organisation
    sortFolders,
    filterFolders,
    searchFolders,
    // Utilitaires
    refreshFolders: loadFolders,
  };
}
