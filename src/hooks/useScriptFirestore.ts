import { useCallback } from 'react';
import { useFirestoreDocument } from './useFirestoreDocument';
import { useAuth } from '../contexts/AuthContext';
import { Script } from '../types';

export const useScriptFirestore = () => {
  const { user } = useAuth();
  const {
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument
  } = useFirestoreDocument({ collection: 'scripts' });

  // Créer un nouveau script
  const createScript = useCallback(async (script: Omit<Script, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    if (!user) return false;

    const scriptData = {
      ...script,
      userId: user.uid,
      category: script.category || 'general',
      isFavorite: false,
      wordCount: script.content.split(/\s+/).length,
      estimatedDuration: Math.ceil(script.content.split(/\s+/).length / 150) // 150 mots/minute
    };

    return createDocument(script.id || `script_${Date.now()}`, scriptData);
  }, [user, createDocument]);

  // Créer un script système (readOnly)
  const createSystemScript = useCallback(async (
    script: Omit<Script, 'id' | 'createdAt' | 'updatedAt'>,
    scriptId: string
  ) => {
    if (!user) return false;

    const scriptData = {
      ...script,
      userId: 'system', // Script système
      category: script.category || 'tutorial',
      isFavorite: false,
      wordCount: script.content.split(/\s+/).length,
      estimatedDuration: Math.ceil(script.content.split(/\s+/).length / 150)
    };

    return createDocument(scriptId, scriptData, { readOnly: true });
  }, [user, createDocument]);

  // Mettre à jour un script
  const updateScript = useCallback(async (
    scriptId: string, 
    updates: Partial<Script>
  ) => {
    if (!user) return false;

    // Créer un objet de mise à jour typé
    const updateData: any = { ...updates };

    // Recalculer les métadonnées si le contenu change
    if (updates.content) {
      updateData.wordCount = updates.content.split(/\s+/).length;
      updateData.estimatedDuration = Math.ceil(updates.content.split(/\s+/).length / 150);
    }

    return updateDocument(scriptId, updateData);
  }, [user, updateDocument]);

  // Supprimer un script
  const deleteScript = useCallback(async (scriptId: string) => {
    if (!user) return false;
    return deleteDocument(scriptId);
  }, [user, deleteDocument]);

  // Basculer le favori
  const toggleFavorite = useCallback(async (scriptId: string, currentState: boolean) => {
    return updateScript(scriptId, { isFavorite: !currentState });
  }, [updateScript]);

  return {
    loading,
    error,
    createScript,
    createSystemScript,
    updateScript,
    deleteScript,
    toggleFavorite
  };
}; 