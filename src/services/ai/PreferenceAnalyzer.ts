import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIPrompt } from '../../types/ai';

/**
 * Interface pour un enregistrement d'historique de génération
 */
interface GenerationHistoryEntry {
  prompt: AIPrompt;
  timestamp: number;
  wasAccepted: boolean;
  scriptId?: string;
}

/**
 * Interface pour les préférences utilisateur
 */
interface UserAIPreferences {
  preferredTones: string[];
  preferredPlatforms: string[];
  mostSuccessfulTones: string[];
  preferredLanguages: string[];
  averageCreativity: number;
  lastUsed: {
    tone?: string;
    platform?: string;
    language?: string;
    creativity?: number;
    narrativeStructure?: string;
    emotionalTone?: string;
  };
}

/**
 * Service d'analyse des préférences pour l'IA
 * Enregistre et analyse l'historique des générations pour
 * fournir des suggestions personnalisées à l'utilisateur
 */
export class PreferenceAnalyzer {
  
  /**
   * Enregistre une utilisation de génération de script
   * @param prompt Le prompt utilisé
   * @param wasAccepted Si le script a été accepté par l'utilisateur
   * @param scriptId ID du script (optionnel)
   */
  static async recordGenerationUsage(
    prompt: AIPrompt, 
    wasAccepted: boolean,
    scriptId?: string
  ): Promise<void> {
    try {
      // Récupérer l'historique existant
      const historyStr = await AsyncStorage.getItem('ai_generation_history');
      const history: GenerationHistoryEntry[] = historyStr 
        ? JSON.parse(historyStr) 
        : [];

      // Ajouter cette génération à l'historique
      history.push({
        prompt,
        timestamp: Date.now(),
        wasAccepted,
        scriptId
      });

      // Limiter l'historique aux 50 dernières entrées
      const trimmedHistory = history.slice(-50);

      // Sauvegarder l'historique mis à jour
      await AsyncStorage.setItem('ai_generation_history', JSON.stringify(trimmedHistory));

      // Analyser les préférences
      await this.analyzePreferences(trimmedHistory);
    } catch (error) {}
  }
  
  /**
   * Analyse l'historique des générations pour identifier les préférences
   * @param history Historique des générations
   */
  private static async analyzePreferences(history: GenerationHistoryEntry[]): Promise<void> {
    try {
      // Initialiser les compteurs
      const toneFrequency: Record<string, number> = {};
      const platformFrequency: Record<string, number> = {};
      const languageFrequency: Record<string, number> = {};
      const narrativeStructureFrequency: Record<string, number> = {};
      const emotionalToneFrequency: Record<string, number> = {};
      const acceptedTones: string[] = [];
      let creativitySum = 0;
      let creativityCount = 0;
      
      // Récupérer le dernier élément utilisé
      const lastEntry = history.length > 0 ? history[history.length - 1] : null;
      const lastUsed = lastEntry ? {
        tone: lastEntry.prompt.tone,
        platform: lastEntry.prompt.platform,
        language: lastEntry.prompt.language,
        creativity: lastEntry.prompt.creativity,
        narrativeStructure: lastEntry.prompt.narrativeStructure,
        emotionalTone: lastEntry.prompt.emotionalTone,
      } : {};
      
      // Analyser l'historique
      history.forEach(entry => {
        const { prompt } = entry;
        
        // Compter la fréquence des tons
        if (prompt.tone) {
          toneFrequency[prompt.tone] = (toneFrequency[prompt.tone] || 0) + 1;
        }
        
        // Compter la fréquence des plateformes
        if (prompt.platform) {
          platformFrequency[prompt.platform] = (platformFrequency[prompt.platform] || 0) + 1;
        }
        
        // Compter la fréquence des langues
        if (prompt.language) {
          languageFrequency[prompt.language] = (languageFrequency[prompt.language] || 0) + 1;
        }
        
        // Compter la fréquence des structures narratives
        if (prompt.narrativeStructure) {
          narrativeStructureFrequency[prompt.narrativeStructure] = 
            (narrativeStructureFrequency[prompt.narrativeStructure] || 0) + 1;
        }
        
        // Compter la fréquence des tons émotionnels
        if (prompt.emotionalTone) {
          emotionalToneFrequency[prompt.emotionalTone] = 
            (emotionalToneFrequency[prompt.emotionalTone] || 0) + 1;
        }
        
        // Collecter les tons acceptés
        if (entry.wasAccepted && prompt.tone) {
          acceptedTones.push(prompt.tone);
        }
        
        // Calculer la moyenne de créativité
        if (prompt.creativity !== undefined) {
          creativitySum += prompt.creativity;
          creativityCount++;
        }
      });
      
      // Calculer la créativité moyenne
      const averageCreativity = creativityCount > 0 
        ? creativitySum / creativityCount 
        : 0.7; // Valeur par défaut
      
      // Construire l'objet de préférences
      const preferences: UserAIPreferences = {
        preferredTones: this.getTopN(toneFrequency, 3),
        preferredPlatforms: this.getTopN(platformFrequency, 2),
        mostSuccessfulTones: this.getMostFrequent(acceptedTones, 2),
        preferredLanguages: this.getTopN(languageFrequency, 2),
        averageCreativity,
        lastUsed
      };
      
      // Sauvegarder les préférences
      await AsyncStorage.setItem('user_ai_preferences', JSON.stringify(preferences));
    } catch (error) {}
  }
  
