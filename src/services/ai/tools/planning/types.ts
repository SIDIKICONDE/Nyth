export interface CreateEventArgs {
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
  type?:
    | "script_creation"
    | "recording"
    | "editing"
    | "review"
    | "meeting"
    | "deadline";
  priority?: "low" | "medium" | "high" | "urgent";
  tags?: string[];
}

export interface UpdateEventArgs {
  searchCriteria: string;
  updates: {
    title?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    description?: string;
  };
}

export interface DeleteEventArgs {
  searchCriteria: string;
}

export interface CreateGoalArgs {
  title: string;
  target: number;
  unit: string;
  endDate?: string;
}

export type Lang = "fr" | "en" | "es" | "de" | "it" | "pt";
