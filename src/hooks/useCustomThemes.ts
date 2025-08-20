import { useCallback } from 'react';
import { useFirestoreDocument } from './useFirestoreDocument';
import { useAuth } from '../contexts/AuthContext';
import { CustomTheme } from '../types/theme';

export const useCustomThemes = () => {
  const { user } = useAuth();
  const {
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument
  } = useFirestoreDocument({ collection: 'customThemes' });

  // Créer un thème utilisateur
  const createTheme = useCallback(async (theme: CustomTheme) => {
    if (!user) return false;

    const themeData = {
      ...theme,
      userId: user.uid,
      isDark: theme.isDark || false,
      // Aplatir les couleurs pour Firestore
      backgroundColor: theme.colors.background,
      textColor: theme.colors.text,
      primaryColor: theme.colors.primary,
      secondaryColor: theme.colors.secondary,
      accentColor: theme.colors.accent,
      surfaceColor: theme.colors.surface,
      cardColor: theme.colors.card,
      textSecondaryColor: theme.colors.textSecondary,
      textMutedColor: theme.colors.textMuted,
      borderColor: theme.colors.border,
      successColor: theme.colors.success,
      warningColor: theme.colors.warning,
      errorColor: theme.colors.error,
      gradient: theme.colors.gradient
    };

    return createDocument(`${user.uid}_${theme.id}`, themeData);
  }, [user, createDocument]);

  // Créer un thème système (readOnly)
  const createSystemTheme = useCallback(async (
    theme: CustomTheme,
    themeId: string
  ) => {
    const themeData = {
      ...theme,
      userId: 'system',
      isOfficial: true,
      isDark: theme.isDark || false,
      // Aplatir les couleurs pour Firestore
      backgroundColor: theme.colors.background,
      textColor: theme.colors.text,
      primaryColor: theme.colors.primary,
      secondaryColor: theme.colors.secondary,
      accentColor: theme.colors.accent,
      surfaceColor: theme.colors.surface,
      cardColor: theme.colors.card,
      textSecondaryColor: theme.colors.textSecondary,
      textMutedColor: theme.colors.textMuted,
      borderColor: theme.colors.border,
      successColor: theme.colors.success,
      warningColor: theme.colors.warning,
      errorColor: theme.colors.error,
      gradient: theme.colors.gradient
    };

    return createDocument(themeId, themeData, { readOnly: true });
  }, [createDocument]);

  // Mettre à jour un thème
  const updateTheme = useCallback(async (
    themeId: string,
    updates: Partial<CustomTheme>
  ) => {
    if (!user) return false;

    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.isDark !== undefined) updateData.isDark = updates.isDark;
    
    // Aplatir les couleurs si elles sont mises à jour
    if (updates.colors) {
      const colors = updates.colors;
      if (colors.background) updateData.backgroundColor = colors.background;
      if (colors.text) updateData.textColor = colors.text;
      if (colors.primary) updateData.primaryColor = colors.primary;
      if (colors.secondary) updateData.secondaryColor = colors.secondary;
      if (colors.accent) updateData.accentColor = colors.accent;
      if (colors.surface) updateData.surfaceColor = colors.surface;
      if (colors.card) updateData.cardColor = colors.card;
      if (colors.textSecondary) updateData.textSecondaryColor = colors.textSecondary;
      if (colors.textMuted) updateData.textMutedColor = colors.textMuted;
      if (colors.border) updateData.borderColor = colors.border;
      if (colors.success) updateData.successColor = colors.success;
      if (colors.warning) updateData.warningColor = colors.warning;
      if (colors.error) updateData.errorColor = colors.error;
      if (colors.gradient) updateData.gradient = colors.gradient;
    }

    return updateDocument(`${user.uid}_${themeId}`, updateData);
  }, [user, updateDocument]);

  // Supprimer un thème
  const deleteTheme = useCallback(async (themeId: string) => {
    if (!user) return false;
    return deleteDocument(`${user.uid}_${themeId}`);
  }, [user, deleteDocument]);

  return {
    loading,
    error,
    createTheme,
    createSystemTheme,
    updateTheme,
    deleteTheme
  };
}; 