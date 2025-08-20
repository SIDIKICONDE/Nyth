export interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, icon: string, description: string) => Promise<void>;
}

export interface CategoryFormData {
  name: string;
  description: string;
  selectedIcon: string;
}

export interface HeaderProps {
  onClose: () => void;
  onSubmit: () => void;
  isValidName: boolean;
  isSubmitting: boolean;
}

export interface NameFieldProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  autoFocus?: boolean;
}

export interface IconSelectorProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
  options: string[];
}

export interface DescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}
