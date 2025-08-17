export interface LoginScreenProps {
  // Props spécifiques au LoginScreen si nécessaire
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginValidationErrors {
  emailError: string;
  passwordError: string;
  emailWarning?: string;
  emailSuggestions?: string[];
}

export interface LoginHookReturn {
  // Login logic
  handleLogin: () => Promise<void>;
  handleForgotPassword: () => void;
  isLoading: boolean;

  // Form data
  email: string;
  password: string;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  isPasswordVisible: boolean;
  setIsPasswordVisible: (visible: boolean) => void;

  // Validation
  emailError: string;
  passwordError: string;
  emailWarning?: string;
  emailSuggestions?: string[];
  showSuggestionAlert?: boolean;
  validateEmail: (email: string) => boolean;
  validatePassword: (password: string) => boolean;
  handleEmailSuggestionSelect: (suggestion: string) => void;
  dismissSuggestionAlert?: () => void;
}
