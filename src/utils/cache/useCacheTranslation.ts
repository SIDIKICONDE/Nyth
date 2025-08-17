import { useEffect } from "react";
import { TFunction } from "i18next";
import { useTranslation } from "../../hooks/useTranslation";
import {
  setCacheOperationsTranslation,
  setDirectoryManagerTranslation,
  setFormattersTranslation,
  setResetManagerTranslation,
} from "./index";

/**
 * Hook pour initialiser les traductions du cache manager
 * Doit être appelé dans un composant qui a accès au contexte de traduction
 */
export const useCacheTranslation = () => {
  const { t } = useTranslation();

  useEffect(() => {
    // Initialiser toutes les instances de traduction
    setCacheOperationsTranslation(t as TFunction);
    setFormattersTranslation(t as TFunction);
    setDirectoryManagerTranslation(t as TFunction);
    setResetManagerTranslation(t as TFunction);
  }, [t]);
};