  /**
   * Obtient les N éléments les plus fréquents d'un objet de fréquence
   * @param frequencyObj Objet de fréquence
   * @param n Nombre d'éléments à retourner
   * @returns Les N éléments les plus fréquents
   */
  private static getTopN(frequencyObj: Record<string, number>, n: number): string[] {
    return Object.entries(frequencyObj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key]) => key);
  }
  
  /**
   * Obtient les N éléments les plus fréquents d'un tableau
   * @param arr Tableau d'éléments
   * @param n Nombre d'éléments à retourner
   * @returns Les N éléments les plus fréquents
   */
  private static getMostFrequent(arr: string[], n: number): string[] {
    const frequency: Record<string, number> = {};
    
    arr.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    
    return this.getTopN(frequency, n);
  }
  
  /**
   * Récupère les paramètres suggérés basés sur les préférences de l'utilisateur
   * @returns Paramètres suggérés pour un nouveau prompt
   */
  static async getSuggestedParameters(): Promise<Partial<AIPrompt>> {
    try {
      const preferencesStr = await AsyncStorage.getItem('user_ai_preferences');
      
      if (!preferencesStr) {
        return {}; // Aucune préférence enregistrée
      }
      
      const preferences = JSON.parse(preferencesStr) as UserAIPreferences;
      
      // Construire les suggestions basées sur les préférences
      return {
        tone: preferences.preferredTones[0] as AIPrompt['tone'] || preferences.lastUsed.tone as AIPrompt['tone'],
        platform: preferences.preferredPlatforms[0] as AIPrompt['platform'] || preferences.lastUsed.platform as AIPrompt['platform'],
        language: preferences.preferredLanguages[0] as AIPrompt['language'] || preferences.lastUsed.language as AIPrompt['language'],
        creativity: preferences.averageCreativity,
        narrativeStructure: preferences.lastUsed.narrativeStructure as AIPrompt['narrativeStructure'],
        emotionalTone: preferences.lastUsed.emotionalTone as AIPrompt['emotionalTone'],
      };
    } catch (error) {
      return {};
    }
  }
  
  /**
   * Récupère l'historique complet des générations
   * @returns L'historique des générations
   */
  static async getGenerationHistory(): Promise<GenerationHistoryEntry[]> {
    try {
      const historyStr = await AsyncStorage.getItem('ai_generation_history');
      return historyStr ? JSON.parse(historyStr) : [];
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Efface l'historique des générations et les préférences
   */
  static async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem('ai_generation_history');
      await AsyncStorage.removeItem('user_ai_preferences');
    } catch (error) {
      throw new Error('Impossible d\'effacer l\'historique IA.');
    }
  }
} 