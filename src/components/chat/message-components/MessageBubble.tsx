import { useChatStyle } from "@/contexts/ChatStyleContext";
import { useMessageLayout } from "@/contexts/MessageLayoutContext";
import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useFont } from "../../../contexts/FontContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { Message } from "../../../types/chat";
import { MessageContent } from "./MessageContent";
import { getBubbleStyle, getTextStyle, getTimeStyle } from "./utils";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';
const logger = createOptimizedLogger('MessageBubble');

interface MessageBubbleProps {
  message: Message;
  shouldAnimate: boolean;
  onAnimationComplete: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  shouldAnimate,
  onAnimationComplete,
}) => {
  const { currentTheme } = useTheme();
  const { getContentFontStyle, fonts } = useFont();
  const { selectedStyle } = useChatStyle();
  const { settings: layoutSettings } = useMessageLayout();

  // Debug pour vérifier les mises à jour
  React.useEffect(() => {
    logger.debug(
      "🔄 MessageBubble re-rendered with layoutSettings:",
      layoutSettings
    );
  }, [layoutSettings]);

  const isUser = message.isUser;

  // Générer les styles en utilisant les utilitaires avec les réglages de layout
  const bubbleStyle = getBubbleStyle({
    selectedStyle,
    isUser,
    currentTheme,
    layoutSettings,
  });

  const textStyle = React.useMemo(
    () =>
      getTextStyle({
        isUser,
        selectedStyle,
        currentTheme,
        getFontFamily: getContentFontStyle,
      }),
    [isUser, selectedStyle, currentTheme, getContentFontStyle, fonts.content]
  );

  const timeStyle = React.useMemo(
    () =>
      getTimeStyle({
        isUser,
        selectedStyle,
        currentTheme,
        getFontFamily: getContentFontStyle,
      }),
    [isUser, selectedStyle, currentTheme, getContentFontStyle, fonts.content]
  );

  // Aplatir le tableau de styles pour éviter les tableaux imbriqués
  const flattenedStyle = Array.isArray(bubbleStyle)
    ? (bubbleStyle as any)
    : [bubbleStyle];

  return (
    <View style={[...flattenedStyle, tw`flex-row flex-wrap items-end`]}>
              <MessageContent
        message={message}
        shouldAnimate={shouldAnimate}
        onAnimationComplete={onAnimationComplete}
        textStyle={textStyle}
        timeStyle={timeStyle}
      />
    </View>
  );
};
