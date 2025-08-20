import { useState } from 'react';
import { Message } from '../../../types/chat';

interface UseChatMessageEditReturn {
  editingMessageId: string | null;
  originalInputText: string;
  handleEditMessage: (messageId: string, content: string) => void;
  handleUpdateMessage: (
    inputText: string,
    setMessages?: React.Dispatch<React.SetStateAction<Message[]>>,
    interruptAIGeneration?: () => void,
    setInputText?: React.Dispatch<React.SetStateAction<string>>
  ) => Promise<void>;
  cancelEdit: (setInputText: React.Dispatch<React.SetStateAction<string>>) => void;
  isEditing: boolean;
}

export const useChatMessageEdit = (): UseChatMessageEditReturn => {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [originalInputText, setOriginalInputText] = useState<string>('');
  
  // Fonction pour gérer la modification d'un message
  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setOriginalInputText(content); // Sauvegarder le texte original du message
  };
  
  // Fonction pour mettre à jour un message existant
  const handleUpdateMessage = async (
    inputText: string,
    setMessages?: React.Dispatch<React.SetStateAction<Message[]>>,
    interruptAIGeneration?: () => void,
    setInputText?: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (!editingMessageId || !setMessages) return;
    
    const updatedContent = inputText.trim();
    if (!updatedContent) return;
    
    // Interrompre toute génération AI en cours avant de modifier le message
    if (interruptAIGeneration) {
      interruptAIGeneration();
    }
    
    // Mettre à jour le message dans la liste
    setMessages(prevMessages => 
      prevMessages.map(message => 
        message.id === editingMessageId 
          ? { ...message, content: updatedContent, timestamp: new Date() }
          : message
      )
    );
    
    // Réinitialiser l'état d'édition
    setEditingMessageId(null);
    if (setInputText) {
      setInputText('');
    }
    setOriginalInputText('');
  };
  
  // Fonction pour annuler la modification
  const cancelEdit = (setInputText: React.Dispatch<React.SetStateAction<string>>) => {
    setEditingMessageId(null);
    setInputText(originalInputText); // Restaurer le texte original
    setOriginalInputText('');
  };
  
  return {
    editingMessageId,
    originalInputText,
    handleEditMessage,
    handleUpdateMessage,
    cancelEdit,
    isEditing: editingMessageId !== null
  };
}; 