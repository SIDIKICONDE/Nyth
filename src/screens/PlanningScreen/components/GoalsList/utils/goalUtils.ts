import { Goal } from "../../../../../types/planning";
import { PRIORITY_COLORS, PRIORITY_ICONS } from "../constants";

export const goalUtils = {
  /**
   * Obtenir la couleur de priorité d'un objectif
   */
  getPriorityColor: (priority: Goal["priority"]): string => {
    return PRIORITY_COLORS[priority] || PRIORITY_COLORS.low;
  },

  /**
   * Obtenir l'icône de priorité d'un objectif
   */
  getPriorityIcon: (priority: Goal["priority"]): string => {
    return PRIORITY_ICONS[priority] || PRIORITY_ICONS.low;
  },

  /**
   * Calculer la nouvelle valeur de progression pour l'incrémentation
   */
  calculateIncrement: (goal: Goal): number => {
    return Math.min(goal.current + 1, goal.target);
  },

  /**
   * Calculer la nouvelle valeur de progression pour la décrémentation
   */
  calculateDecrement: (goal: Goal): number => {
    return Math.max(goal.current - 1, 0);
  },

  /**
   * Vérifier si un objectif peut être marqué comme accompli
   */
  canMarkComplete: (goal: Goal): boolean => {
    return goal.status === "active" && goal.progress >= 100;
  },

  /**
   * Vérifier si un objectif peut être réactivé
   */
  canReactivate: (goal: Goal): boolean => {
    return goal.status === "completed";
  },

  /**
   * Obtenir l'icône d'état d'un objectif
   */
  getStatusIcon: (goal: Goal): string => {
    if (goal.status === "completed") {
      return "✅";
    }
    return goalUtils.getPriorityIcon(goal.priority);
  },

  /**
   * Vérifier si les actions rapides doivent être affichées
   */
  shouldShowQuickActions: (goal: Goal): boolean => {
    return goal.status === "active";
  },

  /**
   * Formater le texte de progression
   */
  formatProgress: (goal: Goal): string => {
    return `${goal.current}/${goal.target} ${goal.unit}`;
  },
};
