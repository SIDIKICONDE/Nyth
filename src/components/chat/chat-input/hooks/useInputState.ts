import { useEffect, useState } from "react";

/**
 * Hook pour gérer l'état du focus et des interruptions
 */
export const useInputState = (isLoading: boolean) => {
  const [isFocused, setIsFocused] = useState(false);
  const [wasInterrupted, setWasInterrupted] = useState(false);

  // Gestion du focus
  const handleInputFocus = () => {
    setIsFocused(true);
    setWasInterrupted(false);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
  };

  // Détecter l'interruption de l'AI
  useEffect(() => {
    if (!isLoading && wasInterrupted) {
      // Réinitialiser après 3 secondes
      const timer = setTimeout(() => {
        setWasInterrupted(false);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Retourner une fonction de nettoyage vide si les conditions ne sont pas remplies
    return () => {};
  }, [isLoading, wasInterrupted]);

  return {
    isFocused,
    wasInterrupted,
    handleInputFocus,
    handleInputBlur,
    setWasInterrupted,
  };
};
