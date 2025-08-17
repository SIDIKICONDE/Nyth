import { useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FABDesignType } from "../types";

// Stockage en mémoire pour la session
let currentFABDesign: FABDesignType | null = null; // null = pas encore initialisé
let fabDesignListeners: ((design: FABDesignType) => void)[] = [];

// Clé AsyncStorage pour la persistance
const FAB_DESIGN_STORAGE_KEY = "@fab_design_style";

// Système de notification globale pur
const notifyFABDesignUpdate = (newDesign: FABDesignType) => {
  fabDesignListeners.forEach((listener) => listener(newDesign));
};

const addFABDesignListener = (listener: (design: FABDesignType) => void) => {
  fabDesignListeners.push(listener);
  return () => {
    fabDesignListeners = fabDesignListeners.filter((l) => l !== listener);
  };
};

// Fonctions de persistance
const loadFABDesignFromStorage = async (): Promise<FABDesignType | null> => {
  try {
    const saved = await AsyncStorage.getItem(FAB_DESIGN_STORAGE_KEY);
    if (saved && ["orbital", "stacked", "hamburger"].includes(saved)) {
      return saved as FABDesignType;
    }
    return null;
  } catch (error) {
    return null;
  }
};

const saveFABDesignToStorage = async (design: FABDesignType): Promise<void> => {
  try {
    await AsyncStorage.setItem(FAB_DESIGN_STORAGE_KEY, design);
  } catch (error) {}
};

interface UseFABDesignOptions {
  userType?: "guest" | "authenticated";
  defaultDesign?: FABDesignType;
}

export const useFABDesign = (options?: UseFABDesignOptions) => {
  // Déterminer le design par défaut basé sur le type d'utilisateur
  const getDefaultDesign = useCallback((): FABDesignType => {
    if (options?.defaultDesign) {
      return options.defaultDesign;
    }

    // Design par défaut : hamburger pour tous les utilisateurs
    return "hamburger";
  }, [options]);

  // Initialiser le design global si pas encore fait
  if (currentFABDesign === null) {
    currentFABDesign = getDefaultDesign();
  }

  // État local avec la valeur actuelle
  const [fabDesign, setFabDesignState] =
    useState<FABDesignType>(currentFABDesign);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);

  // Initialisation une seule fois avec chargement depuis AsyncStorage
  useEffect(() => {
    if (!isInitialized.current) {
      setIsLoading(true);

      const initializeFABDesign = async () => {
        try {
          // Charger depuis AsyncStorage
          const savedDesign = await loadFABDesignFromStorage();

          if (savedDesign) {
            // Utiliser le design sauvegardé
            currentFABDesign = savedDesign;
          } else if (currentFABDesign === null) {
            // Utiliser le défaut si rien de sauvegardé
            currentFABDesign = getDefaultDesign();
          }

          setFabDesignState(currentFABDesign);
          setIsLoading(false);
          isInitialized.current = true;
        } catch (error) {
          // En cas d'erreur, utiliser le défaut
          currentFABDesign = getDefaultDesign();
          setFabDesignState(currentFABDesign);
          setIsLoading(false);
          isInitialized.current = true;
        }
      };

      initializeFABDesign();
    }
  }, [getDefaultDesign, options?.userType]);

  // Écouter les mises à jour globales
  useEffect(() => {
    const unsubscribe = addFABDesignListener((newDesign) => {
      setFabDesignState(newDesign);
    });

    return unsubscribe;
  }, []);

  // Fonction pour mettre à jour le design
  const setFabDesign = useCallback(async (newDesign: FABDesignType) => {
    // Validation du type
    if (!["orbital", "stacked", "hamburger"].includes(newDesign)) {
      return;
    }

    // Mise à jour globale
    currentFABDesign = newDesign;
    setFabDesignState(newDesign);

    // Sauvegarder dans AsyncStorage
    await saveFABDesignToStorage(newDesign);

    // Notifier tous les autres composants
    notifyFABDesignUpdate(newDesign);
  }, []);

  // Fonction pour réinitialiser au design par défaut
  const resetFABDesign = useCallback(async () => {
    const defaultDesign = getDefaultDesign();
    await setFabDesign(defaultDesign);
  }, [setFabDesign, getDefaultDesign]);

  // Fonction pour obtenir le design suivant (rotation)
  const getNextDesign = useCallback((): FABDesignType => {
    const designs: FABDesignType[] = ["stacked", "orbital", "hamburger"];
    const currentIndex = designs.indexOf(fabDesign);
    const nextIndex = (currentIndex + 1) % designs.length;
    return designs[nextIndex];
  }, [fabDesign]);

  // Fonction pour passer au design suivant
  const cycleToNextDesign = useCallback(async () => {
    const nextDesign = getNextDesign();
    await setFabDesign(nextDesign);
  }, [getNextDesign, setFabDesign]);

  // Fonction pour obtenir les informations du design actuel
  const getCurrentDesignInfo = useCallback(() => {
    const designInfo = {
      stacked: {
        name: "Cartes Empilées",
        description: "Cartes qui se déploient avec rotation élégante",
        emoji: "🃏",
        color: "#10B981",
      },
      orbital: {
        name: "Orbital",
        description: "Boutons qui orbitent autour du centre",
        emoji: "🌟",
        color: "#3B82F6",
      },
      hamburger: {
        name: "Menu Hamburger",
        description: "Menu vertical centré en bas",
        emoji: "🍔",
        color: "#8B5CF6",
      },
    };

    return designInfo[fabDesign];
  }, [fabDesign]);

  return {
    fabDesign,
    setFabDesign,
    resetFABDesign,
    cycleToNextDesign,
    getNextDesign,
    getCurrentDesignInfo,
    isLoading,
  };
};
