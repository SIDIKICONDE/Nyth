export interface AIAction {
  id: string;
  label: string;
  icon?: string;
  iconComponent?: React.ReactNode;
  color: string;
  showLabel?: boolean;
  action: () => Promise<void>;
}

export interface AIActionsBarProps {
  content: string;
  onContentUpdate: (newContent: string) => void;
  cursorPosition?: number;
  onOpenAIAssistant?: () => void;
}

export interface ActionButtonProps {
  action: AIAction;
  isProcessing: boolean;
  isActive: boolean;
  onPress: () => void;
}
