import { useCallback, useState } from "react";
import { Platform } from "react-native";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

export const useMessageInteractions = (
  message: { isUser: boolean; content: string },
  onSaveToEditor: (content: string) => void
) => {
  const [lastTap, setLastTap] = useState<number | null>(null);
  const [showActions, setShowActions] = useState(false);
  const DOUBLE_TAP_DELAY = 300;

  const handlePress = useCallback(() => {
    if (showActions) {
      setShowActions(false);
      return;
    }

    const now = Date.now();
    if (lastTap && now - lastTap < DOUBLE_TAP_DELAY) {
      setLastTap(null);
      if (!message.isUser && message.content.trim()) {
        onSaveToEditor(message.content);
      }
    } else {
      setLastTap(now);
    }
  }, [showActions, lastTap, message.isUser, message.content, onSaveToEditor]);

  const handleLongPress = useCallback(() => {
    if (Platform.OS === "ios") {
      try {
        // Configuration pour le haptic feedback
        const options = {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        };

        // Utiliser react-native-haptic-feedback
        ReactNativeHapticFeedback.trigger("impactMedium", options);
      } catch (error) {}
    }
    setShowActions(true);
  }, []);

  const hideActions = useCallback(() => {
    setShowActions(false);
  }, []);

  return {
    showActions,
    handlePress,
    handleLongPress,
    hideActions,
  };
};
