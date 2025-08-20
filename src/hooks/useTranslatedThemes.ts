import { useMemo, useEffect } from 'react';
import { useTranslation } from './useTranslation';
import { createPresetThemes } from '../constants/themes/presetThemes';
import { CustomTheme } from '../types/theme';

export const useTranslatedThemes = () => {
  const { t } = useTranslation();
  
  const translatedThemes = useMemo(() => {
    const themes = createPresetThemes(t);
    return themes;
  }, [t]);
  
  return translatedThemes;
};

export const useTranslatedTheme = (themeId: string): CustomTheme | undefined => {
  const translatedThemes = useTranslatedThemes();
  return translatedThemes.find(theme => theme.id === themeId);
}; 