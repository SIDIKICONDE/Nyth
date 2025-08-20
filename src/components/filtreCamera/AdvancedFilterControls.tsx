import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { AdvancedFilterParams } from '../../../specs/NativeCameraFiltersModule';

interface AdvancedFilterControlsProps {
  params: AdvancedFilterParams;
  onParamsChange: (params: AdvancedFilterParams) => void;
}

interface ControlConfig {
  key: keyof AdvancedFilterParams;
  label: string;
  icon: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

const CONTROLS: ControlConfig[] = [
  { key: 'brightness', label: 'Luminosité', icon: 'brightness-6', min: -1, max: 1, step: 0.01 },
  { key: 'contrast', label: 'Contraste', icon: 'contrast-box', min: 0, max: 2, step: 0.01 },
  { key: 'saturation', label: 'Saturation', icon: 'palette', min: 0, max: 2, step: 0.01 },
  { key: 'hue', label: 'Teinte', icon: 'invert-colors', min: -180, max: 180, step: 1, unit: '°' },
  { key: 'gamma', label: 'Gamma', icon: 'gamma', min: 0.1, max: 3, step: 0.01 },
  { key: 'warmth', label: 'Chaleur', icon: 'thermometer', min: -1, max: 1, step: 0.01 },
  { key: 'tint', label: 'Nuance', icon: 'water', min: -1, max: 1, step: 0.01 },
  { key: 'exposure', label: 'Exposition', icon: 'white-balance-sunny', min: -2, max: 2, step: 0.01, unit: 'EV' },
  { key: 'shadows', label: 'Ombres', icon: 'moon-waning-crescent', min: -1, max: 1, step: 0.01 },
  { key: 'highlights', label: 'Hautes lumières', icon: 'white-balance-sunny', min: -1, max: 1, step: 0.01 },
  { key: 'vignette', label: 'Vignettage', icon: 'circle-slice-8', min: 0, max: 1, step: 0.01 },
  { key: 'grain', label: 'Grain', icon: 'dots-hexagon', min: 0, max: 1, step: 0.01 },
];

const AdvancedFilterControls: React.FC<AdvancedFilterControlsProps> = ({
  params,
  onParamsChange,
}) => {
  const handleValueChange = useCallback((key: keyof AdvancedFilterParams, value: number) => {
    onParamsChange({
      ...params,
      [key]: value,
    });
  }, [params, onParamsChange]);

  const resetControl = useCallback((key: keyof AdvancedFilterParams, defaultValue: number) => {
    handleValueChange(key, defaultValue);
  }, [handleValueChange]);

  const getDefaultValue = (key: keyof AdvancedFilterParams): number => {
    const defaults: AdvancedFilterParams = {
      brightness: 0,
      contrast: 1,
      saturation: 1,
      hue: 0,
      gamma: 1,
      warmth: 0,
      tint: 0,
      exposure: 0,
      shadows: 0,
      highlights: 0,
      vignette: 0,
      grain: 0,
    };
    return defaults[key];
  };

  const formatValue = (value: number, control: ControlConfig): string => {
    if (control.unit) {
      return `${value.toFixed(control.step < 1 ? 2 : 0)}${control.unit}`;
    }
    if (control.step < 1) {
      return value.toFixed(2);
    }
    return value.toString();
  };

  const renderControl = (control: ControlConfig) => {
    const value = params[control.key];
    const defaultValue = getDefaultValue(control.key);
    const isModified = Math.abs(value - defaultValue) > 0.001;

    return (
      <View key={control.key} style={styles.control}>
        <View style={styles.controlHeader}>
          <View style={styles.controlLabel}>
            <MaterialIcon 
              name={control.icon as any} 
              size={20} 
              color={isModified ? '#007AFF' : '#999'} 
            />
            <Text style={[styles.labelText, isModified && styles.labelTextModified]}>
              {control.label}
            </Text>
          </View>
          <View style={styles.valueContainer}>
            <Text style={[styles.valueText, isModified && styles.valueTextModified]}>
              {formatValue(value, control)}
            </Text>
            {isModified && (
              <TouchableOpacity
                onPress={() => resetControl(control.key, defaultValue)}
                style={styles.resetButton}
              >
                <MaterialIcon name="restore" size={16} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderMin}>{control.min}</Text>
          <Slider
            style={styles.slider}
            value={value}
            onValueChange={(val) => handleValueChange(control.key, val)}
            minimumValue={control.min}
            maximumValue={control.max}
            step={control.step}
            minimumTrackTintColor={isModified ? '#007AFF' : '#666'}
            maximumTrackTintColor="rgba(255,255,255,0.2)"
            thumbTintColor="#fff"
          />
          <Text style={styles.sliderMax}>{control.max}</Text>
        </View>
      </View>
    );
  };

  const resetAll = useCallback(() => {
    const defaults: AdvancedFilterParams = {
      brightness: 0,
      contrast: 1,
      saturation: 1,
      hue: 0,
      gamma: 1,
      warmth: 0,
      tint: 0,
      exposure: 0,
      shadows: 0,
      highlights: 0,
      vignette: 0,
      grain: 0,
    };
    onParamsChange(defaults);
  }, [onParamsChange]);

  const hasModifications = CONTROLS.some(control => {
    const value = params[control.key];
    const defaultValue = getDefaultValue(control.key);
    return Math.abs(value - defaultValue) > 0.001;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres avancés</Text>
        {hasModifications && (
          <TouchableOpacity onPress={resetAll} style={styles.resetAllButton}>
            <MaterialIcon name="restore" size={20} color="#007AFF" />
            <Text style={styles.resetAllText}>Réinitialiser</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CONTROLS.map(renderControl)}
      </ScrollView>
    </View>
  );
};

// Import manquant
import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  resetAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  resetAllText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  control: {
    marginBottom: 25,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  labelTextModified: {
    color: '#007AFF',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  valueTextModified: {
    color: '#007AFF',
  },
  resetButton: {
    marginLeft: 8,
    padding: 4,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  sliderMin: {
    color: '#666',
    fontSize: 11,
    minWidth: 30,
    textAlign: 'center',
  },
  sliderMax: {
    color: '#666',
    fontSize: 11,
    minWidth: 30,
    textAlign: 'center',
  },
});

export default AdvancedFilterControls;
