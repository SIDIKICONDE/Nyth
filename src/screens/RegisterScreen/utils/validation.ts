import { useTranslation } from '../../../hooks/useTranslation';

export const useValidationRules = () => {
  const { t } = useTranslation();

  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return t('auth.register.errors.emailRequired');
    } else if (!emailRegex.test(email)) {
      return t('auth.register.errors.emailInvalid');
    }
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) {
      return t('auth.register.errors.passwordRequired');
    } else if (password.length < 6) {
      return t('auth.register.errors.passwordLength');
    }
    return '';
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): string => {
    if (!confirmPassword) {
      return t('auth.register.errors.confirmPasswordRequired');
    } else if (confirmPassword !== password) {
      return t('auth.register.errors.passwordMismatch');
    }
    return '';
  };

  return {
    validateEmail,
    validatePassword,
    validateConfirmPassword
  };
}; 