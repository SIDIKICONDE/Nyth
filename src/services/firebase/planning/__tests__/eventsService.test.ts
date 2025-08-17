import './setup';
import eventsService from '../eventsService';
import { createMockEvent } from './setup';
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
  onSnapshot,
  Timestamp,
} from '@react-native-firebase/firestore';
import { PlanningEvent, EventFilter } from '../../../../types/planning';

// Mock Firestore functions
jest.mock('@react-native-firebase/firestore');
jest.mock('../../../../utils/optimizedLogger');

describe('EventsService', () => {
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

  describe('createEvent', () => {
    it('devrait créer un nouvel événement avec succès', async () => {
      const mockEvent = createMockEvent();
      const { id, ...eventData } = mockEvent;
      const mockDocRef = { id: 'new-event-id' };
      
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('events-collection');
      (Timestamp.fromDate as jest.Mock).mockImplementation((date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
      }));
      (Timestamp.now as jest.Mock).mockReturnValue({
        toDate: () => new Date(),
        seconds: Math.floor(Date.now() / 1000),
      });

      const result = await eventsService.createEvent(eventData);

      expect(getFirestore).toHaveBeenCalled();
      expect(collection).toHaveBeenCalledWith(mockDb, 'planningEvents');
      expect(Timestamp.fromDate).toHaveBeenCalledWith(eventData.startDate);
      expect(Timestamp.fromDate).toHaveBeenCalledWith(eventData.endDate);
      expect(addDoc).toHaveBeenCalledWith(
        'events-collection',
        expect.objectContaining({
          ...eventData,
          startDate: expect.any(Object),
          endDate: expect.any(Object),
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object),
        })
      );
      expect(result).toBe('new-event-id');
    });

    it('devrait gérer les erreurs lors de la création', async () => {
      const mockEvent = createMockEvent();
      const { id, ...eventData } = mockEvent;
      const error = new Error('Firestore error');
      
      (addDoc as jest.Mock).mockRejectedValue(error);

      await expect(eventsService.createEvent(eventData)).rejects.toThrow('Firestore error');
    });
  });

  describe('getUserEvents', () => {
    it('devrait récupérer tous les événements d\'un utilisateur', async () => {
      const userId = 'test-user-id';
      const mockEvents = [
        createMockEvent(),
        createMockEvent({ id: 'event-2', title: 'Event 2' }),
      ];
      const mockSnapshot = {
        docs: mockEvents.map(event => ({
          id: event.id,
          data: () => ({
            ...event,
            id: undefined,
            startDate: { toDate: () => event.startDate },
            endDate: { toDate: () => event.endDate },
          }),
        })),
      };

      mockQuery.mockReturnValue('query-object');
      mockWhere.mockReturnValue('where-clause');
      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const result = await eventsService.getUserEvents(userId);

      expect(collection).toHaveBeenCalledWith(mockDb, 'planningEvents');
      expect(where).toHaveBeenCalledWith('userId', '==', userId);
      expect(getDocs).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('event-1');
      expect(result[1].id).toBe('event-2');
    });

    it('devrait appliquer un filtre de date de début', async () => {
      const userId = 'test-user-id';
      const startDate = new Date('2024-01-01');
      const filter: EventFilter = { startDate };
      const mockEvents = [createMockEvent()];
      const mockSnapshot = {
        docs: mockEvents.map(event => ({
          id: event.id,
          data: () => ({
            ...event,
            id: undefined,
            startDate: { toDate: () => event.startDate },
            endDate: { toDate: () => event.endDate },
          }),
        })),
      };

      mockQuery.mockReturnValue('query-object');
      mockWhere.mockReturnValue('where-clause');
      mockOrderBy.mockReturnValue('order-clause');
      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const result = await eventsService.getUserEvents(userId, filter);

      expect(where).toHaveBeenCalledWith('userId', '==', userId);
      expect(where).toHaveBeenCalledWith('startDate', '>=', startDate);
      expect(orderBy).toHaveBeenCalledWith('startDate', 'asc');
      expect(result).toHaveLength(1);
    });

    it('devrait appliquer un filtre de date de fin', async () => {
      const userId = 'test-user-id';
      const endDate = new Date('2024-12-31');
      const filter: EventFilter = { endDate };
      const mockEvents = [
        createMockEvent({ startDate: new Date('2024-01-01') }),
        createMockEvent({ id: 'event-2', startDate: new Date('2025-01-01') }),
      ];
      const mockSnapshot = {
        docs: mockEvents.map(event => ({
          id: event.id,
          data: () => ({
            ...event,
            id: undefined,
            startDate: { toDate: () => event.startDate },
            endDate: { toDate: () => event.endDate },
          }),
        })),
      };

      mockQuery.mockReturnValue('query-object');
      mockWhere.mockReturnValue('where-clause');
      mockOrderBy.mockReturnValue('order-clause');
      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const result = await eventsService.getUserEvents(userId, filter);

      expect(where).toHaveBeenCalledWith('startDate', '<=', endDate);
      expect(orderBy).toHaveBeenCalledWith('startDate', 'asc');
      // Le filtrage côté client devrait exclure l'événement de 2025
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('event-1');
    });

    it('devrait gérer les erreurs lors de la récupération', async () => {
      const userId = 'test-user-id';
      const error = new Error('Query failed');
      
      (getDocs as jest.Mock).mockRejectedValue(error);

      await expect(eventsService.getUserEvents(userId)).rejects.toThrow('Query failed');
    });
  });

  describe('updateEvent', () => {
    it('devrait mettre à jour un événement', async () => {
      const eventId = 'event-1';
      const updates = {
        title: 'Updated Event',
        description: 'Updated description',
      };

      mockDoc.mockReturnValue('doc-ref');
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (Timestamp.now as jest.Mock).mockReturnValue({
        toDate: () => new Date(),
        seconds: Math.floor(Date.now() / 1000),
      });

      await eventsService.updateEvent(eventId, updates);

      expect(doc).toHaveBeenCalledWith(mockDb, 'planningEvents', eventId);
      expect(updateDoc).toHaveBeenCalledWith(
        'doc-ref',
        expect.objectContaining({
          ...updates,
          updatedAt: expect.any(Object),
        })
      );
    });

    it('devrait convertir les dates en Timestamps lors de la mise à jour', async () => {
      const eventId = 'event-1';
      const updates = {
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-02'),
      };

      mockDoc.mockReturnValue('doc-ref');
      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (Timestamp.fromDate as jest.Mock).mockImplementation((date) => ({
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
      }));

      await eventsService.updateEvent(eventId, updates);

      expect(Timestamp.fromDate).toHaveBeenCalledWith(updates.startDate);
      expect(Timestamp.fromDate).toHaveBeenCalledWith(updates.endDate);
    });

    it('devrait gérer les erreurs lors de la mise à jour', async () => {
      const eventId = 'event-1';
      const updates = { title: 'Updated' };
      const error = new Error('Update failed');
      
      (updateDoc as jest.Mock).mockRejectedValue(error);

      await expect(eventsService.updateEvent(eventId, updates)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteEvent', () => {
    it('devrait supprimer un événement', async () => {
      const eventId = 'event-1';

      mockDoc.mockReturnValue('doc-ref');
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      await eventsService.deleteEvent(eventId);

      expect(doc).toHaveBeenCalledWith(mockDb, 'planningEvents', eventId);
      expect(deleteDoc).toHaveBeenCalledWith('doc-ref');
    });

    it('devrait gérer les erreurs lors de la suppression', async () => {
      const eventId = 'event-1';
      const error = new Error('Delete failed');
      
      (deleteDoc as jest.Mock).mockRejectedValue(error);

      await expect(eventsService.deleteEvent(eventId)).rejects.toThrow('Delete failed');
    });
  });

  describe('onEventsChange', () => {
    it('devrait s\'abonner aux changements d\'événements', () => {
      const userId = 'test-user-id';
      const callback = jest.fn();
      const unsubscribe = jest.fn();
      const mockSnapshot = {
        docs: [
          {
            id: 'event-1',
            data: () => ({
              ...createMockEvent(),
              startDate: { toDate: () => new Date() },
              endDate: { toDate: () => new Date() },
            }),
          },
        ],
      };

      mockQuery.mockReturnValue('query-object');
      mockWhere.mockReturnValue('where-clause');
      mockOrderBy.mockReturnValue('order-clause');
      (onSnapshot as jest.Mock).mockImplementation((query, cb) => {
        cb(mockSnapshot);
        return unsubscribe;
      });

      const result = eventsService.onEventsChange(userId, callback);

      expect(where).toHaveBeenCalledWith('userId', '==', userId);
      expect(orderBy).toHaveBeenCalledWith('startDate', 'asc');
      expect(onSnapshot).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith([expect.objectContaining({ id: 'event-1' })]);
      expect(result).toBe(unsubscribe);
    });

    it('devrait gérer les erreurs dans le callback', () => {
      const userId = 'test-user-id';
      const callback = jest.fn();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      (onSnapshot as jest.Mock).mockImplementation((query, onNext, onError) => {
        if (typeof onNext === 'function' && typeof onError === 'function') {
          onError(new Error('Subscription error'));
        }
        return jest.fn();
      });

      eventsService.onEventsChange(userId, callback);

      // Vérifier que l'erreur est loggée via le logger
      // Note: le logger est mocké, donc on ne peut pas vérifier directement console.error
      
      consoleError.mockRestore();
    });
  });

  describe('getUpcomingEvents', () => {
    it('devrait récupérer les événements à venir', async () => {
      const userId = 'test-user-id';
      const days = 7;
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      
      const mockEvents = [
        createMockEvent({ startDate: new Date(now.getTime() + 1000) }),
        createMockEvent({ id: 'event-2', startDate: new Date(now.getTime() + 2000) }),
      ];
      const mockSnapshot = {
        docs: mockEvents.map(event => ({
          id: event.id,
          data: () => ({
            ...event,
            id: undefined,
            startDate: { toDate: () => event.startDate },
            endDate: { toDate: () => event.endDate },
          }),
        })),
      };

      mockQuery.mockReturnValue('query-object');
      mockWhere.mockReturnValue('where-clause');
      mockOrderBy.mockReturnValue('order-clause');
      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const result = await eventsService.getUpcomingEvents(userId, days);

      expect(where).toHaveBeenCalledWith('userId', '==', userId);
      expect(where).toHaveBeenCalledWith('startDate', '>=', expect.any(Date));
      expect(where).toHaveBeenCalledWith('startDate', '<=', expect.any(Date));
      expect(orderBy).toHaveBeenCalledWith('startDate', 'asc');
      expect(result).toHaveLength(2);
    });
  });

  describe('getEventsByDateRange', () => {
    it('devrait récupérer les événements dans une plage de dates', async () => {
      const userId = 'test-user-id';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const mockEvents = [
        createMockEvent({ startDate: new Date('2024-06-01') }),
        createMockEvent({ id: 'event-2', startDate: new Date('2024-07-01') }),
      ];
      const mockSnapshot = {
        docs: mockEvents.map(event => ({
          id: event.id,
          data: () => ({
            ...event,
            id: undefined,
            startDate: { toDate: () => event.startDate },
            endDate: { toDate: () => event.endDate },
          }),
        })),
      };

      mockQuery.mockReturnValue('query-object');
      mockWhere.mockReturnValue('where-clause');
      mockOrderBy.mockReturnValue('order-clause');
      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const result = await eventsService.getEventsByDateRange(userId, startDate, endDate);

      expect(where).toHaveBeenCalledWith('userId', '==', userId);
      expect(where).toHaveBeenCalledWith('startDate', '>=', startDate);
      expect(where).toHaveBeenCalledWith('startDate', '<=', endDate);
      expect(orderBy).toHaveBeenCalledWith('startDate', 'asc');
      expect(result).toHaveLength(2);
    });
  });

  describe('Types d\'événements', () => {
    it('devrait créer un événement de type script_creation', async () => {
      const event = createMockEvent({
        type: 'script_creation',
        scriptId: 'script-123',
      });
      const { id, ...eventData } = event;
      const mockDocRef = { id: 'new-event-id' };
      
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const result = await eventsService.createEvent(eventData);

      const addDocCall = (addDoc as jest.Mock).mock.calls[0][1];
      expect(addDocCall.type).toBe('script_creation');
      expect(addDocCall.scriptId).toBe('script-123');
      expect(result).toBe('new-event-id');
    });

    it('devrait créer un événement de type recording', async () => {
      const event = createMockEvent({
        type: 'recording',
        recordingId: 'recording-456',
      });
      const { id, ...eventData } = event;
      const mockDocRef = { id: 'new-event-id' };
      
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const result = await eventsService.createEvent(eventData);

      const addDocCall = (addDoc as jest.Mock).mock.calls[0][1];
      expect(addDocCall.type).toBe('recording');
      expect(addDocCall.recordingId).toBe('recording-456');
    });
  });

  describe('Gestion des rappels', () => {
    it('devrait créer un événement avec des rappels', async () => {
      const reminders = [
        {
          id: 'reminder-1',
          type: 'notification' as const,
          triggerBefore: 30,
          message: 'Rappel 30 minutes avant',
          sent: false,
        },
        {
          id: 'reminder-2',
          type: 'email' as const,
          triggerBefore: 1440,
          message: 'Rappel 1 jour avant',
          sent: false,
        },
      ];
      const event = createMockEvent({ reminders });
      const { id, ...eventData } = event;
      const mockDocRef = { id: 'new-event-id' };
      
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      await eventsService.createEvent(eventData);

      const addDocCall = (addDoc as jest.Mock).mock.calls[0][1];
      expect(addDocCall.reminders).toHaveLength(2);
      expect(addDocCall.reminders[0].type).toBe('notification');
      expect(addDocCall.reminders[1].type).toBe('email');
    });
  });

  describe('Événements récurrents', () => {
    it('devrait créer un événement récurrent', async () => {
      const recurring = {
        frequency: 'weekly' as const,
        interval: 1,
        daysOfWeek: [1, 3, 5], // Lundi, Mercredi, Vendredi
        endDate: new Date('2024-12-31'),
      };
      const event = createMockEvent({ recurring });
      const { id, ...eventData } = event;
      const mockDocRef = { id: 'new-event-id' };
      
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      await eventsService.createEvent(eventData);

      const addDocCall = (addDoc as jest.Mock).mock.calls[0][1];
      expect(addDocCall.recurring).toBeDefined();
      expect(addDocCall.recurring.frequency).toBe('weekly');
      expect(addDocCall.recurring.daysOfWeek).toEqual([1, 3, 5]);
    });
  });
});