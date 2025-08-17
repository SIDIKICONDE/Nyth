import { useCallback } from 'react';
import { useFirestoreDocument } from './useFirestoreDocument';
import { useAuth } from '../contexts/AuthContext';

interface UserPreferences {
  theme?: string;
  language?: string;
  autoSave?: boolean;
  notifications?: boolean;
  [key: string]: any;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  const {
    loading,
    error,
    createDocument,
    updateDocument
  } = useFirestoreDocument({ 
    collection: 'userPreferences',
    showErrorAlerts: false // Gérer silencieusement pour les préférences
  });

  // Sauvegarder les préférences
  const savePreferences = useCallback(async (preferences: UserPreferences) => {
    if (!user) return false;

    const docId = user.uid;
    
    // Essayer de mettre à jour d'abord
    const updated = await updateDocument(docId, preferences);
    
    // Si la mise à jour échoue (document n'existe pas), créer
    if (!updated) {
      return createDocument(docId, {
        ...preferences,
        userId: user.uid
      });
    }
    
    return updated;
  }, [user, createDocument, updateDocument]);

  // Mettre à jour une préférence spécifique
  const updatePreference = useCallback(async (key: string, value: any) => {
    if (!user) return false;
    
    return savePreferences({ [key]: value });
  }, [user, savePreferences]);

  // Mettre à jour plusieurs préférences
  const updateMultiplePreferences = useCallback(async (updates: UserPreferences) => {
    if (!user) return false;
    
    return savePreferences(updates);
  }, [user, savePreferences]);

  return {
    loading,
    error,
    savePreferences,
    updatePreference,
    updateMultiplePreferences
  };
}; 