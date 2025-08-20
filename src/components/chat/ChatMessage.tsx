import * as React from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useFont } from "../../contexts/FontContext";
import { Message } from "../../types/chat";
import {
  MessageActions,
  MessageBubble,
  useMessageAnimation,
  useMessageInteractions,
} from "./message-components";

interface ChatMessageProps {
  message: Message;
  index: number;
  isNewMessage?: boolean;
  onSaveToEditor?: (content: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  index,
  isNewMessage = false,
  onSaveToEditor = () => {},
  onEditMessage = () => {},
}) => {
  const { fonts } = useFont();

  // Hooks personnalisés pour la logique
  const { shouldAnimate, handleAnimationComplete } = useMessageAnimation(
    message,
    isNewMessage
  );

  const { showActions, handlePress, handleLongPress, hideActions } =
    useMessageInteractions(message, onSaveToEditor);

  // Forcer le re-render quand les polices changent
  const messageKey = React.useMemo(
    () => `${message.id}-${fonts.content}`,
    [message.id, fonts.content]
  );

  return (
    <View style={[tw`mb-3 w-full`]} key={messageKey}>
      <View
        style={[
          tw`flex-row`,
          { justifyContent: message.isUser ? "flex-end" : "flex-start" },
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          onLongPress={handleLongPress}
          activeOpacity={0.8}
        >
          <MessageBubble
            message={message}
            shouldAnimate={shouldAnimate}
            onAnimationComplete={handleAnimationComplete}
          />
        </TouchableOpacity>
      </View>

      <MessageActions
        isVisible={showActions}
        isUser={message.isUser}
        messageContent={message.content}
        messageId={message.id}
        onSaveToEditor={onSaveToEditor}
        onEditMessage={onEditMessage}
        onClose={hideActions}
      />
    </View>
  );
};

export default ChatMessage;
