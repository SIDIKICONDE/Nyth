import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, NoteFolder, NoteTemplate } from '../types';

const NOTES_STORAGE_KEY = '@notes';
const FOLDERS_STORAGE_KEY = '@note_folders';
const TEMPLATES_STORAGE_KEY = '@note_templates';

export function useNoteEditor() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load data from storage
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [notesData, foldersData, templatesData] = await Promise.all([
        AsyncStorage.getItem(NOTES_STORAGE_KEY),
        AsyncStorage.getItem(FOLDERS_STORAGE_KEY),
        AsyncStorage.getItem(TEMPLATES_STORAGE_KEY),
      ]);

      if (notesData) {
        const parsedNotes = JSON.parse(notesData).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));
        setNotes(parsedNotes);
      }

      if (foldersData) {
        const parsedFolders = JSON.parse(foldersData).map((folder: any) => ({
          ...folder,
          createdAt: new Date(folder.createdAt),
          updatedAt: new Date(folder.updatedAt),
        }));
        setFolders(parsedFolders);
      }

      if (templatesData) {
        setTemplates(JSON.parse(templatesData));
      } else {
        // Initialize with default templates
        const defaultTemplates: NoteTemplate[] = [
          {
            id: 'meeting',
            name: 'Réunion',
            description: 'Template pour les notes de réunion',
            icon: 'groups',
            content: '# Réunion\n\n## Participants\n- \n\n## Ordre du jour\n- \n\n## Points discutés\n- \n\n## Décisions prises\n- \n\n## Actions à suivre\n- [ ] ',
            tags: ['réunion', 'travail'],
            category: 'business',
            isDefault: true,
          },
          {
            id: 'todo',
            name: 'Liste de tâches',
            description: 'Template pour les tâches et todo lists',
            icon: 'checklist',
            content: '# Liste de tâches\n\n## À faire\n- [ ] \n- [ ] \n\n## En cours\n- [ ] \n\n## Terminé\n- [ ] ',
            tags: ['tâches', 'organisation'],
            category: 'personal',
            isDefault: true,
          },
          {
            id: 'brainstorming',
            name: 'Brainstorming',
            description: 'Template pour les sessions de brainstorming',
            icon: 'lightbulb',
            content: '# Brainstorming\n\n## Sujet\n\n## Idées\n- \n- \n- \n\n## Points forts\n- \n\n## Points à améliorer\n- \n\n## Prochaines étapes\n- ',
            tags: ['créatif', 'planning'],
            category: 'creative',
            isDefault: true,
          },
        ];
        setTemplates(defaultTemplates);
        await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(defaultTemplates));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save data to storage
  const saveData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes)),
        AsyncStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders)),
        AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates)),
      ]);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [notes, folders, templates]);

  // Auto-save when data changes
  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [notes, folders, templates, isLoading, saveData]);

  // Create new note
  const createNote = useCallback((template?: NoteTemplate) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Nouvelle note',
      content: template?.content || '',
      tags: template?.tags || [],
      category: template?.category || 'general',
      color: '#3B82F6',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false,
      isArchived: false,
      metadata: {
        wordCount: 0,
        characterCount: 0,
        readingTime: 0,
        version: 1,
        isEncrypted: false,
        isShared: false,
      },
    };

    setNotes(prev => [newNote, ...prev]);
    setCurrentNote(newNote);
    return newNote;
  }, []);

  // Update note
  const updateNote = useCallback((updatedNote: Note) => {
    setNotes(prev => prev.map(note =>
      note.id === updatedNote.id ? updatedNote : note
    ));

    if (currentNote?.id === updatedNote.id) {
      setCurrentNote(updatedNote);
    }
  }, [currentNote]);

  // Delete note
  const deleteNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));

    if (currentNote?.id === noteId) {
      setCurrentNote(null);
    }
  }, [currentNote]);

  // Pin/unpin note
  const togglePinNote = useCallback((noteId: string) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
    ));
  }, []);

  // Archive/unarchive note
  const toggleArchiveNote = useCallback((noteId: string) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId ? { ...note, isArchived: !note.isArchived } : note
    ));
  }, []);

  // Create folder
  const createFolder = useCallback((name: string, color: string = '#3B82F6') => {
    const newFolder: NoteFolder = {
      id: Date.now().toString(),
      name,
      color,
      icon: 'folder',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setFolders(prev => [...prev, newFolder]);
    return newFolder;
  }, []);

  // Search notes
  const searchNotes = useCallback((query: string) => {
    if (!query.trim()) return notes;

    const lowercaseQuery = query.toLowerCase();

    return notes.filter(note =>
      note.title.toLowerCase().includes(lowercaseQuery) ||
      note.content.toLowerCase().includes(lowercaseQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    ).sort((a, b) => {
      // Prioritize title matches
      const aTitle = a.title.toLowerCase().includes(lowercaseQuery);
      const bTitle = b.title.toLowerCase().includes(lowercaseQuery);

      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;

      // Then sort by date
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }, [notes]);

  // Get filtered notes
  const getFilteredNotes = useCallback(() => {
    let filtered = notes;

    if (searchQuery) {
      filtered = searchNotes(searchQuery);
    }

    return filtered.sort((a, b) => {
      // Pinned notes first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then sort by date
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }, [notes, searchQuery, searchNotes]);

  return {
    // State
    notes,
    folders,
    templates,
    isLoading,
    currentNote,
    searchQuery,
    filteredNotes: getFilteredNotes(),

    // Actions
    setCurrentNote,
    setSearchQuery,
    createNote,
    updateNote,
    deleteNote,
    togglePinNote,
    toggleArchiveNote,
    createFolder,
    searchNotes,
  };
}
