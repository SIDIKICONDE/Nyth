// Types pour le système de connexions entre blocs

export interface BlockConnection {
  id: string;
  sourceBlockId: string;
  targetBlockId: string;
  sourcePort: string;
  targetPort: string;
  type: ConnectionType;
  style?: ConnectionStyle;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

export type ConnectionType =
  | "data" // Transfert de données
  | "control" // Flux de contrôle
  | "condition" // Connexion conditionnelle
  | "trigger" // Déclenchement d'action
  | "reference" // Référence/lien
  | "workflow"; // Flux de travail séquentiel

export interface ConnectionStyle {
  color?: string;
  width?: number;
  dashArray?: string;
  animated?: boolean;
  opacity?: number;
}

export interface ConnectionPort {
  id: string;
  type: "input" | "output";
  dataType: PortDataType;
  label: string;
  position: PortPosition;
  required?: boolean;
  multiple?: boolean; // Permet plusieurs connexions
  defaultValue?: any;
  description?: string;
}

export type PortDataType =
  | "text"
  | "number"
  | "boolean"
  | "object"
  | "array"
  | "file"
  | "image"
  | "video"
  | "audio"
  | "trigger"
  | "workflow"
  | "any";

export type PortPosition = "top" | "bottom" | "left" | "right";

// Configuration des ports pour chaque type de bloc
export interface BlockPortConfig {
  inputs: ConnectionPort[];
  outputs: ConnectionPort[];
}

// État d'une connexion en cours de création
export interface ConnectionDraft {
  sourceBlockId: string;
  sourcePort: string;
  currentPosition: { x: number; y: number };
  isValid: boolean;
  potentialTargets: string[];
}

// Événements de connexion
export interface ConnectionEvent {
  type: "connection_created" | "connection_updated" | "connection_deleted";
  connectionId: string;
  timestamp: Date;
  data?: any;
}

// Validation des connexions
export interface ConnectionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Résultat d'exécution d'un workflow
export interface WorkflowExecutionResult {
  success: boolean;
  executedBlocks: string[];
  errors: Array<{ blockId: string; error: string }>;
  duration: number;
  timestamp: Date;
}
