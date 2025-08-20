export interface CategoryPickerProps {
  value?: string;
  onCategoryChange: (categoryId: string) => void;
  error?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
  isCustom?: boolean;
}

export interface SelectedCategoryDisplayProps {
  selectedCategory: Category | undefined;
  isCustomCategory: boolean;
  onPress: () => void;
  isOpen: boolean;
  error?: string;
}

export interface CategoryDropdownProps {
  isOpen: boolean;
  defaultCategories: Category[];
  customCategories: Category[];
  selectedValue?: string;
  onCategorySelect: (categoryId: string) => void;
  onAddCategory: () => void;
  onClose: () => void;
}

export interface CategoryOptionProps {
  category: Category;
  isSelected: boolean;
  onSelect: (categoryId: string) => void;
}

export interface AddCategoryButtonProps {
  onPress: () => void;
}

export interface CategorySeparatorProps {
  title: string;
}
