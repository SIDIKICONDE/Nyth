export const EVENT_TYPES = [
  {
    value: "script_creation",
    icon: "document-text",
    label: "planning.events.types.script_creation",
  },
  {
    value: "recording",
    icon: "videocam",
    label: "planning.events.types.recording",
  },
  { value: "editing", icon: "cut", label: "planning.events.types.editing" },
  { value: "review", icon: "eye", label: "planning.events.types.review" },
  { value: "meeting", icon: "people", label: "planning.events.types.meeting" },
  { value: "deadline", icon: "alarm", label: "planning.events.types.deadline" },
];

export const PRIORITIES = [
  { value: "low", color: "#10B981", label: "planning.events.priorities.low" },
  {
    value: "medium",
    color: "#F59E0B",
    label: "planning.events.priorities.medium",
  },
  { value: "high", color: "#EF4444", label: "planning.events.priorities.high" },
  {
    value: "urgent",
    color: "#DC2626",
    label: "planning.events.priorities.urgent",
  },
];

export const DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1h" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2h" },
  { value: 180, label: "3h" },
  { value: 240, label: "4h" },
];
