import { useValidationRules } from '../utils/validation';
import { RegisterFormData } from '../types';

export function useRegisterValidation() {
  const { validateEmail, validatePassword, validateConfirmPassword } = useValidationRules();

  const validateForm = (formData: RegisterFormData) => {
    const errors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.confirmPassword, formData.password)
    };

    const isValid = !errors.email && !errors.password && !errors.confirmPassword;

    return { errors, isValid };
  };

  const validateField = (field: keyof RegisterFormData, value: string, formData?: RegisterFormData) => {
    switch (field) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return validateConfirmPassword(value, formData?.password || '');
      default:
        return '';
    }
  };

  return {
    validateForm,
    validateField,
    validateEmail,
    validatePassword,
    validateConfirmPassword
  };
} 