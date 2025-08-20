import { Message } from "../../../types/chat";

export interface ChatContainerProps {
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  sendMessage: (message: string) => Promise<void>;

  // Props utilisées dans ChatContainer
  isTyping: boolean;
  isLoading: boolean;
  showHuggingFaceButton: boolean;
  newMessageIds: Set<string>;
  hideHeader?: boolean;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: () => Promise<void>;
  activateHuggingFace: () => void;
  setIsMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
  openFontSettings: () => void;
  saveMessageAsScript: (content: string) => Promise<void>;
  interruptAIGeneration?: () => void;

  // AI Status related props
  aiStatus: "connected" | "disconnected" | "unknown";
  initialMessage: string;
}

export interface ChatContainerState {
  isLoading: boolean;
}

export interface EditMessageState {
  editingMessageId: string | null;
  originalInputText: string;
}

export interface KeyboardState {
  keyboardHeight: number;
  keyboardVisible: boolean;
}

export interface ScrollState {
  scrollPosition: number;
  contentHeight: number;
  containerHeight: number;
}
