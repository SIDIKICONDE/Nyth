import { useState, useCallback } from 'react';
import { AudioScreenState } from '../types';

const initialState: AudioScreenState = {
  isSelectionMode: false,
  selectedFolders: [],
  selectedRecordings: [],
  searchQuery: '',
  sortBy: 'date',
  sortOrder: 'desc',
  filterBy: 'all',
};

export function useAudioScreenState() {
  const [state, setState] = useState<AudioScreenState>(initialState);

  const toggleSelectionMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSelectionMode: !prev.isSelectionMode,
      selectedFolders: [],
      selectedRecordings: [],
    }));
  }, []);

  const toggleFolderSelection = useCallback((folderId: string) => {
    setState(prev => ({
      ...prev,
      selectedFolders: prev.selectedFolders.includes(folderId)
        ? prev.selectedFolders.filter(id => id !== folderId)
        : [...prev.selectedFolders, folderId],
    }));
  }, []);

  const toggleRecordingSelection = useCallback((recordingId: string) => {
    setState(prev => ({
      ...prev,
      selectedRecordings: prev.selectedRecordings.includes(recordingId)
        ? prev.selectedRecordings.filter(id => id !== recordingId)
        : [...prev.selectedRecordings, recordingId],
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedFolders: [],
      selectedRecordings: [],
      isSelectionMode: false,
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setSortBy = useCallback((sortBy: AudioScreenState['sortBy']) => {
    setState(prev => ({ ...prev, sortBy }));
  }, []);

  const setSortOrder = useCallback(
    (sortOrder: AudioScreenState['sortOrder']) => {
      setState(prev => ({ ...prev, sortOrder }));
    },
    [],
  );

  const setFilterBy = useCallback((filterBy: AudioScreenState['filterBy']) => {
    setState(prev => ({ ...prev, filterBy }));
  }, []);

  return {
    ...state,
    toggleSelectionMode,
    toggleFolderSelection,
    toggleRecordingSelection,
    clearSelection,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    setFilterBy,
  };
}
