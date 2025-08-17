import { useState } from 'react';
import { Alert } from 'react-native';
import { CustomTheme, ThemeColors } from '../contexts/ThemeContext';
import { PRESET_THEMES } from '../constants/themes';
import { useTranslation } from './useTranslation';

interface UseThemeManagementProps {
  currentTheme: CustomTheme;
  customThemes: CustomTheme[];
  setTheme: (theme: CustomTheme) => void;
  addCustomTheme: (theme: CustomTheme) => void;
  deleteCustomTheme: (themeId: string) => void;
}

export function useThemeManagement({
  currentTheme,
  customThemes,
  setTheme,
  addCustomTheme,
  deleteCustomTheme
}: UseThemeManagementProps) {
  const { t } = useTranslation();
  
  // États pour la création de thème
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [customColors, setCustomColors] = useState<ThemeColors>({
    primary: '#3b82f6',
    secondary: '#6366f1',
    accent: '#8b5cf6',
    background: '#f8fafc',
    surface: '#ffffff',
    card: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    textMuted: '#9ca3af',
    border: '#e2e8f0',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    gradient: ['#3b82f6', '#6366f1'],
  });

  // États pour les alertes
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<string | null>(null);

  // Tous les thèmes disponibles
  const allThemes = [...PRESET_THEMES, ...customThemes];

  // Sélectionner un thème
  const handleThemeSelect = (theme: CustomTheme) => {
    setTheme(theme);
  };

  // Créer un nouveau thème
  const handleCreateTheme = () => {
    if (!newThemeName.trim()) {
      Alert.alert(
        t('theme.management.error.title'), 
        t('theme.management.error.nameRequired')
      );
      return;
    }

    const newTheme: CustomTheme = {
      id: `custom-${Date.now()}`,
      name: newThemeName,
      isDark: customColors.background === '#0f0f0f' || customColors.background.startsWith('#1') || customColors.background.startsWith('#0'),
      colors: {
        ...customColors,
        gradient: [customColors.primary, customColors.secondary],
      },
    };
    
    addCustomTheme(newTheme);
    closeCreateModal();
    setShowSuccessAlert(true);
  };

  // Fermer le modal de création
  const closeCreateModal = () => {
    setIsCreateModalVisible(false);
    setNewThemeName('');
    resetCustomColors();
  };

  // Réinitialiser les couleurs personnalisées
  const resetCustomColors = () => {
    setCustomColors({
      primary: '#3b82f6',
      secondary: '#6366f1',
      accent: '#8b5cf6',
      background: '#f8fafc',
      surface: '#ffffff',
      card: '#ffffff',
      text: '#1e293b',
      textSecondary: '#64748b',
      textMuted: '#9ca3af',
      border: '#e2e8f0',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      gradient: ['#3b82f6', '#6366f1'],
    });
  };

  // Demander la suppression d'un thème
  const handleDeleteTheme = (themeId: string) => {
    setThemeToDelete(themeId);
    setShowDeleteAlert(true);
  };

  // Confirmer la suppression d'un thème
  const confirmDeleteTheme = () => {
    if (themeToDelete) {
      deleteCustomTheme(themeToDelete);
      setThemeToDelete(null);
      setShowDeleteAlert(false);
    }
  };

  // Annuler la suppression d'un thème
  const cancelDeleteTheme = () => {
    setThemeToDelete(null);
    setShowDeleteAlert(false);
  };

  // Mettre à jour les couleurs personnalisées
  const updateCustomColors = (newColors: Partial<ThemeColors>) => {
    setCustomColors(prev => ({
      ...prev,
      ...newColors
    }));
  };

  // Basculer entre mode clair et sombre
  const toggleDarkMode = (isDark: boolean) => {
    if (isDark) {
      updateCustomColors({
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
      });
    } else {
      updateCustomColors({
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#1e293b',
        textSecondary: '#64748b',
      });
    }
  };

  return {
    // États
    isCreateModalVisible,
    newThemeName,
    customColors,
    showErrorAlert,
    showSuccessAlert,
    showDeleteAlert,
    themeToDelete,
    
    // Actions
    setIsCreateModalVisible,
    setNewThemeName,
    setShowErrorAlert,
    setShowSuccessAlert,
    handleThemeSelect,
    handleCreateTheme,
    closeCreateModal,
    handleDeleteTheme,
    confirmDeleteTheme,
    cancelDeleteTheme,
    updateCustomColors,
    toggleDarkMode,
  };
} 