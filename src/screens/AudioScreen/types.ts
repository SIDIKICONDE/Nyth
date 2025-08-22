export interface AudioFolder {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  recordingCount: number;
  totalDuration: number; // en secondes
  isFavorite: boolean;
  color?: string; // couleur personnalisée pour le dossier
  icon?: string; // icône personnalisée
  tags: string[];
  lastRecordingDate?: Date;
}

export interface AudioRecording {
  id: string;
  folderId: string;
  title: string;
  duration: number; // en secondes
  fileSize: number; // en bytes
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  tags: string[];
  transcription?: string;
  waveform?: number[]; // données de la forme d'onde
}

export interface AudioScreenState {
  isSelectionMode: boolean;
  selectedFolders: string[];
  selectedRecordings: string[];
  searchQuery: string;
  sortBy: 'name' | 'date' | 'count' | 'duration';
  sortOrder: 'asc' | 'desc';
  filterBy: 'all' | 'favorites' | 'recent' | 'custom';
}

export interface AudioFolderStats {
  totalRecordings: number;
  totalDuration: number;
  totalSize: number;
  averageRecordingLength: number;
  mostRecentRecording?: Date;
  oldestRecording?: Date;
}
