import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '../../../../utils/optimizedLogger';
import { SecuritySettings } from '../types';

const logger = createLogger('useSecuritySettings');

export const useSecuritySettings = () => {
  const [settings, setSettings] = useState<SecuritySettings>({
    enhancedSecurity: false,
    bypassProtection: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const enhanced = (await AsyncStorage.getItem('enhanced_security_mode')) === 'true';
      const bypass = (await AsyncStorage.getItem('bypass_api_protection')) === 'true';
      
      setSettings({
        enhancedSecurity: enhanced,
        bypassProtection: bypass
      });
      setIsLoading(false);
    } catch (error) {
      logger.error('Erreur lors du chargement des paramètres de sécurité', error);
      setIsLoading(false);
    }
  };

  const updateEnhancedSecurity = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('enhanced_security_mode', value.toString());
      setSettings(prev => ({ ...prev, enhancedSecurity: value }));
      return true;
    } catch (error) {
      logger.error('Erreur lors de la modification du mode sécurité renforcée', error);
      return false;
    }
  };

  const updateBypassProtection = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('bypass_api_protection', value.toString());
      setSettings(prev => ({ ...prev, bypassProtection: value }));
      return true;
    } catch (error) {
      logger.error('Erreur lors de la modification de la protection', error);
      return false;
    }
  };

  return {
    settings,
    isLoading,
    updateEnhancedSecurity,
    updateBypassProtection
  };
}; 