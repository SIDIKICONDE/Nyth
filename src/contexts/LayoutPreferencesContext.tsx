import React, { createContext, useContext } from "react";
import { useLayoutPreferencesLogic } from "../hooks/useLayoutPreferences";

// Créer le contexte avec une valeur par défaut undefined
const LayoutPreferencesContext = createContext<
  ReturnType<typeof useLayoutPreferencesLogic> | undefined
>(undefined);

// Provider qui encapsulera les composants
export const LayoutPreferencesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const layoutLogic = useLayoutPreferencesLogic();
  return (
    <LayoutPreferencesContext.Provider value={layoutLogic}>
      {children}
    </LayoutPreferencesContext.Provider>
  );
};

// Hook pour consommer le contexte
export const useLayoutPreferences = () => {
  const context = useContext(LayoutPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useLayoutPreferences must be used within a LayoutPreferencesProvider"
    );
  }
  return context;
};
