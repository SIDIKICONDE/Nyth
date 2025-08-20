import { Message } from "../../../../types/chat";

/**
 * Types pour le gestionnaire de messages
 */

/**
 * Interface pour les options de traitement des messages (ancienne version)
 */
export interface ProcessMessageOptionsLegacy {
  user: any;
  scripts: any[];
  messages: Message[];
  inputText: string;
  abortController: AbortController;
  t: (key: string, options?: any) => string;
  navigateToAISettings: () => Promise<boolean>;
  onTypingStart: () => void;
  onTypingEnd: () => void;
  onSuccess: (response: string) => void;
  onError: (error: string) => void;
}

/**
 * Interface pour les options de traitement des messages (nouvelle version)
 */
export interface ProcessMessageOptions {
  message: string;
  userId: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  onProgress?: (chunk: string) => void;
  signal?: AbortSignal;
  userLanguage?: string;
  // Paramètres pour la mémoire IA et le contexte
  user?: any;
  scripts?: any[];
  invisibleContext?: string;
  isWelcomeMessage?: boolean;
}

/**
 * Résultat du traitement des commandes de planification
 */
export interface PlanningCommandResult {
  success: boolean;
  message: string;
  eventId?: string;
  goalId?: string;
}

/**
 * Props pour le composant MessageHandler
 */
export interface MessageHandlerProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setNewMessageIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  scrollToBottom: () => void;
  invisibleContext?: string;
  isWelcomeMessage?: boolean;
  children: (props: {
    inputText: string;
    setInputText: React.Dispatch<React.SetStateAction<string>>;
    isLoading: boolean;
    isTyping: boolean;
    handleSendMessage: () => Promise<void>;
    saveMessageAsScript: (content: string) => Promise<void>;
    interruptAIGeneration: () => void;
  }) => React.ReactNode;
}
