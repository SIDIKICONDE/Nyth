import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from '../../locales/i18n';
import { Message, SavedConversation } from '../../types/chat';

export const ConversationService = {
  // Fonction pour sauvegarder une conversation
  saveConversation: async (conversationId: string, messages: Message[]) => {
    const t = i18next.t.bind(i18next);
    
    try {
      // Ne pas sauvegarder les conversations vides
      if (messages.length === 0 || (messages.length === 1 && !messages[0].isUser)) {
        return;
      }

      // Générer un titre basé sur le premier message utilisateur ou utiliser un titre par défaut
      const userMessages = messages.filter(msg => msg.isUser);
      let title = t('conversation.service.defaultTitle');

      if (userMessages.length > 0) {
        const firstUserMessage = userMessages[0].content;
        title = firstUserMessage.length > 30 
          ? firstUserMessage.substring(0, 30) + "..."
          : firstUserMessage;
      }

      // Créer l'objet de conversation à sauvegarder
      const conversation: SavedConversation = {
        id: conversationId,
        messages: messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })),
        lastUpdated: new Date().toISOString(),
        title
      };

      // Récupérer les conversations existantes
      const savedConversationsJson = await AsyncStorage.getItem('ai_conversations');
      let savedConversations: SavedConversation[] = savedConversationsJson 
        ? JSON.parse(savedConversationsJson) 
        : [];

      // Vérifier si cette conversation existe déjà
      const existingIndex = savedConversations.findIndex(conv => conv.id === conversationId);

      if (existingIndex !== -1) {
        // Mettre à jour la conversation existante
        savedConversations[existingIndex] = conversation;
      } else {
        // Ajouter la nouvelle conversation
        savedConversations.push(conversation);
      }

      // Limiter le nombre de conversations sauvegardées (garder les 50 plus récentes)
      if (savedConversations.length > 50) {
        savedConversations.sort((a, b) => 
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
        savedConversations = savedConversations.slice(0, 50);
      }

      // Sauvegarder les conversations mises à jour localement
      await AsyncStorage.setItem('ai_conversations', JSON.stringify(savedConversations));
    } catch (error) {}
  },

  // Fonction pour charger une conversation spécifique
  loadConversation: async (id?: string): Promise<{ messages: Message[], conversationId: string }> => {
    const t = i18next.t.bind(i18next);
    
    try {
      // Si un ID est fourni, charger cette conversation spécifique
      if (id) {
        const savedConversationsJson = await AsyncStorage.getItem('ai_conversations');
        if (savedConversationsJson) {
          const savedConversations: SavedConversation[] = JSON.parse(savedConversationsJson);
          const conversation = savedConversations.find(conv => conv.id === id);
          
          if (conversation) {
            // Convertir les timestamps en objets Date
            const loadedMessages: Message[] = conversation.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            
            return { messages: loadedMessages, conversationId: id };
          }
        }
      }
      
      // Si pas d'ID fourni ou conversation non trouvée, commencer une nouvelle conversation
      const newId = Date.now().toString();
      return { messages: [], conversationId: newId };
    } catch (error) {
      const newId = Date.now().toString();
      return { messages: [], conversationId: newId };
    }
  },

  // Fonction pour récupérer toutes les conversations sauvegardées
  getAllConversations: async (): Promise<SavedConversation[]> => {
    const t = i18next.t.bind(i18next);
    
    try {
      const savedConversationsJson = await AsyncStorage.getItem('ai_conversations');
      if (savedConversationsJson) {
        const savedConversations: SavedConversation[] = JSON.parse(savedConversationsJson);
        // Trier par date de mise à jour (la plus récente en premier)
        return savedConversations.sort((a, b) => 
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  // Fonction pour supprimer une conversation
  deleteConversation: async (id: string): Promise<boolean> => {
    const t = i18next.t.bind(i18next);
    
    try {
      // Supprimer localement
      const savedConversationsJson = await AsyncStorage.getItem('ai_conversations');
      if (savedConversationsJson) {
        let savedConversations: SavedConversation[] = JSON.parse(savedConversationsJson);
        savedConversations = savedConversations.filter(conv => conv.id !== id);
        await AsyncStorage.setItem('ai_conversations', JSON.stringify(savedConversations));
        
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}; 