import React from 'react';
import { View, Text, Switch, Alert } from 'react-native';
import tw from 'twrnc';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useTranslation } from '../../../../hooks/useTranslation';
import SettingRow from '../../SettingRow';

interface BypassProtectionToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => Promise<boolean>;
}

export const BypassProtectionToggle: React.FC<BypassProtectionToggleProps> = ({
  value,
  onValueChange
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const handleToggle = (newValue: boolean) => {
    if (newValue) {
      // Afficher un avertissement avant de désactiver la protection
      Alert.alert(
        t('settings.security.bypassProtection.warning.title'),
        t('settings.security.bypassProtection.warning.message'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel'
          },
          {
            text: t('settings.security.bypassProtection.warning.confirm'),
            style: 'destructive',
            onPress: async () => {
              await onValueChange(true);
            }
          }
        ]
      );
    } else {
      onValueChange(false);
    }
  };

  return (
    <>
      <SettingRow
        icon="shield-off"
        iconColor="#fff"
        iconBgColor="#ff6b6b"
        title={t('settings.security.bypassProtection.label')}
        subtitle={t('settings.security.bypassProtection.description')}
        rightElement={
          <Switch
            value={value}
            onValueChange={handleToggle}
            trackColor={{ 
              false: currentTheme.colors.surface, 
              true: '#ff6b6b' 
            }}
            thumbColor={value ? '#ff4444' : '#f4f3f4'}
          />
        }
        isLast={!value}
      />
      
      {value && (
        <View style={tw`mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded`}>
          <Text style={[
            tw`text-xs`,
            { color: '#ff4444' }
          ]}>
            ⚠️ {t('settings.security.bypassProtection.warningText')}
          </Text>
        </View>
      )}
    </>
  );
}; 