import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from '../../../hooks/useTranslation';
import { QuickAction } from '../types';

export const useQuickActions = (): QuickAction[] => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const quickActions: QuickAction[] = [
    {
      id: 'analyze',
      label: t('ai.actions.analyze'),
      icon: 'chart-line',
      color: currentTheme.colors.warning,
      prompt: (content) => {
        const lang = t('common.language');
        if (lang === 'fr') {
          return `Analyse ce script et fournis EN FRANÇAIS :\n1. Le ton utilisé\n2. Les points forts\n3. Les suggestions d'amélioration\n4. Le public cible probable\n\nScript :\n\n${content}`;
        } else {
          return `Analyze this script and provide the analysis IN THE SAME LANGUAGE AS THE SCRIPT:\n1. The tone used\n2. The strong points\n3. Suggestions for improvement\n4. The likely target audience\n\nScript:\n\n${content}`;
        }
      }
    },
    {
      id: 'improve',
      label: t('ai.actions.improve'),
      icon: 'magic-staff',
      color: currentTheme.colors.accent,
      prompt: (content) => {
        const lang = t('common.language');
        if (lang === 'fr') {
          return `Améliore ce script en le rendant plus clair, plus engageant et mieux structuré. Garde le même ton et le même message principal. RÉPONDS TOUJOURS EN FRANÇAIS :\n\n${content}`;
        } else {
          return `Improve this script by making it clearer, more engaging and better structured. Keep the same tone and main message. ALWAYS RESPOND IN THE SAME LANGUAGE AS THE SCRIPT:\n\n${content}`;
        }
      }
    },
    {
      id: 'correct',
      label: t('ai.actions.correct'),
      icon: 'spellcheck',
      color: currentTheme.colors.success,
      prompt: (content) => {
        const lang = t('common.language');
        if (lang === 'fr') {
          return `Corrige les fautes d'orthographe, de grammaire et de ponctuation dans ce script. Ne change pas le style ou le sens. RETOURNE LE TEXTE CORRIGÉ EN FRANÇAIS :\n\n${content}`;
        } else {
          return `Correct spelling, grammar, and punctuation errors in this script. Don't change the style or meaning. RETURN THE CORRECTED TEXT IN THE SAME LANGUAGE AS THE ORIGINAL:\n\n${content}`;
        }
      }
    },
    {
      id: 'custom',
      label: t('ai.actions.customQuestion', 'Question personnalisée'),
      icon: 'comment-question',
      color: currentTheme.colors.primary,
      prompt: (content) => content // Just return the content, user will add their question
    }
  ];

  return quickActions;
}; 