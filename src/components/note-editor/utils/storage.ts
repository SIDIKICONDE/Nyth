import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, NoteFolder } from '../types';

const NOTES_KEY = '@advanced_notes';
const FOLDERS_KEY = '@note_folders';
const SETTINGS_KEY = '@note_settings';

// Storage utilities for notes
export class NoteStorage {
  static async saveNotes(notes: Note[]): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    }
  }

  static async loadNotes(): Promise<Note[]> {
    try {
      const data = await AsyncStorage.getItem(NOTES_KEY);
      if (!data) return [];

      const notes = JSON.parse(data);
      return notes.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }));
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  }

  static async saveFolders(folders: NoteFolder[]): Promise<void> {
    try {
      await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    } catch (error) {
      console.error('Error saving folders:', error);
      throw error;
    }
  }

  static async loadFolders(): Promise<NoteFolder[]> {
    try {
      const data = await AsyncStorage.getItem(FOLDERS_KEY);
      if (!data) return [];

      const folders = JSON.parse(data);
      return folders.map((folder: any) => ({
        ...folder,
        createdAt: new Date(folder.createdAt),
        updatedAt: new Date(folder.updatedAt),
      }));
    } catch (error) {
      console.error('Error loading folders:', error);
      return [];
    }
  }

  static async clearAll(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(NOTES_KEY),
        AsyncStorage.removeItem(FOLDERS_KEY),
        AsyncStorage.removeItem(SETTINGS_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  static async exportNotes(): Promise<string> {
    try {
      const notes = await this.loadNotes();
      const folders = await this.loadFolders();

      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        notes,
        folders,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting notes:', error);
      throw error;
    }
  }

  static async importNotes(jsonData: string): Promise<void> {
    try {
      const importData = JSON.parse(jsonData);

      if (importData.notes) {
        await this.saveNotes(importData.notes);
      }

      if (importData.folders) {
        await this.saveFolders(importData.folders);
      }
    } catch (error) {
      console.error('Error importing notes:', error);
      throw error;
    }
  }
}

// Search utilities
export class NoteSearch {
  static search(notes: Note[], query: string): Note[] {
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
  }

  static filterByTags(notes: Note[], tags: string[]): Note[] {
    if (tags.length === 0) return notes;

    return notes.filter(note =>
      tags.some(tag => note.tags.includes(tag))
    );
  }

  static filterByCategory(notes: Note[], category: string): Note[] {
    if (!category) return notes;

    return notes.filter(note => note.category === category);
  }

  static getStats(notes: Note[]) {
    const totalNotes = notes.length;
    const totalWords = notes.reduce((sum, note) => sum + (note.metadata?.wordCount || 0), 0);
    const totalCharacters = notes.reduce((sum, note) => sum + (note.metadata?.characterCount || 0), 0);
    const pinnedNotes = notes.filter(note => note.isPinned).length;
    const archivedNotes = notes.filter(note => note.isArchived).length;

    // Get all unique tags
    const allTags = notes.flatMap(note => note.tags);
    const uniqueTags = [...new Set(allTags)];

    // Get category distribution
    const categoryStats = notes.reduce((acc, note) => {
      acc[note.category] = (acc[note.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalNotes,
      totalWords,
      totalCharacters,
      pinnedNotes,
      archivedNotes,
      uniqueTags: uniqueTags.length,
      categoryStats,
    };
  }
}
