import { useState, useEffect } from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Script, RootStackParamList } from '../../../types';

type SettingsScreenRouteProp = RouteProp<RootStackParamList, 'Settings'>;

export function useScript() {
  const route = useRoute<SettingsScreenRouteProp>();
  const [script, setScript] = useState<Script | null>(null);

  useEffect(() => {
    loadScript();
  }, []);

  const loadScript = async () => {
    try {
      const savedScripts = await AsyncStorage.getItem('scripts');
      if (savedScripts) {
        const scripts: Script[] = JSON.parse(savedScripts);
        
        if (route.params && route.params.scriptId) {
          const foundScript = scripts.find(s => s.id === route.params.scriptId);
          if (foundScript) {
            setScript(foundScript);
          }
        } else {
          if (scripts.length > 0) {
            setScript(scripts[0]);
          }
        }
      }
    } catch (error) {}
  };

  return {
    script,
    scriptId: script?.id
  };
} 