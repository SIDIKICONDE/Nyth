import { useState, useCallback } from "react";

interface UseAIAssistantReturn {
  isAIAssistantVisible: boolean;
  showAIAssistant: () => void;
  hideAIAssistant: () => void;
  toggleAIAssistant: () => void;
}

export const useAIAssistant = (): UseAIAssistantReturn => {
  const [isAIAssistantVisible, setIsAIAssistantVisible] = useState(false);

  const showAIAssistant = useCallback(() => {
    setIsAIAssistantVisible(true);
  }, []);

  const hideAIAssistant = useCallback(() => {
    setIsAIAssistantVisible(false);
  }, []);

  const toggleAIAssistant = useCallback(() => {
    setIsAIAssistantVisible((prev) => !prev);
  }, []);

  return {
    isAIAssistantVisible,
    showAIAssistant,
    hideAIAssistant,
    toggleAIAssistant,
  };
};
