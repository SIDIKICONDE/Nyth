import React, { memo } from "react";
import { View } from "react-native";
import tw from "twrnc";
import { Message } from "../../../types/chat";
import { processFormattedText } from "../../../utils/textFormatter";
import { UIText } from "../../ui/Typography";
import TypingAnimation from "../TypingAnimation";
import { MessageTimestamp } from "./MessageTimestamp";

interface MessageContentProps {
  message: Message;
  shouldAnimate: boolean;
  onAnimationComplete: () => void;
  textStyle: any;
  timeStyle: any;
}

export const MessageContent: React.FC<MessageContentProps> = memo(
  ({ message, shouldAnimate, onAnimationComplete, textStyle, timeStyle }) => {
    const isUser = message.isUser;

    const timestamp = (
      <MessageTimestamp timestamp={message.timestamp} style={timeStyle} />
    );

    // Animation pour les messages IA uniquement
    if (shouldAnimate && !isUser) {
      return (
        <TypingAnimation
          key={`${message.id}-${message.content.length}`}
          text={message.content}
          style={textStyle}
          onComplete={onAnimationComplete}
          typingSpeed={20} // Vitesse simple
        />
      );
    }

    // Message utilisateur
    if (isUser) {
      return (
        <View style={tw`flex-row flex-wrap items-end`}>
          <UIText style={textStyle} selectable>
            {message.content}
          </UIText>
          {timestamp}
        </View>
      );
    }

    // Message IA statique (sans animation)
    return (
      <View style={tw`flex-row flex-wrap items-end`}>
        {processFormattedText(message.content, textStyle, true)}
        {timestamp}
      </View>
    );
  },
  // Optimisation memo - ne re-render que si ces props changent
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.shouldAnimate === nextProps.shouldAnimate &&
      prevProps.textStyle === nextProps.textStyle &&
      prevProps.timeStyle === nextProps.timeStyle
    );
  }
);
