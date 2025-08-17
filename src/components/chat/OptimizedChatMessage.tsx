/**
 * Composant ChatMessage optimisé pour de meilleures performances
 */

import React, { memo } from "react";
import ChatMessage from "./ChatMessage";

interface OptimizedChatMessageProps {
  message: any;
  index: number;
  isNewMessage?: boolean;
  onSaveToEditor?: (content: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
}

export const OptimizedChatMessage: React.FC<OptimizedChatMessageProps> = memo(
  ChatMessage,
  // Comparaison optimisée pour memo
  (prevProps, nextProps) => {
    // Comparaison des propriétés critiques
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (prevProps.isNewMessage !== nextProps.isNewMessage) return false;
    if (prevProps.index !== nextProps.index) return false;

    // Les callbacks sont généralement stables, pas besoin de les comparer
    return true;
  }
);

export default OptimizedChatMessage;
