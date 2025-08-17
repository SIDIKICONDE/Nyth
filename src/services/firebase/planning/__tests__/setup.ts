// Configuration et mocks pour les tests du système de planification
import { jest } from "@jest/globals";

// Mock Firebase App
jest.mock("@react-native-firebase/app", () => ({
  getApp: jest.fn(() => ({})),
}));

// Mock Firebase Firestore
jest.mock("@react-native-firebase/firestore", () => {
  const Timestamp = {
    now: jest.fn(() => ({
      toDate: () => new Date(),
      toMillis: () => Date.now(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
    })),
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
      toMillis: () => date.getTime(),
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    })),
  };

  return {
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn(),
    doc: jest.fn(),
    addDoc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    onSnapshot: jest.fn(),
    Timestamp,
  };
});

// Mock Firebase Auth
jest.mock("@react-native-firebase/auth", () => ({
  default: jest.fn(() => ({
    currentUser: {
      uid: "test-user-id",
      email: "test@example.com",
      displayName: "Test User",
    },
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  })),
}));

// Mock Firebase Storage
jest.mock("@react-native-firebase/storage", () => ({
  default: jest.fn(() => ({
    ref: jest.fn(() => ({
      putFile: jest.fn(),
      getDownloadURL: jest.fn(),
      delete: jest.fn(),
    })),
  })),
}));

// Mock React Native modules
jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: jest.fn((obj) => obj.ios || obj.default),
  },
  PermissionsAndroid: {
    PERMISSIONS: {
      READ_CALENDAR: "android.permission.READ_CALENDAR",
      WRITE_CALENDAR: "android.permission.WRITE_CALENDAR",
    },
    requestMultiple: jest.fn(() =>
      Promise.resolve({
        "android.permission.READ_CALENDAR": "granted",
        "android.permission.WRITE_CALENDAR": "granted",
      })
    ),
  },
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock Calendar Events
jest.mock("react-native-calendar-events", () => ({
  requestPermissions: jest.fn(() => Promise.resolve("authorized")),
  findCalendars: jest.fn(() => Promise.resolve([])),
  saveEvent: jest.fn(() => Promise.resolve("event-id")),
  removeEvent: jest.fn(() => Promise.resolve(true)),
  fetchAllEvents: jest.fn(() => Promise.resolve([])),
}));

// Mock Logger
jest.mock("../../../../utils/optimizedLogger", () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Helper functions pour les tests
export const createMockTask = (overrides = {}) => ({
  id: "task-1",
  userId: "test-user-id",
  title: "Test Task",
  description: "Test Description",
  status: "todo",
  priority: "medium",
  tags: [],
  dependencies: [],
  blockedBy: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockEvent = (overrides = {}) => ({
  id: "event-1",
  userId: "test-user-id",
  title: "Test Event",
  description: "Test Event Description",
  type: "meeting",
  startDate: new Date(),
  endDate: new Date(Date.now() + 3600000),
  status: "planned",
  priority: "medium",
  reminders: [],
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockGoal = (overrides = {}) => ({
  id: "goal-1",
  userId: "test-user-id",
  title: "Test Goal",
  description: "Test Goal Description",
  type: "scripts",
  target: 10,
  current: 5,
  unit: "scripts",
  period: "monthly",
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 3600000),
  status: "active",
  progress: 50,
  milestones: [],
  tags: [],
  priority: "high",
  category: "productivity",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockTeam = (overrides = {}) => ({
  id: "team-1",
  name: "Test Team",
  description: "Test Team Description",
  ownerId: "test-user-id",
  members: [
    {
      userId: "test-user-id",
      role: "owner",
      permissions: [],
      joinedAt: new Date().toISOString(),
    },
  ],
  invitations: [],
  projects: [],
  settings: {
    visibility: "private",
    allowMemberInvites: true,
    requireApprovalForEvents: false,
    defaultEventReminders: [],
    workingHours: {},
    timezone: "Europe/Paris",
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isActive: true,
  ...overrides,
});

export const createMockProject = (overrides = {}) => ({
  id: "project-1",
  userId: "test-user-id",
  name: "Test Project",
  description: "Test Project Description",
  status: "active",
  startDate: new Date(),
  endDate: new Date(Date.now() + 90 * 24 * 3600000),
  estimatedDuration: 90,
  tasks: [],
  events: [],
  goals: [],
  assignedMembers: ["test-user-id"],
  progress: 0,
  tags: [],
  priority: "high",
  category: "development",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
