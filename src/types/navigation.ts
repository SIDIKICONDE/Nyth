import { RecordingSettings } from "./index";

// Types pour la navigation
export type RootStackParamList = {
  Welcome: undefined;
  Home: undefined;
  Editor: { scriptId?: string; initialContent?: string };
  Settings: { scriptId: string };
  Recording: { scriptId: string; settings?: RecordingSettings };
  Preview: {
    videoUri?: string;
    duration?: number;
    scriptId?: string;
    scriptTitle?: string;
    thumbnailUri?: string;
    recordingId: string; // Rendre obligatoire pour éviter les crashes
  };
  // OnboardingScreen: undefined; // Supprimé
  RegisterScreen: undefined;
  Register: undefined;
  PrivacyPolicyScreen: undefined;
  ProfileScreen: undefined;
  Profile: undefined;
  EditProfileScreen: undefined;
  AIChatScreen: undefined;
  AIGeneratorScreen: undefined;
  SettingsScreen: undefined;
  AISettingsScreen: undefined;
  AIMemory: undefined;
  MemorySources: undefined;
  HelpScreen: undefined;
  FontSettings: undefined;

  VideoLibrary: undefined;
  Library: undefined;
  VideoPlayer: { videoUri: string; title?: string };
  // Onboarding: undefined; // Supprimé
  Theme: undefined;
  AIGenerator: undefined;
  AISettings: undefined;
  ScriptEditor: { scriptId?: string; isNewScript?: boolean };
  Permissions: undefined;
  MyRecordings: undefined;
  TeleprompterSettings: {
    scriptId?: string;
    returnScreen?: keyof RootStackParamList;
  };
  AIChat: {
    conversationId?: string;
    initialContext?: string;
    invisibleContext?: string;
    isWelcomeMessage?: boolean;
    returnScreen?: keyof RootStackParamList;
    initialMessage?: string;
    context?: "planning" | "general";
    planningData?: any;
  };
  Login: undefined;
  ForgotPassword: undefined;
  ScriptsList: undefined;
  RecordSession: { scriptId: string };
  PlaySession: { scriptId: string; settings: RecordingSettings };
  EditProfile: { section?: "personal" | "professional" | "social" };
  Admin: undefined;
  Help: undefined;
  Pricing: undefined;
  SubscriptionManagement: undefined;
  PasswordResetLocal: undefined;
  VerifyEmail: undefined;
  Planning: undefined;
  TaskDetail: { taskId: string };
  CartesaniDemo: undefined;
  // Navigation pour les notes - utilise le navigateur intégré
};
