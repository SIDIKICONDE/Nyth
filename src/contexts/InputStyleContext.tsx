import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type InputStyleId = "classic" | "glass" | "sheet" | "neon";

interface InputStyleContextType {
  selectedInputStyle: InputStyleId;
  setSelectedInputStyle: (style: InputStyleId) => void;
}

const InputStyleContext = createContext<InputStyleContextType>({
  selectedInputStyle: "sheet",
  setSelectedInputStyle: () => {},
});

export const InputStyleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedInputStyle, setSelectedInputStyleState] =
    useState<InputStyleId>("sheet");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("@input_style");
        if (
          saved === "glass" ||
          saved === "classic" ||
          saved === "sheet" ||
          saved === "neon"
        ) {
          setSelectedInputStyleState(saved as InputStyleId);
        }
      } catch (error) {
        // silent
      }
    })();
  }, []);

  const setSelectedInputStyle = (style: InputStyleId) => {
    setSelectedInputStyleState(style);
    AsyncStorage.setItem("@input_style", style).catch(() => {});
  };

  return (
    <InputStyleContext.Provider
      value={{ selectedInputStyle, setSelectedInputStyle }}
    >
      {children}
    </InputStyleContext.Provider>
  );
};

export const useInputStyle = () => useContext(InputStyleContext);
