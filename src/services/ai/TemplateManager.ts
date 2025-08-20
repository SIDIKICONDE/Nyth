import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIPrompt } from '../../types/ai';
import { AIService } from './AIService';

/**
 * Interface pour un template de script
 */
export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  structure: string[];
  systemPrompt: string;
  userPromptTemplate: string;
  icon?: string; // Emoji pour l'icône
  category?: 'general' | 'social' | 'business' | 'educational' | 'creative';
  isDefault?: boolean; // True pour les templates par défaut
}

/**
 * Templates par défaut
 */
const DEFAULT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'hook-content-cta',
    name: 'Accroche + Contenu + Appel à l\'action',
    description: 'Structure classique avec une accroche forte, du contenu de valeur et un appel à l\'action clair',
    icon: '🔥',
    category: 'general',
    isDefault: true,
    structure: ['hook', 'content', 'cta'],
    systemPrompt: `Tu es un expert en création de scripts vidéo. Crée un script avec cette structure:
1. ACCROCHE (15%): Une introduction captivante qui attire l'attention
2. CONTENU (70%): Le contenu principal du sujet
3. APPEL À L'ACTION (15%): Une conclusion avec un appel à l'action clair`,
    userPromptTemplate: `Crée un script sur "{{topic}}" suivant la structure accroche-contenu-cta. Le script doit être facile à lire à voix haute, avec des phrases courtes et un ton naturel.`
  },
  {
    id: 'problem-solution-proof',
    name: 'Problème + Solution + Preuve',
    description: 'Présente un problème, propose une solution et fournit des preuves',
    icon: '💡',
    category: 'business',
    isDefault: true,
    structure: ['problem', 'solution', 'proof'],
    systemPrompt: `Tu es un expert en scripts de type problème-solution. Crée un script avec cette structure:
1. PROBLÈME (25%): Identifie clairement un problème que rencontre le public
2. SOLUTION (50%): Présente une solution au problème
3. PREUVE (25%): Fournis des preuves que la solution fonctionne`,
    userPromptTemplate: `Crée un script sur "{{topic}}" avec la structure problème-solution-preuve. Le script doit être convaincant et centré sur l'auditoire.`
  },
  {
    id: 'storytelling',
    name: 'Narration (Storytelling)',
    description: 'Script basé sur une histoire captivante avec une morale ou leçon',
    icon: '📚',
    category: 'creative',
    isDefault: true,
    structure: ['setup', 'conflict', 'resolution'],
    systemPrompt: `Tu es un expert en storytelling. Crée un script narratif avec cette structure:
1. MISE EN PLACE (30%): Introduis les personnages, le contexte
2. CONFLIT (40%): Présente un défi ou problème à surmonter
3. RÉSOLUTION (30%): Résous le conflit avec une leçon à retenir`,
    userPromptTemplate: `Crée un script narratif sur "{{topic}}" qui raconte une histoire captivante avec une leçon claire à la fin.`
  },
  {
    id: 'tutorial',
    name: 'Tutoriel pas-à-pas',
    description: 'Instructions étape par étape pour apprendre quelque chose',
    icon: '📝',
    category: 'educational',
    isDefault: true,
    structure: ['intro', 'steps', 'conclusion'],
    systemPrompt: `Tu es un expert en tutoriels vidéo. Crée un script de tutoriel avec cette structure:
1. INTRODUCTION (15%): Présente le sujet et les objectifs d'apprentissage
2. ÉTAPES (75%): Instructions détaillées étape par étape
3. CONCLUSION (10%): Récapitule les points clés et encourage la pratique`,
    userPromptTemplate: `Crée un tutoriel pas-à-pas sur "{{topic}}". Assure-toi que les étapes sont claires, concises et faciles à suivre.`
  },
  {
    id: 'review',
    name: 'Avis & Critique',
    description: 'Évaluation objective d\'un produit, service ou contenu',
    icon: '⭐',
    category: 'general',
    isDefault: true,
    structure: ['intro', 'positives', 'negatives', 'verdict'],
    systemPrompt: `Tu es un expert en critiques vidéo. Crée un script d'avis avec cette structure:
1. INTRODUCTION (15%): Présente ce qui est évalué
2. POINTS POSITIFS (35%): Discute des aspects positifs
3. POINTS NÉGATIFS (35%): Discute des aspects négatifs
4. VERDICT (15%): Donne une conclusion équilibrée et une recommandation`,
    userPromptTemplate: `Crée un script d'avis sur "{{topic}}". Assure-toi d'être équilibré, honnête et informatif dans ton évaluation.`
  }
];

