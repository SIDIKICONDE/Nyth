import { ReactNode } from "react";

export interface User {
  uid: string;
  email: string | null;
  name: string | null;
  displayName?: string | null;
  photoURL: string | null;
  createdAt?: Date;
  isGuest?: boolean;
  emailVerified: boolean;
  provider?: "email" | "google" | "apple";
}

export interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signInAsGuest: () => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: {
    name?: string;
    photoURL?: string;
  }) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  changeEmail: (newEmail: string, currentPassword: string) => Promise<boolean>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<boolean>;
  deleteAccount: (password: string) => Promise<boolean>;

  refreshAuthState: () => Promise<void>;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export interface AuthStateNotification {
  user: User | null;
  reason: string;
}
