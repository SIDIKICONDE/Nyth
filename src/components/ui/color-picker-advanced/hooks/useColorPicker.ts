import { useState, useEffect, useCallback } from 'react';
import { UseColorPickerState, UseColorPickerActions } from '../types';
import { isValidHex, normalizeHex } from '../utils/colorUtils';

interface UseColorPickerProps {
  initialColor: string;
  onChange: (color: string) => void;
}

interface UseColorPickerReturn extends UseColorPickerState, UseColorPickerActions {}

export const useColorPicker = ({ 
  initialColor, 
  onChange 
}: UseColorPickerProps): UseColorPickerReturn => {
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [showExtendedPicker, setShowExtendedPicker] = useState(false);

  // Synchroniser avec la couleur initiale
  useEffect(() => {
    setSelectedColor(initialColor);
  }, [initialColor]);

  // Basculer l'affichage du picker étendu
  const toggleExtendedPicker = useCallback(() => {
    setShowExtendedPicker(prev => !prev);
  }, []);

  // Gérer la sélection d'une couleur
  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
    onChange(color);
  }, [onChange]);

  // Gérer la saisie manuelle de couleur hex
  const handleHexChange = useCallback((text: string) => {
    const hex = normalizeHex(text);
    
    // Valider le format hex
    if (isValidHex(hex)) {
      setSelectedColor(hex);
      onChange(hex);
    } else if (hex.length <= 7) {
      // Permettre la saisie mais ne pas déclencher onChange
      setSelectedColor(hex);
    }
  }, [onChange]);

  return {
    selectedColor,
    showExtendedPicker,
    setSelectedColor,
    toggleExtendedPicker,
    handleColorSelect,
    handleHexChange,
  };
}; 