/**
 * @fileoverview Processeur des outils de planification - Compatibilité avec l'ancien système
 * @deprecated Utilisez les modules dans ./planning/ à la place
 */

// Import depuis les nouveaux modules refactorisés
export {
  processCreateEvent,
  processCreateGoal,
  processDeleteEvent,
  processUpdateEvent,
  type CreateEventArgs,
  type CreateGoalArgs,
  type DeleteEventArgs,
  type UpdateEventArgs,
} from "./planning";
