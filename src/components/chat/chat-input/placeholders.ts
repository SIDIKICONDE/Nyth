import { PlaceholderOptions } from "./types";

/**
 * Génère le texte du placeholder selon le contexte et le style
 */
export const getPlaceholderText = (options: PlaceholderOptions): string => {
  const { isEditing, wasInterrupted, selectedInputStyle, userName, t } =
    options;

  if (isEditing) {
    return t("chat.input.editPlaceholder", "✏️ Modifiez votre message...");
  }

  if (wasInterrupted) {
    return t(
      "chat.input.interruptedPlaceholder",
      "Génération interrompue - Tapez votre nouveau message..."
    );
  }

  if (selectedInputStyle === "neon") {
    return t(
      "chat.input.neonPlaceholder",
      "⚡ {{name}}, tapez dans le futur...",
      { name: userName }
    );
  }

  return t("chat.input.placeholderNamed", "✨ {{name}}, discute librement...", {
    name: userName,
  });
};

/**
 * Obtient le nom d'utilisateur formaté pour les placeholders
 */
export const formatUserNameForPlaceholder = (
  displayName?: string | null,
  fallback: string = "Vous"
): string => {
  return displayName || fallback;
};
