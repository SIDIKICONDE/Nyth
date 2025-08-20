import React from 'react';
import { Switch, Alert } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useTranslation } from '../../../../hooks/useTranslation';
import SettingRow from '../../SettingRow';

interface EnhancedSecurityToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => Promise<boolean>;
}

export const EnhancedSecurityToggle: React.FC<EnhancedSecurityToggleProps> = ({
  value,
  onValueChange
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const handleToggle = async (newValue: boolean) => {
    const success = await onValueChange(newValue);
    
    if (success && newValue) {
      Alert.alert(
        t('settings.security.enhancedMode.enabled.title'),
        t('settings.security.enhancedMode.enabled.message')
      );
    } else if (!success) {
      Alert.alert(
        t('common.error'),
        t('settings.security.error.save')
      );
    }
  };

  return (
    <SettingRow
      icon="shield"
      iconColor="#fff"
      iconBgColor={currentTheme.colors.primary}
      title={t('settings.security.enhancedMode.label')}
      subtitle={t('settings.security.enhancedMode.description')}
      rightElement={
        <Switch
          value={value}
          onValueChange={handleToggle}
          trackColor={{ 
            false: currentTheme.colors.surface, 
            true: currentTheme.colors.primary 
          }}
          thumbColor={value ? currentTheme.colors.background : '#f4f3f4'}
        />
      }
    />
  );
}; 