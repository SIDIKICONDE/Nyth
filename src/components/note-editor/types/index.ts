// Types pour l'éditeur de notes avancé

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isArchived: boolean;
  folderId?: string;
  attachments?: NoteAttachment[];
  metadata?: NoteMetadata;
}

export interface NoteAttachment {
  id: string;
  type: 'image' | 'audio' | 'video' | 'file';
  uri: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface NoteMetadata {
  wordCount: number;
  characterCount: number;
  readingTime: number; // en minutes
  lastEditedBy?: string;
  version: number;
  isEncrypted: boolean;
  isShared: boolean;
  collaborators?: string[];
}

export interface NoteFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  content: string;
  tags: string[];
  category: string;
  isDefault: boolean;
}

export interface NoteEditorState {
  currentNote: Note | null;
  isEditing: boolean;
  selection: {
    start: number;
    end: number;
  };
  undoStack: string[];
  redoStack: string[];
  isFullscreen: boolean;
  wordWrap: boolean;
  showToolbar: boolean;
  zoom: number;
}

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  theme: 'light' | 'dark' | 'auto';
  spellCheck: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // en ms
  showLineNumbers: boolean;
  highlightCurrentLine: boolean;
  tabSize: number;
  insertSpaces: boolean;
}

export interface SearchResult {
  noteId: string;
  title: string;
  preview: string;
  score: number;
  matches: {
    field: 'title' | 'content' | 'tags';
    text: string;
    start: number;
    end: number;
  }[];
}

export interface NoteExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
}

export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  suggestedTags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  complexity: 'simple' | 'moderate' | 'complex';
  topics: string[];
  actionItems: string[];
}
