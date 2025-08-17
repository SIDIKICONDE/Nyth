import { useState } from 'react';
import { RegisterFormData, RegisterFormErrors } from '../types';
import { INITIAL_FORM_DATA, INITIAL_FORM_ERRORS } from '../utils/constants';

export function useRegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<RegisterFormErrors>(INITIAL_FORM_ERRORS);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur quand l'utilisateur tape
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const setFieldError = (field: keyof RegisterFormErrors, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const clearErrors = () => {
    setErrors(INITIAL_FORM_ERRORS);
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors(INITIAL_FORM_ERRORS);
    setIsPasswordVisible(false);
    setIsConfirmPasswordVisible(false);
    setIsLoading(false);
  };

  return {
    // État
    formData,
    errors,
    isPasswordVisible,
    isConfirmPasswordVisible,
    isLoading,
    
    // Actions
    updateField,
    setFieldError,
    clearErrors,
    resetForm,
    setIsPasswordVisible,
    setIsConfirmPasswordVisible,
    setIsLoading
  };
} 