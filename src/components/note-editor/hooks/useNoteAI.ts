import { useCallback, useState } from 'react';
import { Note, AIAnalysis } from '../types';

interface AIAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  action: (content: string) => Promise<string>;
}

export function useNoteAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

  // AI Actions
  const aiActions: AIAction[] = [
    {
      id: 'summarize',
      name: 'Résumer',
      description: 'Créer un résumé concis du texte',
      icon: 'summarize',
      action: async (content: string) => {
        // Simulate AI API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const summary = sentences.slice(0, 3).join('. ').trim();
        return `## Résumé\n\n${summary}${summary.endsWith('.') ? '' : '.'}`;
      }
    },
    {
      id: 'improve',
      name: 'Améliorer',
      description: 'Améliorer la qualité et la clarté du texte',
      icon: 'auto-fix-high',
      action: async (content: string) => {
        // Simulate AI API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        return content
          .replace(/\b(tres|super|vraiment)\s+/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
      }
    },
    {
      id: 'expand',
      name: 'Développer',
      description: 'Ajouter plus de détails et de contexte',
      icon: 'expand',
      action: async (content: string) => {
        // Simulate AI API call
        await new Promise(resolve => setTimeout(resolve, 1200));
        const expanded = content
          .split('\n')
          .map(line => line.trim())
          .map(line => {
            if (line.startsWith('- ') || line.startsWith('• ')) {
              return `${line}\n  - Détail supplémentaire`;
            }
            return line;
          })
          .join('\n');
        return expanded;
      }
    },
    {
      id: 'translate',
      name: 'Traduire',
      description: 'Traduire le texte vers d\'autres langues',
      icon: 'translate',
      action: async (content: string) => {
        // Simulate AI API call
        await new Promise(resolve => setTimeout(resolve, 800));
        return `## Traduction (English)\n\n${content}\n\n*Note: Cette fonctionnalité nécessite une intégration avec un service de traduction.*`;
      }
    }
  ];

  // Analyze note content
  const analyzeNote = useCallback(async (content: string): Promise<AIAnalysis> => {
    setIsLoading(true);

    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      const words = content.split(/\s+/).filter(word => word.length > 0);
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

      // Simple sentiment analysis (mock)
      const positiveWords = ['bon', 'bien', 'excellent', 'super', 'génial', 'parfait'];
      const negativeWords = ['mauvais', 'mal', 'terrible', 'horrible', 'nul'];
      const contentLower = content.toLowerCase();
      const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;
      const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;

      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (positiveCount > negativeCount) sentiment = 'positive';
      if (negativeCount > positiveCount) sentiment = 'negative';

      // Simple topic extraction (mock)
      const topics: string[] = [];
      if (contentLower.includes('réunion')) topics.push('Réunion');
      if (contentLower.includes('projet')) topics.push('Projet');
      if (contentLower.includes('tâche') || contentLower.includes('todo')) topics.push('Tâches');
      if (contentLower.includes('idée')) topics.push('Brainstorming');

      // Extract action items
      const actionItems = content
        .split('\n')
        .filter(line => line.includes('[ ]') || line.includes('- [ ]'))
        .map(line => line.replace(/[*-]?\s*\[.\]\s*/g, '').trim())
        .filter(item => item.length > 0);

      // Determine complexity
      const avgSentenceLength = words.length / sentences.length;
      let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
      if (avgSentenceLength > 20) complexity = 'moderate';
      if (avgSentenceLength > 30) complexity = 'complex';

      const result: AIAnalysis = {
        summary: sentences.slice(0, 2).join('. ').trim() + '.',
        keyPoints: sentences.slice(0, 5).map(s => s.trim()).filter(s => s.length > 10),
        suggestedTags: topics,
        sentiment,
        complexity,
        topics: topics.length > 0 ? topics : ['Général'],
        actionItems
      };

      setAnalysis(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Execute AI action
  const executeAction = useCallback(async (actionId: string, content: string): Promise<string> => {
    const action = aiActions.find(a => a.id === actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    setIsLoading(true);
    try {
      return await action.action(content);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate title suggestion
  const suggestTitle = useCallback(async (content: string): Promise<string> => {
    setIsLoading(true);

    try {
      // Simulate AI title generation
      await new Promise(resolve => setTimeout(resolve, 800));

      const firstLine = content.split('\n')[0]?.trim();
      const words = content.split(/\s+/).filter(word => word.length > 3);

      if (firstLine && firstLine.length > 0 && firstLine.length < 50) {
        return firstLine;
      }

      const keyWords = words.slice(0, 3).join(' ');
      return keyWords.charAt(0).toUpperCase() + keyWords.slice(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Suggest tags
  const suggestTags = useCallback(async (content: string): Promise<string[]> => {
    setIsLoading(true);

    try {
      // Simulate AI tag suggestion
      await new Promise(resolve => setTimeout(resolve, 600));

      const contentLower = content.toLowerCase();
      const suggestedTags: string[] = [];

      if (contentLower.includes('réunion')) suggestedTags.push('réunion');
      if (contentLower.includes('travail')) suggestedTags.push('travail');
      if (contentLower.includes('projet')) suggestedTags.push('projet');
      if (contentLower.includes('idée')) suggestedTags.push('idée');
      if (contentLower.includes('tâche')) suggestedTags.push('tâche');
      if (contentLower.includes('important')) suggestedTags.push('important');
      if (contentLower.includes('urgent')) suggestedTags.push('urgent');

      return suggestedTags.slice(0, 5); // Limit to 5 tags
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    analysis,
    aiActions,
    analyzeNote,
    executeAction,
    suggestTitle,
    suggestTags,
  };
}
