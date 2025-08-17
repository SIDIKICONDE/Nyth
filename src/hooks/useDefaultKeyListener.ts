import { useEffect } from "react";
import { DefaultApiKeyService } from "../services/defaultApiKey";

/**
 * Hook pour écouter quand la clé OpenAI par défaut est configurée
 * et exécuter une action (comme recharger les paramètres)
 */
export const useDefaultKeyListener = (onKeyConfigured: () => void) => {
  useEffect(() => {
    const unsubscribe = DefaultApiKeyService.events.addListener(() => {
      onKeyConfigured();
    });

    return () => {
      unsubscribe();
    };
  }, [onKeyConfigured]);
};