/**
 * Gestionnaire de templates pour les scripts
 */
export class TemplateManager {
  /**
   * Sauvegarde un template personnalisé
   * @param template Le template à sauvegarder
   */
  static async saveTemplate(template: ScriptTemplate): Promise<void> {
    try {
      const templates = await this.getTemplates();

      // Vérifier si c'est une mise à jour ou une création
      const existingIndex = templates.findIndex(t => t.id === template.id);

      if (existingIndex >= 0) {
        // Mise à jour d'un template existant
        templates[existingIndex] = {
          ...templates[existingIndex],
          ...template,
          isDefault: templates[existingIndex].isDefault // Préserver le statut par défaut
        };
      } else {
        // Création d'un nouveau template
        templates.push({
          ...template,
          id: template.id || `template-${Date.now()}`,
          isDefault: false
        });
      }

      // Sauvegarder la liste mise à jour
      await AsyncStorage.setItem('script_templates', JSON.stringify(templates));
    } catch (error) {
      throw new Error('Impossible de sauvegarder le template.');
    }
  }

  /**
   * Récupère tous les templates (par défaut + personnalisés)
   * @returns Liste des templates
   */
  static async getTemplates(): Promise<ScriptTemplate[]> {
    try {
      const templatesStr = await AsyncStorage.getItem('script_templates');
      
      // Si aucun template sauvegardé, retourner les templates par défaut
      if (!templatesStr) {
        return DEFAULT_TEMPLATES;
      }
      
      // Fusionner les templates sauvegardés avec les templates par défaut
      const savedTemplates = JSON.parse(templatesStr) as ScriptTemplate[];
      
      // Filtrer les templates par défaut qui n'existent pas déjà dans les templates sauvegardés
      const defaultTemplatesToAdd = DEFAULT_TEMPLATES.filter(
        defaultTemplate => !savedTemplates.some(
          savedTemplate => savedTemplate.id === defaultTemplate.id
        )
      );
      
      return [...savedTemplates, ...defaultTemplatesToAdd];
    } catch (error) {
      return DEFAULT_TEMPLATES;
    }
  }

  /**
   * Supprime un template personnalisé
   * @param templateId ID du template à supprimer
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    try {
      const templates = await this.getTemplates();

      // Vérifier si c'est un template par défaut
      const templateToDelete = templates.find(t => t.id === templateId);

      if (templateToDelete?.isDefault) {
        throw new Error('Impossible de supprimer un template par défaut.');
      }

      // Filtrer le template à supprimer
      const updatedTemplates = templates.filter(t => t.id !== templateId);

      // Sauvegarder la liste mise à jour
      await AsyncStorage.setItem('script_templates', JSON.stringify(updatedTemplates));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Génère un script à partir d'un template
   * @param templateId ID du template à utiliser
   * @param topic Sujet du script
   * @param options Options supplémentaires pour le prompt
   */
  static async generateFromTemplate(
    templateId: string, 
    topic: string, 
    options: Partial<AIPrompt> = {}
  ): Promise<string> {
    try {
      const templates = await this.getTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error(`Template non trouvé: ${templateId}`);
      }
      
      // Remplacer les variables dans le template
      const userPrompt = template.userPromptTemplate.replace('{{topic}}', topic);
      
      // Générer le script avec le service AI
      const result = await AIService.generateWithCustomPrompt(
        template.systemPrompt,
        userPrompt,
        options
      );
      
      return result;
    } catch (error) {
      throw new Error('Impossible de générer le script à partir du template.');
    }
  }
} 