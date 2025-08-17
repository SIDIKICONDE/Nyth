import { useTranslation as useI18nTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { languages } from "../locales/i18n";
import { isI18nReady, waitForI18n } from "../locales/i18n";

export const useTranslation = () => {
  const { t: originalT, i18n } = useI18nTranslation();
  const [isReady, setIsReady] = useState(isI18nReady());

  // Vérifier l'état d'initialisation
  useEffect(() => {
    if (!isReady) {
      waitForI18n()
        .then(() => {
          setIsReady(true);
        })
        .catch((error) => {
        // Même en cas d'erreur, on considère que c'est prêt pour éviter les blocages
        setIsReady(true);
      });
    }
  }, [isReady]);

  // Si i18n n'est pas prêt, on retourne une fonction t basique
  if (!isReady) {
    const fallbackT = (key: string, options?: any) => {
      return key;
    };

    return {
      t: fallbackT,
      i18n,
      isReady,
      currentLanguage: i18n.language || "en",
      changeLanguage: (language: string) => i18n.changeLanguage(language),
      languages,
    };
  }

  return {
    t: originalT,
    i18n,
    isReady,
    currentLanguage: i18n.language,
    changeLanguage: (language: string) => i18n.changeLanguage(language),
    languages,
  };
};
