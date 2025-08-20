// Types pour les conversations et les messages
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

// Interface pour les conversations sauvegardées
export interface SavedConversation {
  id: string;
  messages: {
    id: string;
    content: string;
    isUser: boolean;
    timestamp: string; // On stocke sous forme de string lors de la sérialisation
  }[];
  lastUpdated: string;
  title: string;
}

// Statut de l'IA
export type AIStatus = "connected" | "unknown";
