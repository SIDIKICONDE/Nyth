import { Message } from "../../../types/chat";

export interface ChatContainerProps {
  messages: any[];
  isTyping: boolean;
  isLoading: boolean;
  newMessageIds: Set<string>;
  hideHeader?: boolean;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: () => Promise<void>;
  setIsMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
  openFontSettings: () => void;
  saveMessageAsScript: (content: string) => Promise<void>;
  setMessages?: React.Dispatch<React.SetStateAction<any[]>>;
  interruptAIGeneration?: () => void;
}

export interface EditingState {
  editingMessageId: string | null;
  originalInputText: string;
}

export interface ScrollState {
  scrollPosition: number;
  contentHeight: number;
  containerHeight: number;
}

export interface KeyboardState {
  keyboardHeight: number;
  keyboardVisible: boolean;
}

export interface AnimationRefs {
  viewAdjustment: any;
  inputPosition: any;
  backgroundDimming: any;
}
