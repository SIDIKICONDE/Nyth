import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from '../../../../hooks/useTranslation';
import { AIService } from '../../../../services/AIService';
import { AIPrompt } from '../../../../types/ai';
import { useAPIValidation } from './useAPIValidation';

export type ImprovementStyle = 'concise' | 'detailed' | 'engaging' | 'formal' | 'casual';
export type ImprovementFocus = 'clarity' | 'impact' | 'flow' | 'all';

interface UseImproveActionProps {
  content: string;
  onContentUpdate: (newContent: string) => void;
}

interface ImproveOptions {
  style?: ImprovementStyle;
  focus?: ImprovementFocus;
  preserveLength?: boolean;
  addExamples?: boolean;
}

export const useImproveAction = ({ content, onContentUpdate }: UseImproveActionProps) => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastImprovement, setLastImprovement] = useState<string | null>(null);
  const { checkAndEnableAPIs } = useAPIValidation();

  const buildAdvancedImprovementPrompt = (text: string, options: ImproveOptions = {}): string => {
    return `Améliore ce texte en français. Garde exactement le même message et le même sens, rends-le juste plus fluide et mieux écrit. Retourne UNIQUEMENT le texte amélioré, sans explications :

${text}`;
  };



  const handleImprove = useCallback(async (options: ImproveOptions = {}) => {
    if (!content.trim()) {
      Alert.alert(t('common.error'), t('ai.error.noTextToCorrect'));
      return;
    }

    const apisReady = await checkAndEnableAPIs();
    if (!apisReady) {
      return;
    }

    setIsProcessing(true);

    try {
      const promptText = buildAdvancedImprovementPrompt(content, options);
      
      const aiPrompt: AIPrompt = {
        topic: promptText,
        tone: 'professional',
        platform: 'presentation',
        language: 'auto',
        creativity: 0.6
      };

      const scriptResult = await AIService.generateScript(aiPrompt);

      if (scriptResult && scriptResult.content) {
        setLastImprovement(content); // Sauvegarder l'original pour annulation
        onContentUpdate(scriptResult.content);
        
        Alert.alert(
          t('ai.improvement.success'),
          t('ai.improvement.successMessage'),
          [
            { text: t('common.ok'), style: 'default' },
            { 
              text: t('common.undo'), 
              onPress: () => {
                if (lastImprovement) {
                  onContentUpdate(lastImprovement);
                  setLastImprovement(null);
                }
              }
            }
          ]
        );
      } else {
        throw new Error(t('ai.error.noTextToCorrect'));
      }
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        error.message || t('ai.error.generationError')
      );
    } finally {
      setIsProcessing(false);
    }
  }, [content, onContentUpdate, checkAndEnableAPIs, t, lastImprovement]);

  // Version simple pour compatibilité
  const handleImproveSimple = useCallback(async () => {
    return handleImprove({ style: 'engaging', focus: 'all' });
  }, [handleImprove]);

  return {
    isProcessing,
    handleImprove,
    handleImproveSimple,
    canUndo: !!lastImprovement,
    undoLastImprovement: () => {
      if (lastImprovement) {
        onContentUpdate(lastImprovement);
        setLastImprovement(null);
      }
    }
  };
}; 