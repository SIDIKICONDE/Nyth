import { useCallback } from "react";

/**
 * Hook pour gérer les actions de l'input (envoi, gestion de contenu, etc.)
 */
export const useInputHandlers = (
  inputText: string,
  isLoading: boolean,
  handleSendMessage: () => Promise<void>
) => {
  // Gestion de la hauteur dynamique
  const handleContentSizeChange = useCallback((event: any) => {
    const contentHeight = event.nativeEvent.contentSize.height;
  }, []);

  // Fonction d'envoi
  const handleSend = useCallback(async () => {
    if (inputText.trim() && !isLoading) {
      await handleSendMessage();
      // La hauteur se réinitialise automatiquement quand le texte est vidé
    }
  }, [inputText, isLoading, handleSendMessage]);

  // Vérifier si on peut envoyer
  const canSend = inputText.trim().length > 0;

  return {
    handleContentSizeChange,
    handleSend,
    canSend,
  };
};
