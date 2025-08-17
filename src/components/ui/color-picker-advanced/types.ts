export interface ColorPickerAdvancedProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  showLabel?: boolean;
  showHex?: boolean;
  showPreview?: boolean;
  presetColors?: string[];
  compact?: boolean;
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface ColorPreviewProps {
  color: string;
  onHexChange: (hex: string) => void;
  showHex: boolean;
}

export interface ColorPaletteProps {
  colors: string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
  compact?: boolean;
}

export interface ExtendedColorPickerProps {
  colors: string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
  isVisible: boolean;
}

export interface ColorOptionProps {
  color: string;
  isSelected: boolean;
  onSelect: () => void;
  compact?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export interface UseColorPickerState {
  selectedColor: string;
  showExtendedPicker: boolean;
}

export interface UseColorPickerActions {
  setSelectedColor: (color: string) => void;
  toggleExtendedPicker: () => void;
  handleColorSelect: (color: string) => void;
  handleHexChange: (text: string) => void;
} 