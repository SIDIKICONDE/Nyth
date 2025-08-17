export interface PlanningAIAssistantProps {
  isExpanded?: boolean;
  onToggle?: () => void;
}

export interface AIHeaderProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export interface SuggestionsProps {
  suggestions: string[];
  onSuggestionPress: (suggestion: string) => void;
}

export interface MetricsOverviewProps {
  eventMetrics: {
    total: number;
    completed: number;
  };
  completionRate: number;
  hasOverdueEvents: boolean;
}

export interface QuickActionsProps {
  actions: string[];
  onActionPress: (action: string) => void;
}

export interface ChatButtonProps {
  onPress: () => void;
}

export interface InsightCardProps {
  text: string;
}
