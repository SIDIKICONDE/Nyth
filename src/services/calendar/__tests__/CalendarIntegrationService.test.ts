import { Platform, PermissionsAndroid } from 'react-native';
import RNCalendarEvents from 'react-native-calendar-events';
import { CalendarIntegrationService } from '../CalendarIntegrationService';
import { PlanningEvent } from '../../../types/planning';

// Mock des modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default),
  },
  PermissionsAndroid: {
    PERMISSIONS: {
      READ_CALENDAR: 'android.permission.READ_CALENDAR',
      WRITE_CALENDAR: 'android.permission.WRITE_CALENDAR',
    },
    requestMultiple: jest.fn(),
  },
}));

jest.mock('react-native-calendar-events');
jest.mock('../../../utils/optimizedLogger');

describe('CalendarIntegrationService', () => {
  let service: CalendarIntegrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Réinitialiser le singleton
    (CalendarIntegrationService as any).instance = undefined;
    service = CalendarIntegrationService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('devrait retourner la même instance', () => {
      const instance1 = CalendarIntegrationService.getInstance();
      const instance2 = CalendarIntegrationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialisation', () => {
    it('devrait initialiser le service avec succès sur iOS', async () => {
      (Platform as any).OS = 'ios';
      (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue('authorized');

      const result = await service.initialize();

      expect(RNCalendarEvents.requestPermissions).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(service.initialized).toBe(true);
    });

    it('devrait initialiser le service avec succès sur Android', async () => {
      (Platform as any).OS = 'android';
      (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue({
        'android.permission.READ_CALENDAR': 'granted',
        'android.permission.WRITE_CALENDAR': 'granted',
      });

      const result = await service.initialize();

      expect(PermissionsAndroid.requestMultiple).toHaveBeenCalledWith([
        PermissionsAndroid.PERMISSIONS.READ_CALENDAR,
        PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR,
      ]);
      expect(result).toBe(true);
      expect(service.initialized).toBe(true);
    });

    it('devrait gérer le refus des permissions sur iOS', async () => {
      (Platform as any).OS = 'ios';
      (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue('denied');

      const result = await service.initialize();

      expect(result).toBe(false);
      expect(service.initialized).toBe(true);
    });

    it('devrait gérer le refus des permissions sur Android', async () => {
      (Platform as any).OS = 'android';
      (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue({
        'android.permission.READ_CALENDAR': 'denied',
        'android.permission.WRITE_CALENDAR': 'denied',
      });

      const result = await service.initialize();

      expect(result).toBe(false);
      expect(service.initialized).toBe(true);
    });

    it('ne devrait pas réinitialiser si déjà initialisé', async () => {
      (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue('authorized');

      await service.initialize();
      const result = await service.initialize();

      expect(RNCalendarEvents.requestPermissions).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('devrait gérer les erreurs lors de l\'initialisation', async () => {
      (RNCalendarEvents.requestPermissions as jest.Mock).mockRejectedValue(
        new Error('Permission error')
      );

      const result = await service.initialize();

      expect(result).toBe(false);
    });
  });

  describe('Gestion des permissions', () => {
    it('devrait demander les permissions sur iOS', async () => {
      (Platform as any).OS = 'ios';
      (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue('authorized');

      const result = await service.requestPermissions();

      expect(RNCalendarEvents.requestPermissions).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('devrait demander les permissions sur Android', async () => {
      (Platform as any).OS = 'android';
      (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue({
        'android.permission.READ_CALENDAR': 'granted',
        'android.permission.WRITE_CALENDAR': 'granted',
      });

      const result = await service.requestPermissions();

      expect(PermissionsAndroid.requestMultiple).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('devrait vérifier les permissions', async () => {
      (Platform as any).OS = 'ios';
      (RNCalendarEvents.checkPermissions as jest.Mock).mockResolvedValue('authorized');

      const result = await service.checkPermissions();

      expect(RNCalendarEvents.checkPermissions).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('Gestion des calendriers', () => {
    beforeEach(async () => {
      (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue('authorized');
      await service.initialize();
    });

    it('devrait récupérer la liste des calendriers', async () => {
      const mockCalendars = [
        {
          id: 'cal-1',
          title: 'Personal',
          type: 'Local',
          source: 'Default',
          isPrimary: true,
          allowsModifications: true,
        },
        {
          id: 'cal-2',
          title: 'Work',
          type: 'CalDAV',
          source: 'iCloud',
          isPrimary: false,
          allowsModifications: true,
        },
      ];
      (RNCalendarEvents.findCalendars as jest.Mock).mockResolvedValue(mockCalendars);

      const result = await service.getCalendars();

      expect(RNCalendarEvents.findCalendars).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Personal');
    });

    it('devrait retourner un tableau vide si pas de permissions', async () => {
      (CalendarIntegrationService as any).instance = undefined;
      service = CalendarIntegrationService.getInstance();
      (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue('denied');
      await service.initialize();

      const result = await service.getCalendars();

      expect(result).toEqual([]);
    });

    it('devrait gérer les erreurs lors de la récupération des calendriers', async () => {
      (RNCalendarEvents.findCalendars as jest.Mock).mockRejectedValue(
        new Error('Calendar fetch error')
      );

      const result = await service.getCalendars();

      expect(result).toEqual([]);
    });
  });

  describe('Synchronisation des événements', () => {
    beforeEach(async () => {
      (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue('authorized');
      await service.initialize();
    });

    it('devrait synchroniser un événement de planification avec le calendrier', async () => {
      const planningEvent: PlanningEvent = {
        id: 'event-1',
        userId: 'user-1',
        title: 'Test Event',
        description: 'Test Description',
        type: 'meeting',
        startDate: new Date('2024-06-01T10:00:00'),
        endDate: new Date('2024-06-01T11:00:00'),
        status: 'planned',
        priority: 'high',
        reminders: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (RNCalendarEvents.saveEvent as jest.Mock).mockResolvedValue('calendar-event-id');

      const result = await service.syncEventToCalendar(planningEvent);

      expect(RNCalendarEvents.saveEvent).toHaveBeenCalledWith(
        'Test Event',
        expect.objectContaining({
          startDate: planningEvent.startDate.toISOString(),
          endDate: planningEvent.endDate.toISOString(),
          notes: 'Test Description',
        })
      );
      expect(result).toBe('calendar-event-id');
    });

    it('devrait inclure la localisation si disponible', async () => {
      const planningEvent: PlanningEvent = {
        id: 'event-1',
        userId: 'user-1',
        title: 'Meeting',
        type: 'meeting',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        status: 'planned',
        priority: 'medium',
        location: '123 Main St, City',
        reminders: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (RNCalendarEvents.saveEvent as jest.Mock).mockResolvedValue('calendar-event-id');

      await service.syncEventToCalendar(planningEvent);

      expect(RNCalendarEvents.saveEvent).toHaveBeenCalledWith(
        'Meeting',
        expect.objectContaining({
          location: '123 Main St, City',
        })
      );
    });

    it('devrait ajouter des rappels si configurés', async () => {
      const planningEvent: PlanningEvent = {
        id: 'event-1',
        userId: 'user-1',
        title: 'Event with Reminders',
        type: 'meeting',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        status: 'planned',
        priority: 'high',
        reminders: [
          {
            id: 'reminder-1',
            type: 'notification',
            triggerBefore: 30,
            message: 'Reminder',
            sent: false,
          },
          {
            id: 'reminder-2',
            type: 'notification',
            triggerBefore: 60,
            message: 'Another reminder',
            sent: false,
          },
        ],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (RNCalendarEvents.saveEvent as jest.Mock).mockResolvedValue('calendar-event-id');

      await service.syncEventToCalendar(planningEvent);

      expect(RNCalendarEvents.saveEvent).toHaveBeenCalledWith(
        'Event with Reminders',
        expect.objectContaining({
          alarms: [
            { date: -30 },
            { date: -60 },
          ],
        })
      );
    });

    it('devrait gérer les erreurs lors de la synchronisation', async () => {
      const planningEvent: PlanningEvent = {
        id: 'event-1',
        userId: 'user-1',
        title: 'Test Event',
        type: 'meeting',
        startDate: new Date(),
        endDate: new Date(),
        status: 'planned',
        priority: 'medium',
        reminders: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (RNCalendarEvents.saveEvent as jest.Mock).mockRejectedValue(
        new Error('Save event error')
      );

      const result = await service.syncEventToCalendar(planningEvent);

      expect(result).toBeNull();
    });

    it('ne devrait pas synchroniser si pas de permissions', async () => {
      (CalendarIntegrationService as any).instance = undefined;
      service = CalendarIntegrationService.getInstance();
      (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue('denied');
      await service.initialize();

      const planningEvent: PlanningEvent = {
        id: 'event-1',
        userId: 'user-1',
        title: 'Test Event',
        type: 'meeting',
        startDate: new Date(),
        endDate: new Date(),
        status: 'planned',
        priority: 'medium',
        reminders: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await service.syncEventToCalendar(planningEvent);

      expect(RNCalendarEvents.saveEvent).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('Suppression d\'événements', () => {
    beforeEach(async () => {
      (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue('authorized');
      await service.initialize();
    });

    it('devrait supprimer un événement du calendrier', async () => {
      const eventId = 'calendar-event-id';
      (RNCalendarEvents.removeEvent as jest.Mock).mockResolvedValue(true);

      const result = await service.removeEventFromCalendar(eventId);

      expect(RNCalendarEvents.removeEvent).toHaveBeenCalledWith(eventId);
      expect(result).toBe(true);
    });

    it('devrait gérer les erreurs lors de la suppression', async () => {
      const eventId = 'calendar-event-id';
      (RNCalendarEvents.removeEvent as jest.Mock).mockRejectedValue(
        new Error('Remove event error')
      );

      const result = await service.removeEventFromCalendar(eventId);

      expect(result).toBe(false);
    });

    it('ne devrait pas supprimer si pas de permissions', async () => {
      (CalendarIntegrationService as any).instance = undefined;
      service = CalendarIntegrationService.getInstance();
      (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue('denied');
      await service.initialize();

      const result = await service.removeEventFromCalendar('event-id');

      expect(RNCalendarEvents.removeEvent).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('Récupération d\'événements', () => {
    beforeEach(async () => {
      (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue('authorized');
      await service.initialize();
    });

    it('devrait récupérer les événements dans une plage de dates', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Event 1',
          startDate: '2024-06-01T10:00:00.000Z',
          endDate: '2024-06-01T11:00:00.000Z',
          notes: 'Description 1',
          location: 'Location 1',
        },
        {
          id: 'event-2',
          title: 'Event 2',
          startDate: '2024-07-01T14:00:00.000Z',
          endDate: '2024-07-01T15:00:00.000Z',
          notes: 'Description 2',
        },
      ];

      (RNCalendarEvents.fetchAllEvents as jest.Mock).mockResolvedValue(mockEvents);

      const result = await service.getEventsInRange(startDate, endDate);

      expect(RNCalendarEvents.fetchAllEvents).toHaveBeenCalledWith(
        startDate.toISOString(),
        endDate.toISOString(),
        []
      );
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Event 1');
      expect(result[0].description).toBe('Description 1');
      expect(result[0].location).toBe('Location 1');
    });

    it('devrait récupérer les événements d\'un calendrier spécifique', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const calendarIds = ['cal-1', 'cal-2'];
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Event from Cal 1',
          startDate: '2024-06-01T10:00:00.000Z',
          endDate: '2024-06-01T11:00:00.000Z',
        },
      ];

      (RNCalendarEvents.fetchAllEvents as jest.Mock).mockResolvedValue(mockEvents);

      const result = await service.getEventsInRange(startDate, endDate, calendarIds);

      expect(RNCalendarEvents.fetchAllEvents).toHaveBeenCalledWith(
        startDate.toISOString(),
        endDate.toISOString(),
        calendarIds
      );
      expect(result).toHaveLength(1);
    });

    it('devrait gérer les erreurs lors de la récupération d\'événements', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      (RNCalendarEvents.fetchAllEvents as jest.Mock).mockRejectedValue(
        new Error('Fetch events error')
      );

      const result = await service.getEventsInRange(startDate, endDate);

      expect(result).toEqual([]);
    });

    it('ne devrait pas récupérer d\'événements si pas de permissions', async () => {
      (CalendarIntegrationService as any).instance = undefined;
      service = CalendarIntegrationService.getInstance();
      (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue('denied');
      await service.initialize();

      const result = await service.getEventsInRange(new Date(), new Date());

      expect(RNCalendarEvents.fetchAllEvents).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('Événements récurrents', () => {
    beforeEach(async () => {
      (RNCalendarEvents.requestPermissions as jest.Mock).mockResolvedValue('authorized');
      await service.initialize();
    });

    it('devrait créer un événement récurrent hebdomadaire', async () => {
      const planningEvent: PlanningEvent = {
        id: 'event-1',
        userId: 'user-1',
        title: 'Weekly Meeting',
        type: 'meeting',
        startDate: new Date('2024-01-01T10:00:00'),
        endDate: new Date('2024-01-01T11:00:00'),
        status: 'planned',
        priority: 'medium',
        recurring: {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [1, 3, 5],
          endDate: new Date('2024-12-31'),
        },
        reminders: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (RNCalendarEvents.saveEvent as jest.Mock).mockResolvedValue('recurring-event-id');

      await service.syncEventToCalendar(planningEvent);

      expect(RNCalendarEvents.saveEvent).toHaveBeenCalledWith(
        'Weekly Meeting',
        expect.objectContaining({
          recurrence: 'weekly',
          recurrenceRule: expect.objectContaining({
            frequency: 'weekly',
            interval: 1,
            daysOfWeek: ['MO', 'WE', 'FR'],
            endDate: '2024-12-31T00:00:00.000Z',
          }),
        })
      );
    });

    it('devrait créer un événement récurrent mensuel', async () => {
      const planningEvent: PlanningEvent = {
        id: 'event-1',
        userId: 'user-1',
        title: 'Monthly Review',
        type: 'review',
        startDate: new Date('2024-01-15T14:00:00'),
        endDate: new Date('2024-01-15T15:00:00'),
        status: 'planned',
        priority: 'high',
        recurring: {
          frequency: 'monthly',
          interval: 1,
          maxOccurrences: 12,
        },
        reminders: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (RNCalendarEvents.saveEvent as jest.Mock).mockResolvedValue('monthly-event-id');

      await service.syncEventToCalendar(planningEvent);

      expect(RNCalendarEvents.saveEvent).toHaveBeenCalledWith(
        'Monthly Review',
        expect.objectContaining({
          recurrence: 'monthly',
          recurrenceRule: expect.objectContaining({
            frequency: 'monthly',
            interval: 1,
            occurrence: 12,
          }),
        })
      );
    });
  });
});