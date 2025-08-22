import { renderHook, act } from '@testing-library/react-native';
import { useAudioScreenState } from '@/screens/AudioScreen/hooks/useAudioScreenState';

describe('useAudioScreenState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('should initialize with correct default values', () => {
      const { result } = renderHook(() => useAudioScreenState());

      expect(result.current.isSelectionMode).toBe(false);
      expect(result.current.selectedFolders).toEqual([]);
      expect(result.current.selectedRecordings).toEqual([]);
      expect(result.current.searchQuery).toBe('');
      expect(result.current.sortBy).toBe('date');
      expect(result.current.sortOrder).toBe('desc');
      expect(result.current.filterBy).toBe('all');
    });
  });

  describe('Selection Mode', () => {
    test('should toggle selection mode', () => {
      const { result } = renderHook(() => useAudioScreenState());

      expect(result.current.isSelectionMode).toBe(false);

      act(() => {
        result.current.toggleSelectionMode();
      });

      expect(result.current.isSelectionMode).toBe(true);
      expect(result.current.selectedFolders).toEqual([]);
      expect(result.current.selectedRecordings).toEqual([]);

      act(() => {
        result.current.toggleSelectionMode();
      });

      expect(result.current.isSelectionMode).toBe(false);
    });
  });

  describe('Folder Selection', () => {
    test('should toggle folder selection', () => {
      const { result } = renderHook(() => useAudioScreenState());

      const folderId = 'test-folder-1';

      act(() => {
        result.current.toggleFolderSelection(folderId);
      });

      expect(result.current.selectedFolders).toContain(folderId);

      act(() => {
        result.current.toggleFolderSelection(folderId);
      });

      expect(result.current.selectedFolders).not.toContain(folderId);
    });

    test('should handle multiple folder selections', () => {
      const { result } = renderHook(() => useAudioScreenState());

      const folderIds = ['folder-1', 'folder-2', 'folder-3'];

      act(() => {
        folderIds.forEach(id => {
          result.current.toggleFolderSelection(id);
        });
      });

      expect(result.current.selectedFolders).toEqual(folderIds);

      act(() => {
        result.current.toggleFolderSelection('folder-2');
      });

      expect(result.current.selectedFolders).toEqual(['folder-1', 'folder-3']);
    });

    test('should clear folder selection', () => {
      const { result } = renderHook(() => useAudioScreenState());

      const folderIds = ['folder-1', 'folder-2'];

      act(() => {
        folderIds.forEach(id => {
          result.current.toggleFolderSelection(id);
        });
      });

      expect(result.current.selectedFolders).toEqual(folderIds);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedFolders).toEqual([]);
      expect(result.current.selectedRecordings).toEqual([]);
      expect(result.current.isSelectionMode).toBe(false);
    });
  });

  describe('Recording Selection', () => {
    test('should toggle recording selection', () => {
      const { result } = renderHook(() => useAudioScreenState());

      const recordingId = 'test-recording-1';

      act(() => {
        result.current.toggleRecordingSelection(recordingId);
      });

      expect(result.current.selectedRecordings).toContain(recordingId);

      act(() => {
        result.current.toggleRecordingSelection(recordingId);
      });

      expect(result.current.selectedRecordings).not.toContain(recordingId);
    });

    test('should handle multiple recording selections', () => {
      const { result } = renderHook(() => useAudioScreenState());

      const recordingIds = ['recording-1', 'recording-2', 'recording-3'];

      act(() => {
        recordingIds.forEach(id => {
          result.current.toggleRecordingSelection(id);
        });
      });

      expect(result.current.selectedRecordings).toEqual(recordingIds);

      act(() => {
        result.current.toggleRecordingSelection('recording-2');
      });

      expect(result.current.selectedRecordings).toEqual([
        'recording-1',
        'recording-3',
      ]);
    });

    test('should clear recording selection', () => {
      const { result } = renderHook(() => useAudioScreenState());

      const recordingIds = ['recording-1', 'recording-2'];

      act(() => {
        recordingIds.forEach(id => {
          result.current.toggleRecordingSelection(id);
        });
      });

      expect(result.current.selectedRecordings).toEqual(recordingIds);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedRecordings).toEqual([]);
      expect(result.current.selectedFolders).toEqual([]);
      expect(result.current.isSelectionMode).toBe(false);
    });
  });

  describe('Search Query', () => {
    test('should set search query', () => {
      const { result } = renderHook(() => useAudioScreenState());

      const searchQuery = 'test search';

      act(() => {
        result.current.setSearchQuery(searchQuery);
      });

      expect(result.current.searchQuery).toBe(searchQuery);
    });

    test('should update search query', () => {
      const { result } = renderHook(() => useAudioScreenState());

      act(() => {
        result.current.setSearchQuery('initial query');
      });

      expect(result.current.searchQuery).toBe('initial query');

      act(() => {
        result.current.setSearchQuery('updated query');
      });

      expect(result.current.searchQuery).toBe('updated query');
    });

    test('should handle empty search query', () => {
      const { result } = renderHook(() => useAudioScreenState());

      act(() => {
        result.current.setSearchQuery('some query');
      });

      expect(result.current.searchQuery).toBe('some query');

      act(() => {
        result.current.setSearchQuery('');
      });

      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('Sort Configuration', () => {
    test('should set sort by field', () => {
      const { result } = renderHook(() => useAudioScreenState());

      act(() => {
        result.current.setSortBy('name');
      });

      expect(result.current.sortBy).toBe('name');

      act(() => {
        result.current.setSortBy('count');
      });

      expect(result.current.sortBy).toBe('count');
    });

    test('should set sort order', () => {
      const { result } = renderHook(() => useAudioScreenState());

      act(() => {
        result.current.setSortOrder('asc');
      });

      expect(result.current.sortOrder).toBe('asc');

      act(() => {
        result.current.setSortOrder('desc');
      });

      expect(result.current.sortOrder).toBe('desc');
    });

    test('should handle all sort by options', () => {
      const { result } = renderHook(() => useAudioScreenState());

      const sortOptions: Array<'name' | 'date' | 'count' | 'duration'> = [
        'name',
        'date',
        'count',
        'duration',
      ];

      sortOptions.forEach(sortBy => {
        act(() => {
          result.current.setSortBy(sortBy);
        });

        expect(result.current.sortBy).toBe(sortBy);
      });
    });

    test('should handle both sort orders', () => {
      const { result } = renderHook(() => useAudioScreenState());

      const sortOrders: Array<'asc' | 'desc'> = ['asc', 'desc'];

      sortOrders.forEach(sortOrder => {
        act(() => {
          result.current.setSortOrder(sortOrder);
        });

        expect(result.current.sortOrder).toBe(sortOrder);
      });
    });
  });

  describe('Filter Configuration', () => {
    test('should set filter by option', () => {
      const { result } = renderHook(() => useAudioScreenState());

      act(() => {
        result.current.setFilterBy('favorites');
      });

      expect(result.current.filterBy).toBe('favorites');

      act(() => {
        result.current.setFilterBy('recent');
      });

      expect(result.current.filterBy).toBe('recent');
    });

    test('should handle all filter options', () => {
      const { result } = renderHook(() => useAudioScreenState());

      const filterOptions: Array<'all' | 'favorites' | 'recent' | 'custom'> = [
        'all',
        'favorites',
        'recent',
        'custom',
      ];

      filterOptions.forEach(filterBy => {
        act(() => {
          result.current.setFilterBy(filterBy);
        });

        expect(result.current.filterBy).toBe(filterBy);
      });
    });
  });

  describe('State Persistence', () => {
    test('should maintain state across multiple operations', () => {
      const { result } = renderHook(() => useAudioScreenState());

      // Set up initial state
      act(() => {
        result.current.setSearchQuery('test query');
        result.current.setSortBy('name');
        result.current.setSortOrder('asc');
        result.current.setFilterBy('favorites');
        result.current.toggleFolderSelection('folder-1');
        result.current.toggleRecordingSelection('recording-1');
      });

      expect(result.current.searchQuery).toBe('test query');
      expect(result.current.sortBy).toBe('name');
      expect(result.current.sortOrder).toBe('asc');
      expect(result.current.filterBy).toBe('favorites');
      expect(result.current.selectedFolders).toContain('folder-1');
      expect(result.current.selectedRecordings).toContain('recording-1');

      // Perform additional operations
      act(() => {
        result.current.toggleFolderSelection('folder-2');
        result.current.setSearchQuery('updated query');
      });

      expect(result.current.selectedFolders).toContain('folder-1');
      expect(result.current.selectedFolders).toContain('folder-2');
      expect(result.current.searchQuery).toBe('updated query');
      expect(result.current.sortBy).toBe('name');
      expect(result.current.sortOrder).toBe('asc');
      expect(result.current.filterBy).toBe('favorites');
    });
  });

  describe('Clear Selection', () => {
    test('should clear all selections and reset selection mode', () => {
      const { result } = renderHook(() => useAudioScreenState());

      // Set up state with selections
      act(() => {
        result.current.toggleSelectionMode();
        result.current.toggleFolderSelection('folder-1');
        result.current.toggleFolderSelection('folder-2');
        result.current.toggleRecordingSelection('recording-1');
        result.current.toggleRecordingSelection('recording-2');
      });

      expect(result.current.isSelectionMode).toBe(true);
      expect(result.current.selectedFolders).toEqual(['folder-1', 'folder-2']);
      expect(result.current.selectedRecordings).toEqual([
        'recording-1',
        'recording-2',
      ]);

      // Clear selections
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.isSelectionMode).toBe(false);
      expect(result.current.selectedFolders).toEqual([]);
      expect(result.current.selectedRecordings).toEqual([]);
    });

    test('should not affect other state properties', () => {
      const { result } = renderHook(() => useAudioScreenState());

      // Set up state
      act(() => {
        result.current.setSearchQuery('test query');
        result.current.setSortBy('name');
        result.current.setSortOrder('asc');
        result.current.setFilterBy('favorites');
        result.current.toggleFolderSelection('folder-1');
      });

      // Clear selections
      act(() => {
        result.current.clearSelection();
      });

      // Other properties should remain unchanged
      expect(result.current.searchQuery).toBe('test query');
      expect(result.current.sortBy).toBe('name');
      expect(result.current.sortOrder).toBe('asc');
      expect(result.current.filterBy).toBe('favorites');

      // Only selections should be cleared
      expect(result.current.selectedFolders).toEqual([]);
      expect(result.current.selectedRecordings).toEqual([]);
      expect(result.current.isSelectionMode).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle toggling same folder multiple times', () => {
      const { result } = renderHook(() => useAudioScreenState());

      const folderId = 'test-folder';

      // Toggle multiple times
      act(() => {
        result.current.toggleFolderSelection(folderId);
        result.current.toggleFolderSelection(folderId);
        result.current.toggleFolderSelection(folderId);
      });

      expect(result.current.selectedFolders).toContain(folderId);

      act(() => {
        result.current.toggleFolderSelection(folderId);
      });

      expect(result.current.selectedFolders).not.toContain(folderId);
    });

    test('should handle toggling same recording multiple times', () => {
      const { result } = renderHook(() => useAudioScreenState());

      const recordingId = 'test-recording';

      // Toggle multiple times
      act(() => {
        result.current.toggleRecordingSelection(recordingId);
        result.current.toggleRecordingSelection(recordingId);
        result.current.toggleRecordingSelection(recordingId);
      });

      expect(result.current.selectedRecordings).toContain(recordingId);

      act(() => {
        result.current.toggleRecordingSelection(recordingId);
      });

      expect(result.current.selectedRecordings).not.toContain(recordingId);
    });

    test('should handle empty string search query', () => {
      const { result } = renderHook(() => useAudioScreenState());

      act(() => {
        result.current.setSearchQuery('');
      });

      expect(result.current.searchQuery).toBe('');
    });

    test('should handle special characters in search query', () => {
      const { result } = renderHook(() => useAudioScreenState());

      const specialQuery = 'test@#$%^&*()_+-=[]{}|;:,.<>?';

      act(() => {
        result.current.setSearchQuery(specialQuery);
      });

      expect(result.current.searchQuery).toBe(specialQuery);
    });
  });

  describe('State Isolation', () => {
    test('should maintain separate state for different instances', () => {
      const { result: result1 } = renderHook(() => useAudioScreenState());
      const { result: result2 } = renderHook(() => useAudioScreenState());

      // Modify first instance
      act(() => {
        result1.current.setSearchQuery('query 1');
        result1.current.toggleFolderSelection('folder-1');
      });

      // Modify second instance
      act(() => {
        result2.current.setSearchQuery('query 2');
        result2.current.toggleFolderSelection('folder-2');
      });

      // States should be independent
      expect(result1.current.searchQuery).toBe('query 1');
      expect(result1.current.selectedFolders).toEqual(['folder-1']);
      expect(result2.current.searchQuery).toBe('query 2');
      expect(result2.current.selectedFolders).toEqual(['folder-2']);
    });
  });
});
