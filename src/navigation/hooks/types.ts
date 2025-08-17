export interface AppState {
  isLoading: boolean;
  isInitialLoading: boolean;
  hasCompletedOnboarding: boolean;
  hasPermissions: boolean;
  appResetCounter: number;
}

export interface AppActions {
  setIsLoading: (loading: boolean) => void;
  setIsInitialLoading: (loading: boolean) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setHasPermissions: (granted: boolean) => void;
  setAppResetCounter: (counter: number | ((prev: number) => number)) => void;
}

export interface AppHandlers {
  handlePermissionsComplete: () => Promise<void>;
  handleUserConnectedSkipOnboarding: () => Promise<void>;
  checkAppStatus: () => Promise<void>;
}

export interface NavigationState {
  canAccessApp: boolean;
  initialRoute: string;
  shouldShowPrivacy: boolean;
  shouldShowOnboarding: boolean;
  shouldShowPermissions: boolean;
}

export interface UseAppNavigatorReturn
  extends AppState,
    AppHandlers,
    AppActions {
  navigationState: NavigationState;
}
