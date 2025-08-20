import React, { useState, useEffect } from 'react';
import { Switch } from 'react-native';

interface InstantSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  trackColor: { false: string; true: string };
  thumbColor: string;
  disabled?: boolean;
}

export const InstantSwitch: React.FC<InstantSwitchProps> = ({
  value,
  onValueChange,
  trackColor,
  thumbColor,
  disabled = false,
}) => {
  // État local pour réaction instantanée
  const [localValue, setLocalValue] = useState(value);

  // Synchroniser avec la valeur externe
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: boolean) => {
    // 1. Mise à jour instantanée de l'UI
    setLocalValue(newValue);
    
    // 2. Déclencher la mise à jour globale (en arrière-plan)
    onValueChange(newValue);
  };

  return (
    <Switch
      value={localValue}
      onValueChange={handleChange}
      trackColor={trackColor}
      thumbColor={thumbColor}
      disabled={disabled}
    />
  );
}; 