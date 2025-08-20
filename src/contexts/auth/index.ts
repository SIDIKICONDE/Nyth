// Exports principaux
export { AuthProvider } from "./AuthProvider";
export { useAuth } from "./context";

// Types
export type {
  AuthContextType,
  AuthProviderProps,
  AuthStateNotification,
  User,
} from "./types";

// Utilitaires pour usage externe si nécessaire
export { hasUserChanged, isUserFirebase, isUserGuest } from "./utils";

// Fonctions de stockage pour usage externe si nécessaire
export { clearAuthStorage, getSavedUser, saveUser } from "./storage";

// Fonctions Firebase pour usage externe si nécessaire
export {
  changeUserEmail,
  changeUserPassword,
  createAccount,
  deleteUserAccount,
  sendPasswordReset,
  signInWithEmail,
  signOutFirebase,
  updateUserProfileFirebase,
} from "./firebase";
