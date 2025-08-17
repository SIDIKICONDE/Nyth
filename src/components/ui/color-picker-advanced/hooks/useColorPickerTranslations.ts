import { useCallback } from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';

export const useColorPickerTranslations = () => {
  const { t } = useTranslation();

  const getColorLabel = useCallback((colorType: string) => {
    const labelKey = `colorPicker.labels.${colorType}`;
    return t(labelKey, { defaultValue: t('colorPicker.labels.color') });
  }, [t]);

  const getAccessibilityLabel = useCallback((key: string, params?: Record<string, any>) => {
    return t(`colorPicker.accessibility.${key}`, params);
  }, [t]);

  const getValidationMessage = useCallback((isValid: boolean) => {
    return isValid 
      ? t('colorPicker.validation.validHex')
      : t('colorPicker.validation.invalidHex');
  }, [t]);

  const getContrastLevel = useCallback((ratio: number) => {
    if (ratio >= 7) return t('colorPicker.contrast.high');
    if (ratio >= 4.5) return t('colorPicker.contrast.medium');
    return t('colorPicker.contrast.low');
  }, [t]);

  const getUtilityLabel = useCallback((action: string, value: number) => {
    return t(`colorPicker.utils.${action}`, { 
      percent: Math.round(value),
      value: value.toFixed(2)
    });
  }, [t]);

  return {
    t,
    getColorLabel,
    getAccessibilityLabel,
    getValidationMessage,
    getContrastLevel,
    getUtilityLabel,
    labels: {
      title: t('colorPicker.title'),
      hexInput: t('colorPicker.placeholders.hexInput'),
      enterHex: t('colorPicker.placeholders.enterHex'),
      expand: t('colorPicker.buttons.expand'),
      collapse: t('colorPicker.buttons.collapse'),
      preset: t('colorPicker.categories.preset'),
      extended: t('colorPicker.categories.extended')
    }
  };
}; 