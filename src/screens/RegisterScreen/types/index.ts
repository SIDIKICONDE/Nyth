export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterFormErrors {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterFormState {
  data: RegisterFormData;
  errors: RegisterFormErrors;
  isPasswordVisible: boolean;
  isConfirmPasswordVisible: boolean;
  isLoading: boolean;
}

export interface FormFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  secureTextEntry?: boolean;
  isPasswordVisible?: boolean;
  onTogglePasswordVisibility?: () => void;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  iconName: string;
}

export interface RegisterHeaderProps {
  title: string;
  subtitle: string;
}

export interface RegisterFooterProps {
  onNavigateToLogin: () => void;
} 