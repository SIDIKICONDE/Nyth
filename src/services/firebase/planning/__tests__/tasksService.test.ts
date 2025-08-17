import './setup';
import { tasksService } from '../tasksService';
import { createMockTask } from './setup';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  Timestamp,
} from '@react-native-firebase/firestore';

// Mock Firestore functions
jest.mock('@react-native-firebase/firestore');

describe('TasksService', () => {
  const mockDb = {};
  const mockCollection = jest.fn();
  const mockDoc = jest.fn();
  const mockQuery = jest.fn();
  const mockWhere = jest.fn();
  const mockOrderBy = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getFirestore as jest.Mock).mockReturnValue(mockDb);
    (collection as jest.Mock).mockImplementation(mockCollection);
    (doc as jest.Mock).mockImplementation(mockDoc);
    (query as jest.Mock).mockImplementation(mockQuery);
    (where as jest.Mock).mockImplementation(mockWhere);
    (orderBy as jest.Mock).mockImplementation(mockOrderBy);
  });

  describe('createTask', () => {
    it('devrait créer une nouvelle tâche avec succès', async () => {
      const mockTask = createMockTask();
      const { id, createdAt, updatedAt, ...taskData } = mockTask;
      const mockDocRef = { id: 'new-task-id' };
      
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('tasks-collection');

      const result = await tasksService.createTask(taskData);

      expect(getFirestore).toHaveBeenCalled();
      expect(collection).toHaveBeenCalledWith(mockDb, 'tasks');
      expect(addDoc).toHaveBeenCalledWith(
        'tasks-collection',
        expect.objectContaining({
          ...taskData,
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object),
        })
      );
      expect(result).toBe('new-task-id');
    });

    it('devrait convertir les dates en Timestamps Firebase', async () => {
      const taskWithDates = createMockTask({
        dueDate: new Date('2024-12-31'),
        startDate: new Date('2024-01-01'),
      });
      const { id, createdAt, updatedAt, ...taskData } = taskWithDates;
      const mockDocRef = { id: 'new-task-id' };
      
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (Timestamp.fromDate as jest.Mock).mockImplementation((date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
      }));

      await tasksService.createTask(taskData);

      expect(Timestamp.fromDate).toHaveBeenCalledWith(taskData.dueDate);
      expect(Timestamp.fromDate).toHaveBeenCalledWith(taskData.startDate);
    });

    it('devrait gérer les erreurs lors de la création', async () => {
      const mockTask = createMockTask();
      const { id, createdAt, updatedAt, ...taskData } = mockTask;
      const error = new Error('Firestore error');
      
      (addDoc as jest.Mock).mockRejectedValue(error);

      await expect(tasksService.createTask(taskData)).rejects.toThrow('Firestore error');
    });

    it('devrait nettoyer les champs undefined', async () => {
      const taskWithUndefined = {
        userId: 'test-user-id',
        title: 'Test Task',
        status: 'todo' as const,
        priority: 'medium' as const,
        description: undefined,
        tags: [],
        dependencies: [],
        blockedBy: [],
      };
      const mockDocRef = { id: 'new-task-id' };
      
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      await tasksService.createTask(taskWithUndefined);

      const addDocCall = (addDoc as jest.Mock).mock.calls[0][1];
      expect(addDocCall).not.toHaveProperty('description');
    });
  });

  describe('getTasksByUser', () => {
    it('devrait récupérer toutes les tâches d\'un utilisateur', async () => {
      const userId = 'test-user-id';
      const mockTasks = [
        createMockTask(),
        createMockTask({ id: 'task-2', title: 'Task 2' }),
      ];
      const mockSnapshot = {
        docs: mockTasks.map(task => ({
          id: task.id,
          data: () => ({ ...task, id: undefined }),
        })),
      };

      mockQuery.mockReturnValue('query-object');
      mockWhere.mockReturnValue('where-clause');
      mockOrderBy.mockReturnValue('order-clause');
      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const result = await tasksService.getTasksByUser(userId);

      expect(collection).toHaveBeenCalledWith(mockDb, 'tasks');
      expect(where).toHaveBeenCalledWith('userId', '==', userId);
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(getDocs).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('task-1');
      expect(result[1].id).toBe('task-2');
    });

    it('devrait convertir les Timestamps en Dates', async () => {
      const userId = 'test-user-id';
      const mockTimestamp = {
        toDate: () => new Date('2024-01-01'),
      };
      const mockSnapshot = {
        docs: [{
          id: 'task-1',
          data: () => ({
            title: 'Test Task',
            createdAt: mockTimestamp,
            updatedAt: mockTimestamp,
            dueDate: mockTimestamp,
          }),
        }],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const result = await tasksService.getTasksByUser(userId);

      expect(result[0].createdAt).toEqual(new Date('2024-01-01'));
      expect(result[0].updatedAt).toEqual(new Date('2024-01-01'));
      expect(result[0].dueDate).toEqual(new Date('2024-01-01'));
    });

    it('devrait gérer les erreurs lors de la récupération', async () => {
      const userId = 'test-user-id';
      const error = new Error('Query failed');
      
      (getDocs as jest.Mock).mockRejectedValue(error);

      await expect(tasksService.getTasksByUser(userId)).rejects.toThrow('Query failed');
    });
  });

  describe('getTasksByProject', () => {
    it('devrait récupérer les tâches d\'un projet', async () => {
      const projectId = 'project-1';
      const mockTasks = [
        createMockTask({ projectId }),
        createMockTask({ id: 'task-2', projectId }),
      ];
      const mockSnapshot = {
        docs: mockTasks.map(task => ({
          id: task.id,
          data: () => ({ ...task, id: undefined }),
        })),
      };

      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const result = await tasksService.getTasksByProject(projectId);

      expect(where).toHaveBeenCalledWith('projectId', '==', projectId);
      expect(result).toHaveLength(2);
      expect(result[0].projectId).toBe(projectId);
    });
  });

  describe('getTasksByStatus', () => {
    it('devrait récupérer les tâches par statut', async () => {
      const userId = 'test-user-id';
      const status = 'in_progress';
      const mockTasks = [
        createMockTask({ status }),
        createMockTask({ id: 'task-2', status }),
      ];
      const mockSnapshot = {
        docs: mockTasks.map(task => ({
          id: task.id,
          data: () => ({ ...task, id: undefined }),
        })),
      };

      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const result = await tasksService.getTasksByStatus(userId, status);

      expect(where).toHaveBeenCalledWith('userId', '==', userId);
      expect(where).toHaveBeenCalledWith('status', '==', status);
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(status);
    });
  });

  describe('getTaskById', () => {
    it('devrait récupérer une tâche par son ID', async () => {
      const taskId = 'task-1';
      const mockTask = createMockTask();
      const mockDocSnap = {
        exists: () => true,
        id: taskId,
        data: () => ({ ...mockTask, id: undefined }),
      };

      mockDoc.mockReturnValue('doc-ref');
      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await tasksService.getTaskById(taskId);

      expect(doc).toHaveBeenCalledWith(mockDb, 'tasks', taskId);
      expect(getDoc).toHaveBeenCalledWith('doc-ref');
      expect(result).toEqual(mockTask);
    });

    it('devrait retourner null si la tâche n\'existe pas', async () => {
      const taskId = 'non-existent';
      const mockDocSnap = {
        exists: () => false,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);

      const result = await tasksService.getTaskById(taskId);

      expect(result).toBeNull();
    });

    it('devrait gérer les erreurs lors de la récupération', async () => {
      const taskId = 'task-1';
      const error = new Error('Document fetch failed');
      
      (getDoc as jest.Mock).mockRejectedValue(error);

      await expect(tasksService.getTaskById(taskId)).rejects.toThrow('Document fetch failed');
    });
  });

  describe('updateTask', () => {
    it('devrait mettre à jour une tâche', async () => {
      const taskId = 'task-1';
      const updates = {
        title: 'Updated Task',
        status: 'completed' as const,
      };

      mockDoc.mockReturnValue('doc-ref');
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await tasksService.updateTask(taskId, updates);

      expect(doc).toHaveBeenCalledWith(mockDb, 'tasks', taskId);
      expect(updateDoc).toHaveBeenCalledWith(
        'doc-ref',
        expect.objectContaining({
          ...updates,
          updatedAt: expect.any(Object),
        })
      );
    });

    it('devrait convertir les dates en Timestamps lors de la mise à jour', async () => {
      const taskId = 'task-1';
      const updates = {
        dueDate: new Date('2024-12-31'),
      };

      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (Timestamp.fromDate as jest.Mock).mockImplementation((date) => ({
        toDate: () => date,
      }));

      await tasksService.updateTask(taskId, updates);

      expect(Timestamp.fromDate).toHaveBeenCalledWith(updates.dueDate);
    });

    it('devrait gérer les erreurs lors de la mise à jour', async () => {
      const taskId = 'task-1';
      const updates = { title: 'Updated' };
      const error = new Error('Update failed');
      
      (updateDoc as jest.Mock).mockRejectedValue(error);

      await expect(tasksService.updateTask(taskId, updates)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteTask', () => {
    it('devrait supprimer une tâche', async () => {
      const taskId = 'task-1';

      mockDoc.mockReturnValue('doc-ref');
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      await tasksService.deleteTask(taskId);

      expect(doc).toHaveBeenCalledWith(mockDb, 'tasks', taskId);
      expect(deleteDoc).toHaveBeenCalledWith('doc-ref');
    });

    it('devrait gérer les erreurs lors de la suppression', async () => {
      const taskId = 'task-1';
      const error = new Error('Delete failed');
      
      (deleteDoc as jest.Mock).mockRejectedValue(error);

      await expect(tasksService.deleteTask(taskId)).rejects.toThrow('Delete failed');
    });
  });

  describe('updateTaskStatus', () => {
    it('devrait mettre à jour le statut d\'une tâche', async () => {
      const taskId = 'task-1';
      const newStatus = 'completed';

      mockDoc.mockReturnValue('doc-ref');
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await tasksService.updateTaskStatus(taskId, newStatus);

      expect(updateDoc).toHaveBeenCalledWith(
        'doc-ref',
        expect.objectContaining({
          status: newStatus,
          completedAt: expect.any(Object),
          updatedAt: expect.any(Object),
        })
      );
    });

    it('devrait définir completedAt lors du passage au statut completed', async () => {
      const taskId = 'task-1';
      const newStatus = 'completed';

      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await tasksService.updateTaskStatus(taskId, newStatus);

      const updateCall = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(updateCall).toHaveProperty('completedAt');
    });

    it('ne devrait pas définir completedAt pour les autres statuts', async () => {
      const taskId = 'task-1';
      const newStatus = 'in_progress';

      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await tasksService.updateTaskStatus(taskId, newStatus);

      const updateCall = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(updateCall).not.toHaveProperty('completedAt');
    });
  });

  describe('subscribeToUserTasks', () => {
    it('devrait s\'abonner aux changements de tâches', () => {
      const userId = 'test-user-id';
      const callback = jest.fn();
      const unsubscribe = jest.fn();
      const mockSnapshot = {
        docs: [
          {
            id: 'task-1',
            data: () => createMockTask(),
          },
        ],
      };

      mockQuery.mockReturnValue('query-object');
      (onSnapshot as jest.Mock).mockImplementation((query, cb) => {
        cb(mockSnapshot);
        return unsubscribe;
      });

      const result = tasksService.subscribeToUserTasks(userId, callback);

      expect(where).toHaveBeenCalledWith('userId', '==', userId);
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(onSnapshot).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith([expect.objectContaining({ id: 'task-1' })]);
      expect(result).toBe(unsubscribe);
    });

    it('devrait gérer les erreurs dans le callback', () => {
      const userId = 'test-user-id';
      const callback = jest.fn();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      (onSnapshot as jest.Mock).mockImplementation((query, onNext, onError) => {
        onError(new Error('Subscription error'));
        return jest.fn();
      });

      tasksService.subscribeToUserTasks(userId, callback);

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Erreur'),
        expect.any(Error)
      );

      consoleError.mockRestore();
    });
  });

  describe('getTasksWithSubtasks', () => {
    it('devrait récupérer les tâches avec leurs sous-tâches', async () => {
      const userId = 'test-user-id';
      const mockTasks = [
        createMockTask({
          subtasks: [
            {
              id: 'subtask-1',
              taskId: 'task-1',
              title: 'Subtask 1',
              status: 'todo',
              priority: 'low',
              order: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      ];
      const mockSnapshot = {
        docs: mockTasks.map(task => ({
          id: task.id,
          data: () => ({ ...task, id: undefined }),
        })),
      };

      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const result = await tasksService.getTasksWithSubtasks(userId);

      expect(result[0].subtasks).toHaveLength(1);
      expect(result[0].subtasks[0].title).toBe('Subtask 1');
    });
  });

  describe('addSubtask', () => {
    it('devrait ajouter une sous-tâche à une tâche existante', async () => {
      const taskId = 'task-1';
      const mockTask = createMockTask({ subtasks: [] });
      const newSubtask = {
        title: 'New Subtask',
        description: 'Subtask description',
        status: 'todo' as const,
        priority: 'medium' as const,
        order: 0,
      };
      const mockDocSnap = {
        exists: () => true,
        data: () => mockTask,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await tasksService.addSubtask(taskId, newSubtask);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          subtasks: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              taskId,
              ...newSubtask,
            }),
          ]),
        })
      );
      expect(result).toMatch(/^subtask-/);
    });
  });

  describe('updateSubtask', () => {
    it('devrait mettre à jour une sous-tâche', async () => {
      const taskId = 'task-1';
      const subtaskId = 'subtask-1';
      const mockTask = createMockTask({
        subtasks: [
          {
            id: subtaskId,
            taskId,
            title: 'Original Subtask',
            status: 'todo',
            priority: 'low',
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });
      const updates = { title: 'Updated Subtask', status: 'completed' as const };
      const mockDocSnap = {
        exists: () => true,
        data: () => mockTask,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await tasksService.updateSubtask(taskId, subtaskId, updates);

      const updateCall = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(updateCall.subtasks[0].title).toBe('Updated Subtask');
      expect(updateCall.subtasks[0].status).toBe('completed');
    });
  });

  describe('deleteSubtask', () => {
    it('devrait supprimer une sous-tâche', async () => {
      const taskId = 'task-1';
      const subtaskId = 'subtask-1';
      const mockTask = createMockTask({
        subtasks: [
          {
            id: subtaskId,
            taskId,
            title: 'Subtask to delete',
            status: 'todo',
            priority: 'low',
            order: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'subtask-2',
            taskId,
            title: 'Keep this subtask',
            status: 'todo',
            priority: 'medium',
            order: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });
      const mockDocSnap = {
        exists: () => true,
        data: () => mockTask,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDocSnap);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await tasksService.deleteSubtask(taskId, subtaskId);

      const updateCall = (updateDoc as jest.Mock).mock.calls[0][1];
      expect(updateCall.subtasks).toHaveLength(1);
      expect(updateCall.subtasks[0].id).toBe('subtask-2');
    });
  });
});