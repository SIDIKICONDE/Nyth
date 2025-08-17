import { Provider } from "./types";

export const PROVIDER_ICONS: Record<string, string> = {
  openai: "robot",
  gemini: "google",
  mistral: "weather-windy",
  cohere: "lightning-bolt",

  default: "key",
};

export const PROVIDER_COLORS: Record<string, string> = {
  openai: "#f59e0b",
  gemini: "#3b82f6",
  mistral: "#ef4444",
  cohere: "#10b981",
};

export const PROVIDER_GRADIENTS: Record<string, [string, string]> = {
  openai: ["#f59e0b", "#dc2626"],
  gemini: ["#3b82f6", "#1d4ed8"],
  mistral: ["#ef4444", "#b91c1c"],
  cohere: ["#10b981", "#059669"],
};

export const EXPIRY_THRESHOLDS = {
  URGENT: 7,
  WARNING: 30,
} as const;

export const EXPIRY_STATUSES = {
  URGENT: { color: "#ef4444", icon: "alert-circle", text: "Urgent" },
  WARNING: { color: "#f59e0b", icon: "alert", text: "Attention" },
  SECURE: { color: "#10b981", icon: "check-circle", text: "Sécurisé" },
} as const;
