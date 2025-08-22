import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioFolders } from '@/screens/AudioScreen/hooks/useAudioFolders';
import { AudioFolder } from '@/screens/AudioScreen/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock du logger
jest.mock('@/utils/optimizedLogger', () => ({
  createOptimizedLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

describe('useAudioFolders', () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialisation', () => {
    test('should initialize with default folders when no stored data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.folders).toHaveLength(3);
      expect(result.current.folders[0].name).toBe('Enregistrements personnels');
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    test('should load stored folders from AsyncStorage', async () => {
      const storedFolders = [
        {
          id: 'test-1',
          name: 'Test Folder',
          description: 'Test Description',
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-20T00:00:00.000Z',
          recordingCount: 5,
          totalDuration: 1800,
          isFavorite: true,
          color: '#FF0000',
          icon: 'test',
          tags: ['test'],
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedFolders));

      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.folders).toHaveLength(1);
      expect(result.current.folders[0].name).toBe('Test Folder');
      expect(result.current.folders[0].createdAt).toBeInstanceOf(Date);
    });

    test('should handle AsyncStorage error gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.folders).toHaveLength(3); // Fallback to defaults
    });
  });

  describe('CRUD Operations', () => {
    test('should create a new folder successfully', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        const newFolder = await result.current.createFolder(
          'New Test Folder',
          'Test Description',
        );
        expect(newFolder.name).toBe('New Test Folder');
        expect(newFolder.description).toBe('Test Description');
      });

      expect(result.current.folders).toHaveLength(4);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    test('should delete a folder successfully', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.folders.length;
      const folderToDelete = result.current.folders[0].id;

      await act(async () => {
        await result.current.deleteFolder(folderToDelete);
      });

      expect(result.current.folders).toHaveLength(initialCount - 1);
      expect(
        result.current.folders.find(f => f.id === folderToDelete),
      ).toBeUndefined();
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    test('should delete multiple folders successfully', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.folders.length;
      const foldersToDelete = result.current.folders.slice(0, 2).map(f => f.id);

      await act(async () => {
        await result.current.deleteSelectedFolders(foldersToDelete);
      });

      expect(result.current.folders).toHaveLength(initialCount - 2);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    test('should update a folder successfully', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const folderToUpdate = result.current.folders[0].id;
      const updates = {
        name: 'Updated Name',
        description: 'Updated Description',
      };

      await act(async () => {
        await result.current.updateFolder(folderToUpdate, updates);
      });

      const updatedFolder = result.current.folders.find(
        f => f.id === folderToUpdate,
      );
      expect(updatedFolder?.name).toBe('Updated Name');
      expect(updatedFolder?.description).toBe('Updated Description');
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    test('should toggle favorite status', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const folderToToggle = result.current.folders[0].id;
      const initialFavoriteStatus = result.current.folders[0].isFavorite;

      await act(async () => {
        await result.current.toggleFavorite(folderToToggle);
      });

      const updatedFolder = result.current.folders.find(
        f => f.id === folderToToggle,
      );
      expect(updatedFolder?.isFavorite).toBe(!initialFavoriteStatus);
    });
  });

  describe('Advanced Operations', () => {
    test('should edit folder name and description', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const folderToEdit = result.current.folders[0].id;

      await act(async () => {
        await result.current.editFolder(
          folderToEdit,
          'Edited Name',
          'Edited Description',
        );
      });

      const editedFolder = result.current.folders.find(
        f => f.id === folderToEdit,
      );
      expect(editedFolder?.name).toBe('Edited Name');
      expect(editedFolder?.description).toBe('Edited Description');
    });

    test('should change folder color', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const folderToUpdate = result.current.folders[0].id;
      const newColor = '#00FF00';

      await act(async () => {
        await result.current.changeFolderColor(folderToUpdate, newColor);
      });

      const updatedFolder = result.current.folders.find(
        f => f.id === folderToUpdate,
      );
      expect(updatedFolder?.color).toBe(newColor);
    });

    test('should add tag to folder', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const folderToUpdate = result.current.folders[0].id;
      const newTag = 'new-tag';

      await act(async () => {
        await result.current.addFolderTag(folderToUpdate, newTag);
      });

      const updatedFolder = result.current.folders.find(
        f => f.id === folderToUpdate,
      );
      expect(updatedFolder?.tags).toContain(newTag);
    });

    test('should remove tag from folder', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const folderToUpdate = result.current.folders[0].id;
      const tagToRemove = result.current.folders[0].tags[0];

      await act(async () => {
        await result.current.removeFolderTag(folderToUpdate, tagToRemove);
      });

      const updatedFolder = result.current.folders.find(
        f => f.id === folderToUpdate,
      );
      expect(updatedFolder?.tags).not.toContain(tagToRemove);
    });

    test('should duplicate folder', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCount = result.current.folders.length;
      const folderToDuplicate = result.current.folders[0].id;

      await act(async () => {
        const duplicatedFolder = await result.current.duplicateFolder(
          folderToDuplicate,
          'Duplicated Folder',
        );
        expect(duplicatedFolder.name).toBe('Duplicated Folder');
        expect(duplicatedFolder.recordingCount).toBe(0);
        expect(duplicatedFolder.totalDuration).toBe(0);
      });

      expect(result.current.folders).toHaveLength(initialCount + 1);
    });

    test('should handle duplicate folder with default name', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const folderToDuplicate = result.current.folders[0].id;
      const originalName = result.current.folders[0].name;

      await act(async () => {
        const duplicatedFolder = await result.current.duplicateFolder(
          folderToDuplicate,
        );
        expect(duplicatedFolder.name).toBe(`${originalName} (Copie)`);
      });
    });
  });

  describe('Statistics', () => {
    test('should get folder statistics', () => {
      const { result } = renderHook(() => useAudioFolders());

      const folderId = result.current.folders[0]?.id;
      if (!folderId) return;

      const stats = result.current.getFolderStats(folderId);
      expect(stats).toBeDefined();
      expect(stats?.totalRecordings).toBeGreaterThanOrEqual(0);
      expect(stats?.totalDuration).toBeGreaterThanOrEqual(0);
    });

    test('should return null for non-existent folder stats', () => {
      const { result } = renderHook(() => useAudioFolders());

      const stats = result.current.getFolderStats('non-existent-id');
      expect(stats).toBeNull();
    });

    test('should get global statistics', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const globalStats = result.current.getGlobalStats();
      expect(globalStats.totalFolders).toBeGreaterThan(0);
      expect(globalStats.totalRecordings).toBeGreaterThanOrEqual(0);
      expect(globalStats.totalDuration).toBeGreaterThanOrEqual(0);
      expect(globalStats.favoriteFolders).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Organization', () => {
    test('should sort folders by name', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.sortFolders('name', 'asc');
      });

      const folders = result.current.folders;
      for (let i = 1; i < folders.length; i++) {
        expect(
          folders[i - 1].name.localeCompare(folders[i].name),
        ).toBeLessThanOrEqual(0);
      }
    });

    test('should sort folders by date', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.sortFolders('date', 'desc');
      });

      const folders = result.current.folders;
      for (let i = 1; i < folders.length; i++) {
        expect(folders[i - 1].updatedAt.getTime()).toBeGreaterThanOrEqual(
          folders[i].updatedAt.getTime(),
        );
      }
    });

    test('should sort folders by count', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.sortFolders('count', 'desc');
      });

      const folders = result.current.folders;
      for (let i = 1; i < folders.length; i++) {
        expect(folders[i - 1].recordingCount).toBeGreaterThanOrEqual(
          folders[i].recordingCount,
        );
      }
    });

    test('should sort folders by duration', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.sortFolders('duration', 'asc');
      });

      const folders = result.current.folders;
      for (let i = 1; i < folders.length; i++) {
        expect(folders[i - 1].totalDuration).toBeLessThanOrEqual(
          folders[i].totalDuration,
        );
      }
    });

    test('should filter folders by favorites', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const favoriteFolders = result.current.filterFolders('favorites');
      expect(favoriteFolders.every(folder => folder.isFavorite)).toBe(true);
    });

    test('should filter folders by recent', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const recentFolders = result.current.filterFolders('recent');
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      expect(recentFolders.every(folder => folder.updatedAt > oneWeekAgo)).toBe(
        true,
      );
    });

    test('should filter empty folders', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const emptyFolders = result.current.filterFolders('empty');
      expect(emptyFolders.every(folder => folder.recordingCount === 0)).toBe(
        true,
      );
    });

    test('should search folders by name', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const searchResults = result.current.searchFolders('personnel');
      expect(searchResults.length).toBeGreaterThan(0);
      expect(
        searchResults.every(
          folder =>
            folder.name.toLowerCase().includes('personnel') ||
            folder.description?.toLowerCase().includes('personnel') ||
            folder.tags.some(tag => tag.toLowerCase().includes('personnel')),
        ),
      ).toBe(true);
    });

    test('should search folders by description', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const searchResults = result.current.searchFolders('notes');
      expect(searchResults.length).toBeGreaterThan(0);
    });

    test('should search folders by tags', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const searchResults = result.current.searchFolders('travail');
      expect(searchResults.length).toBeGreaterThan(0);
    });

    test('should return all folders for empty search query', () => {
      const { result } = renderHook(() => useAudioFolders());

      const searchResults = result.current.searchFolders('');
      expect(searchResults).toEqual(result.current.folders);
    });
  });

  describe('Error Handling', () => {
    test('should handle AsyncStorage setItem error', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(
        new Error('Storage write error'),
      );

      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.createFolder('Test Folder')).rejects.toThrow(
        'Storage write error',
      );
    });

    test('should handle folder not found in toggleFavorite', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleFavorite('non-existent-id');
      });

      // Should not throw error, just do nothing
      expect(result.current.folders).toHaveLength(3);
    });

    test('should handle folder not found in duplicateFolder', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        result.current.duplicateFolder('non-existent-id'),
      ).rejects.toThrow('Dossier non trouvé');
    });
  });

  describe('Refresh functionality', () => {
    test('should refresh folders from storage', async () => {
      const { result } = renderHook(() => useAudioFolders());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshFolders();
      });

      expect(mockAsyncStorage.getItem).toHaveBeenCalled();
    });
  });
});
