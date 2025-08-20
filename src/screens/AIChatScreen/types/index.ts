export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  prompt: (content: string) => string;
}

export interface AIChatScreenParams {
  initialContext?: string;
  invisibleContext?: string;
  returnScreen?: string;
  isWelcomeMessage?: boolean;
}
