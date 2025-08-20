import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { AIPrompt } from '../../../../types/ai';

export interface CreateScriptOptions {
  content: string;
  topic: string;
  prompt: AIPrompt;
  t: (key: string, options?: any) => string;
  onSuccess?: (scriptId: string) => void;
}

export const createScript = async ({
  content,
  topic,
  prompt,
  t,
  onSuccess
}: CreateScriptOptions): Promise<void> => {
  try {
    // Create title from topic
    const titlePrefix = t('ai.script.titlePrefix', 'AI Script - ');
    const title = `${titlePrefix}${topic.substring(0, 30)}${topic.length > 30 ? '...' : ''}`;
    
    // Get existing scripts
    const savedScriptsStr = await AsyncStorage.getItem('scripts');
    const savedScripts = savedScriptsStr ? JSON.parse(savedScriptsStr) : [];
    
    // Create new script
    const newScript = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAIGenerated: true,
      aiPrompt: prompt,
      estimatedDuration: Math.ceil(content.split(' ').length / 150)
    };
    
    // Add script to list
    const updatedScripts = [...savedScripts, newScript];
    
    // Save updated list
    await AsyncStorage.setItem('scripts', JSON.stringify(updatedScripts));
    
    // Show success message
    Alert.alert(
      t('common.success'),
      t('ai.generation.success'),
      [
        {
          text: t('ai.generation.openScript'),
          onPress: () => onSuccess?.(newScript.id)
        },
        {
          text: t('common.ok'),
        }
      ]
    );
  } catch (error) {
    Alert.alert(t('common.error'), t('ai.error.saveError'));
  }
}; 