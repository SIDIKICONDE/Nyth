// Services
export { AnalyticsService, analyticsService } from "./analyticsService";
export { default as eventsService } from "./eventsService";
export { GoalsService, goalsService } from "./goalsService";
export { PreferencesService, preferencesService } from "./preferencesService";
export { ProjectsService, projectsService } from "./projectsService";
export { tasksService } from "./tasksService";
export { TeamsService, teamsService } from "./teamsService";

// Contextes IA
export {
  getPlanningContextForAI,
  getVideosContextForAI,
} from "./contextService";

// Types
export * from "./types";

// Service principal unifié
import { createLogger } from "../../../utils/optimizedLogger";
import { analyticsService } from "./analyticsService";
import eventsService from "./eventsService";
import { goalsService } from "./goalsService";
import { preferencesService } from "./preferencesService";
import { projectsService } from "./projectsService";
import { tasksService } from "./tasksService";
import { teamsService } from "./teamsService";

const logger = createLogger("PlanningService");

/**
 * Service principal de planification unifié
 * Combine tous les sous-services pour une interface simple
 */
class PlanningService {
  private static instance: PlanningService;

  private constructor() {}

  static getInstance(): PlanningService {
    if (!PlanningService.instance) {
      PlanningService.instance = new PlanningService();
    }
    return PlanningService.instance;
  }

  // ===== ÉVÉNEMENTS =====
  async createEvent(...args: Parameters<typeof eventsService.createEvent>) {
    return eventsService.createEvent(...args);
  }

  async getUserEvents(...args: Parameters<typeof eventsService.getUserEvents>) {
    return eventsService.getUserEvents(...args);
  }

  async updateEvent(...args: Parameters<typeof eventsService.updateEvent>) {
    return eventsService.updateEvent(...args);
  }

  async deleteEvent(...args: Parameters<typeof eventsService.deleteEvent>) {
    return eventsService.deleteEvent(...args);
  }

  subscribeToUserEvents(
    ...args: Parameters<typeof eventsService.onEventsChange>
  ) {
    return eventsService.onEventsChange(...args);
  }

  // ===== OBJECTIFS =====
  async createGoal(...args: Parameters<typeof goalsService.createGoal>) {
    return goalsService.createGoal(...args);
  }

  async getUserGoals(...args: Parameters<typeof goalsService.getUserGoals>) {
    return goalsService.getUserGoals(...args);
  }

  async updateGoal(...args: Parameters<typeof goalsService.updateGoal>) {
    return goalsService.updateGoal(...args);
  }

  async deleteGoal(...args: Parameters<typeof goalsService.deleteGoal>) {
    return goalsService.deleteGoal(...args);
  }

  async updateGoalProgress(
    ...args: Parameters<typeof goalsService.updateGoalProgress>
  ) {
    return goalsService.updateGoalProgress(...args);
  }

  async archiveGoal(...args: Parameters<typeof goalsService.archiveGoal>) {
    return goalsService.archiveGoal(...args);
  }

  async getGoalStats(...args: Parameters<typeof goalsService.getGoalStats>) {
    return goalsService.getGoalStats(...args);
  }

  subscribeToUserGoals(
    ...args: Parameters<typeof goalsService.subscribeToUserGoals>
  ) {
    return goalsService.subscribeToUserGoals(...args);
  }

  // ===== TASKS =====
  async createTask(...args: Parameters<typeof tasksService.createTask>) {
    return tasksService.createTask(...args);
  }

  async updateTask(...args: Parameters<typeof tasksService.updateTask>) {
    return tasksService.updateTask(...args);
  }

  async deleteTask(...args: Parameters<typeof tasksService.deleteTask>) {
    return tasksService.deleteTask(...args);
  }

  async getTasksByStatus(
    ...args: Parameters<typeof tasksService.getTasksByStatus>
  ) {
    return tasksService.getTasksByStatus(...args);
  }

  subscribeToUserTasks(
    ...args: Parameters<typeof tasksService.subscribeToUserTasks>
  ) {
    return tasksService.subscribeToUserTasks(...args);
  }

  // ===== ÉQUIPES =====
  async createTeam(...args: Parameters<typeof teamsService.createTeam>) {
    return teamsService.createTeam(...args);
  }

  async getUserTeams(...args: Parameters<typeof teamsService.getUserTeams>) {
    return teamsService.getUserTeams(...args);
  }

  // ===== PROJETS =====
  async createProject(
    ...args: Parameters<typeof projectsService.createProject>
  ) {
    return projectsService.createProject(...args);
  }

  async getUserProjects(
    ...args: Parameters<typeof projectsService.getUserProjects>
  ) {
    return projectsService.getUserProjects(...args);
  }

  // ===== ANALYTICS =====
  async calculatePlanningAnalytics(
    ...args: Parameters<typeof analyticsService.calculatePlanningAnalytics>
  ) {
    return analyticsService.calculatePlanningAnalytics(...args);
  }

  // ===== PRÉFÉRENCES =====
  async savePlanningPreferences(
    ...args: Parameters<typeof preferencesService.savePlanningPreferences>
  ) {
    return preferencesService.savePlanningPreferences(...args);
  }

  async getPlanningPreferences(
    ...args: Parameters<typeof preferencesService.getPlanningPreferences>
  ) {
    return preferencesService.getPlanningPreferences(...args);
  }
}

export const planningService = PlanningService.getInstance();
