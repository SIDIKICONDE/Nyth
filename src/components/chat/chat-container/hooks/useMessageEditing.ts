import { useState, useCallback } from 'react';
import { Message } from '../../../../types/chat';
import { EditingState } from '../types';

interface UseMessageEditingProps {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
  interruptAIGeneration?: () => void;
}

export const useMessageEditing = ({
  inputText,
  setInputText,
  setMessages,
  interruptAIGeneration
}: UseMessageEditingProps) => {
  const [editingState, setEditingState] = useState<EditingState>({
    editingMessageId: null,
    originalInputText: ''
  });

  const handleEditMessage = useCallback((messageId: string, content: string) => {
    setEditingState({
      editingMessageId: messageId,
      originalInputText: inputText
    });
    setInputText(content);
  }, [inputText, setInputText]);

  const handleUpdateMessage = useCallback(async () => {
    if (!editingState.editingMessageId || !setMessages) return;
    
    const updatedContent = inputText.trim();
    if (!updatedContent) return;
    
    // Interrompre toute génération AI en cours avant de modifier le message
    if (interruptAIGeneration) {
      interruptAIGeneration();
    }
    
    // Mettre à jour le message dans la liste
    setMessages(prevMessages => 
      prevMessages.map(message => 
        message.id === editingState.editingMessageId 
          ? { ...message, content: updatedContent, timestamp: new Date() }
          : message
      )
    );
    
    // Réinitialiser l'état d'édition
    setEditingState({
      editingMessageId: null,
      originalInputText: ''
    });
    setInputText('');
  }, [editingState.editingMessageId, inputText, setMessages, interruptAIGeneration, setInputText]);

  const cancelEdit = useCallback(() => {
    setInputText(editingState.originalInputText);
    setEditingState({
      editingMessageId: null,
      originalInputText: ''
    });
  }, [editingState.originalInputText, setInputText]);

  return {
    editingMessageId: editingState.editingMessageId,
    handleEditMessage,
    handleUpdateMessage,
    cancelEdit
  };
}; 