import { RegisterFormData, RegisterFormErrors } from '../types';

export const INITIAL_FORM_DATA: RegisterFormData = {
  email: '',
  password: '',
  confirmPassword: ''
};

export const INITIAL_FORM_ERRORS: RegisterFormErrors = {
  email: '',
  password: '',
  confirmPassword: ''
};

export const ANIMATION_DELAYS = {
  HEADER: 100,
  EMAIL_FIELD: 200,
  PASSWORD_FIELD: 300,
  CONFIRM_PASSWORD_FIELD: 400,
  SUBMIT_BUTTON: 500,
  FOOTER: 600
} as const; 