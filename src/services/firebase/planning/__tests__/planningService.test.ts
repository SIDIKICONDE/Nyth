import './setup';
import { planningService } from '../index';
import eventsService from '../eventsService';
import { goalsService } from '../goalsService';
import { tasksService } from '../tasksService';
import { teamsService } from '../teamsService';
import { projectsService } from '../projectsService';
import { analyticsService } from '../analyticsService';
import { preferencesService } from '../preferencesService';
import { createMockEvent, createMockGoal, createMockTask, createMockTeam, createMockProject } from './setup';

// Mock les services individuels
jest.mock('../eventsService');
jest.mock('../goalsService');
jest.mock('../tasksService');
jest.mock('../teamsService');
jest.mock('../projectsService');
jest.mock('../analyticsService');
jest.mock('../preferencesService');

describe('PlanningService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('devrait retourner la même instance', () => {
      const instance1 = planningService;
      const instance2 = planningService;
      expect(instance1).toBe(instance2);
    });
  });

  describe('Gestion des événements', () => {
    it('devrait créer un événement', async () => {
      const mockEvent = createMockEvent();
      const eventId = 'new-event-id';
      (eventsService.createEvent as jest.Mock).mockResolvedValue(eventId);

      const result = await planningService.createEvent(mockEvent);

      expect(eventsService.createEvent).toHaveBeenCalledWith(mockEvent);
      expect(result).toBe(eventId);
    });

    it('devrait récupérer les événements d\'un utilisateur', async () => {
      const userId = 'test-user-id';
      const mockEvents = [createMockEvent(), createMockEvent({ id: 'event-2' })];
      (eventsService.getUserEvents as jest.Mock).mockResolvedValue(mockEvents);

      const result = await planningService.getUserEvents(userId);

      expect(eventsService.getUserEvents).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockEvents);
    });

    it('devrait mettre à jour un événement', async () => {
      const eventId = 'event-1';
      const updates = { title: 'Updated Event' };
      (eventsService.updateEvent as jest.Mock).mockResolvedValue(undefined);

      await planningService.updateEvent(eventId, updates);

      expect(eventsService.updateEvent).toHaveBeenCalledWith(eventId, updates);
    });

    it('devrait supprimer un événement', async () => {
      const eventId = 'event-1';
      (eventsService.deleteEvent as jest.Mock).mockResolvedValue(undefined);

      await planningService.deleteEvent(eventId);

      expect(eventsService.deleteEvent).toHaveBeenCalledWith(eventId);
    });

    it('devrait s\'abonner aux changements d\'événements', () => {
      const userId = 'test-user-id';
      const callback = jest.fn();
      const unsubscribe = jest.fn();
      (eventsService.onEventsChange as jest.Mock).mockReturnValue(unsubscribe);

      const result = planningService.subscribeToUserEvents(userId, callback);

      expect(eventsService.onEventsChange).toHaveBeenCalledWith(userId, callback);
      expect(result).toBe(unsubscribe);
    });
  });

  describe('Gestion des objectifs', () => {
    it('devrait créer un objectif', async () => {
      const mockGoal = createMockGoal();
      const goalId = 'new-goal-id';
      (goalsService.createGoal as jest.Mock).mockResolvedValue(goalId);

      const result = await planningService.createGoal(mockGoal);

      expect(goalsService.createGoal).toHaveBeenCalledWith(mockGoal);
      expect(result).toBe(goalId);
    });

    it('devrait récupérer les objectifs d\'un utilisateur', async () => {
      const userId = 'test-user-id';
      const mockGoals = [createMockGoal(), createMockGoal({ id: 'goal-2' })];
      (goalsService.getUserGoals as jest.Mock).mockResolvedValue(mockGoals);

      const result = await planningService.getUserGoals(userId);

      expect(goalsService.getUserGoals).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockGoals);
    });

    it('devrait mettre à jour un objectif', async () => {
      const goalId = 'goal-1';
      const updates = { title: 'Updated Goal' };
      (goalsService.updateGoal as jest.Mock).mockResolvedValue(undefined);

      await planningService.updateGoal(goalId, updates);

      expect(goalsService.updateGoal).toHaveBeenCalledWith(goalId, updates);
    });

    it('devrait supprimer un objectif', async () => {
      const goalId = 'goal-1';
      (goalsService.deleteGoal as jest.Mock).mockResolvedValue(undefined);

      await planningService.deleteGoal(goalId);

      expect(goalsService.deleteGoal).toHaveBeenCalledWith(goalId);
    });

    it('devrait mettre à jour la progression d\'un objectif', async () => {
      const goalId = 'goal-1';
      const progress = 75;
      (goalsService.updateGoalProgress as jest.Mock).mockResolvedValue(undefined);

      await planningService.updateGoalProgress(goalId, progress);

      expect(goalsService.updateGoalProgress).toHaveBeenCalledWith(goalId, progress);
    });

    it('devrait archiver un objectif', async () => {
      const goalId = 'goal-1';
      (goalsService.archiveGoal as jest.Mock).mockResolvedValue(undefined);

      await planningService.archiveGoal(goalId);

      expect(goalsService.archiveGoal).toHaveBeenCalledWith(goalId);
    });

    it('devrait récupérer les statistiques d\'un objectif', async () => {
      const goalId = 'goal-1';
      const mockStats = { completionRate: 75, averageProgress: 50 };
      (goalsService.getGoalStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await planningService.getGoalStats(goalId);

      expect(goalsService.getGoalStats).toHaveBeenCalledWith(goalId);
      expect(result).toEqual(mockStats);
    });

    it('devrait s\'abonner aux changements d\'objectifs', () => {
      const userId = 'test-user-id';
      const callback = jest.fn();
      const unsubscribe = jest.fn();
      (goalsService.subscribeToUserGoals as jest.Mock).mockReturnValue(unsubscribe);

      const result = planningService.subscribeToUserGoals(userId, callback);

      expect(goalsService.subscribeToUserGoals).toHaveBeenCalledWith(userId, callback);
      expect(result).toBe(unsubscribe);
    });
  });

  describe('Gestion des tâches', () => {
    it('devrait créer une tâche', async () => {
      const mockTask = createMockTask();
      const taskId = 'new-task-id';
      (tasksService.createTask as jest.Mock).mockResolvedValue(taskId);

      const result = await planningService.createTask(mockTask);

      expect(tasksService.createTask).toHaveBeenCalledWith(mockTask);
      expect(result).toBe(taskId);
    });

    it('devrait mettre à jour une tâche', async () => {
      const taskId = 'task-1';
      const updates = { title: 'Updated Task', status: 'in_progress' };
      (tasksService.updateTask as jest.Mock).mockResolvedValue(undefined);

      await planningService.updateTask(taskId, updates);

      expect(tasksService.updateTask).toHaveBeenCalledWith(taskId, updates);
    });

    it('devrait supprimer une tâche', async () => {
      const taskId = 'task-1';
      (tasksService.deleteTask as jest.Mock).mockResolvedValue(undefined);

      await planningService.deleteTask(taskId);

      expect(tasksService.deleteTask).toHaveBeenCalledWith(taskId);
    });

    it('devrait récupérer les tâches par statut', async () => {
      const userId = 'test-user-id';
      const status = 'in_progress';
      const mockTasks = [
        createMockTask({ status: 'in_progress' }),
        createMockTask({ id: 'task-2', status: 'in_progress' })
      ];
      (tasksService.getTasksByStatus as jest.Mock).mockResolvedValue(mockTasks);

      const result = await planningService.getTasksByStatus(userId, status);

      expect(tasksService.getTasksByStatus).toHaveBeenCalledWith(userId, status);
      expect(result).toEqual(mockTasks);
    });

    it('devrait s\'abonner aux changements de tâches', () => {
      const userId = 'test-user-id';
      const callback = jest.fn();
      const unsubscribe = jest.fn();
      (tasksService.subscribeToUserTasks as jest.Mock).mockReturnValue(unsubscribe);

      const result = planningService.subscribeToUserTasks(userId, callback);

      expect(tasksService.subscribeToUserTasks).toHaveBeenCalledWith(userId, callback);
      expect(result).toBe(unsubscribe);
    });
  });

  describe('Gestion des équipes', () => {
    it('devrait créer une équipe', async () => {
      const mockTeam = createMockTeam();
      const teamId = 'new-team-id';
      (teamsService.createTeam as jest.Mock).mockResolvedValue(teamId);

      const result = await planningService.createTeam(mockTeam);

      expect(teamsService.createTeam).toHaveBeenCalledWith(mockTeam);
      expect(result).toBe(teamId);
    });

    it('devrait récupérer les équipes d\'un utilisateur', async () => {
      const userId = 'test-user-id';
      const mockTeams = [createMockTeam(), createMockTeam({ id: 'team-2' })];
      (teamsService.getUserTeams as jest.Mock).mockResolvedValue(mockTeams);

      const result = await planningService.getUserTeams(userId);

      expect(teamsService.getUserTeams).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockTeams);
    });
  });

  describe('Gestion des projets', () => {
    it('devrait créer un projet', async () => {
      const mockProject = createMockProject();
      const projectId = 'new-project-id';
      (projectsService.createProject as jest.Mock).mockResolvedValue(projectId);

      const result = await planningService.createProject(mockProject);

      expect(projectsService.createProject).toHaveBeenCalledWith(mockProject);
      expect(result).toBe(projectId);
    });

    it('devrait récupérer les projets d\'un utilisateur', async () => {
      const userId = 'test-user-id';
      const mockProjects = [createMockProject(), createMockProject({ id: 'project-2' })];
      (projectsService.getUserProjects as jest.Mock).mockResolvedValue(mockProjects);

      const result = await planningService.getUserProjects(userId);

      expect(projectsService.getUserProjects).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockProjects);
    });
  });

  describe('Analytics', () => {
    it('devrait calculer les analytics de planification', async () => {
      const userId = 'test-user-id';
      const period = 'month';
      const mockAnalytics = {
        userId,
        period,
        eventsCompleted: 10,
        eventsPlanned: 15,
        completionRate: 66.67,
        goalsActive: 3,
        goalsCompleted: 2,
        goalCompletionRate: 40,
        tasksCompleted: 25,
        tasksActive: 10,
        taskCompletionRate: 71.43,
        averageTaskDuration: 2.5,
        plannedHours: 80,
        actualHours: 75,
        efficiencyRate: 93.75,
        trends: [],
        insights: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      (analyticsService.calculatePlanningAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);

      const result = await planningService.calculatePlanningAnalytics(userId, period);

      expect(analyticsService.calculatePlanningAnalytics).toHaveBeenCalledWith(userId, period);
      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('Préférences', () => {
    it('devrait sauvegarder les préférences de planification', async () => {
      const userId = 'test-user-id';
      const preferences = {
        defaultView: 'calendar' as const,
        enableNotifications: true,
        theme: 'dark' as const,
      };
      (preferencesService.savePlanningPreferences as jest.Mock).mockResolvedValue(undefined);

      await planningService.savePlanningPreferences(userId, preferences);

      expect(preferencesService.savePlanningPreferences).toHaveBeenCalledWith(userId, preferences);
    });

    it('devrait récupérer les préférences de planification', async () => {
      const userId = 'test-user-id';
      const mockPreferences = {
        userId,
        defaultView: 'kanban' as const,
        calendarStartDay: 1 as const,
        enableNotifications: true,
        defaultReminders: [],
        notificationSound: true,
        workingHours: {},
        timezone: 'Europe/Paris',
        theme: 'light' as const,
        accentColor: '#007AFF',
        showWeekends: true,
        syncWithCalendar: false,
        showGoalProgress: true,
        goalNotifications: true,
        showTaskProgress: true,
        taskNotifications: true,
        kanbanColumns: [],
        updatedAt: new Date().toISOString(),
      };
      (preferencesService.getPlanningPreferences as jest.Mock).mockResolvedValue(mockPreferences);

      const result = await planningService.getPlanningPreferences(userId);

      expect(preferencesService.getPlanningPreferences).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockPreferences);
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait propager les erreurs du service d\'événements', async () => {
      const error = new Error('Event creation failed');
      (eventsService.createEvent as jest.Mock).mockRejectedValue(error);

      await expect(planningService.createEvent(createMockEvent())).rejects.toThrow('Event creation failed');
    });

    it('devrait propager les erreurs du service de tâches', async () => {
      const error = new Error('Task update failed');
      (tasksService.updateTask as jest.Mock).mockRejectedValue(error);

      await expect(planningService.updateTask('task-1', {})).rejects.toThrow('Task update failed');
    });

    it('devrait propager les erreurs du service d\'objectifs', async () => {
      const error = new Error('Goal deletion failed');
      (goalsService.deleteGoal as jest.Mock).mockRejectedValue(error);

      await expect(planningService.deleteGoal('goal-1')).rejects.toThrow('Goal deletion failed');
    });
  });
});