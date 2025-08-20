/**
 * Contrôles avancés des filtres - Version Pro
 * Interface complète pour ajuster les 12 paramètres de filtres sans Expo
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { AdvancedFilterParams } from '../../../specs/NativeCameraFiltersModule';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Configuration des contrôles
interface ControlConfig {
  key: keyof AdvancedFilterParams;
  label: string;
  icon: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  description: string;
}

const CONTROLS: ControlConfig[] = [
  {
    key: 'brightness',
    label: 'Luminosité',
    icon: 'brightness-6',
    min: -1,
    max: 1,
    step: 0.01,
    description: 'Ajuste la luminosité globale de l\'image'
  },
  {
    key: 'contrast',
    label: 'Contraste',
    icon: 'contrast-box',
    min: 0,
    max: 2,
    step: 0.01,
    description: 'Contrôle la différence entre les zones claires et sombres'
  },
  {
    key: 'saturation',
    label: 'Saturation',
    icon: 'palette',
    min: 0,
    max: 2,
    step: 0.01,
    description: 'Intensité des couleurs dans l\'image'
  },
  {
    key: 'hue',
    label: 'Teinte',
    icon: 'invert-colors',
    min: -180,
    max: 180,
    step: 1,
    unit: '°',
    description: 'Rotation de la teinte sur la roue chromatique'
  },
  {
    key: 'gamma',
    label: 'Gamma',
    icon: 'gamma',
    min: 0.1,
    max: 3,
    step: 0.01,
    description: 'Correction gamma pour les tons moyens'
  },
  {
    key: 'warmth',
    label: 'Chaleur',
    icon: 'thermometer',
    min: -1,
    max: 1,
    step: 0.01,
    description: 'Balance entre tons chauds (orange) et froids (bleu)'
  },
  {
    key: 'tint',
    label: 'Nuance',
    icon: 'water',
    min: -1,
    max: 1,
    step: 0.01,
    description: 'Balance entre teintes vertes et magenta'
  },
  {
    key: 'exposure',
    label: 'Exposition',
    icon: 'white-balance-sunny',
    min: -2,
    max: 2,
    step: 0.01,
    unit: 'EV',
    description: 'Ajustement de l\'exposition en stops'
  },
  {
    key: 'shadows',
    label: 'Ombres',
    icon: 'moon-waning-crescent',
    min: -1,
    max: 1,
    step: 0.01,
    description: 'Ajustement des zones sombres de l\'image'
  },
  {
    key: 'highlights',
    label: 'Hautes lumières',
    icon: 'white-balance-sunny',
    min: -1,
    max: 1,
    step: 0.01,
    description: 'Ajustement des zones claires de l\'image'
  },
  {
    key: 'vignette',
    label: 'Vignettage',
    icon: 'circle-slice-8',
    min: 0,
    max: 1,
    step: 0.01,
    description: 'Effet de vignette pour concentrer l\'attention'
  },
  {
    key: 'grain',
    label: 'Grain',
    icon: 'dots-hexagon',
    min: 0,
    max: 1,
    step: 0.01,
    description: 'Ajout de grain pour un effet vintage'
  },
];

interface AdvancedFilterControlsProProps {
  params: AdvancedFilterParams;
  onParamsChange: (params: AdvancedFilterParams) => void;
  expertMode?: boolean;
  onShowTooltip?: (tooltipId: string) => void;
}

const AdvancedFilterControlsPro: React.FC<AdvancedFilterControlsProProps> = ({
  params,
  onParamsChange,
  expertMode = false,
  onShowTooltip,
}) => {
  const [expandedControl, setExpandedControl] = useState<string | null>(null);
  const [resetAnimations, setResetAnimations] = useState<{[key: string]: Animated.Value}>({});

  // Valeurs par défaut
  const getDefaultValue = useCallback((key: keyof AdvancedFilterParams): number => {
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
  }, []);

  // Gestionnaire de changement de valeur
  const handleValueChange = useCallback((key: keyof AdvancedFilterParams, value: number) => {
    onParamsChange({
      ...params,
      [key]: value,
    });
  }, [params, onParamsChange]);

  // Réinitialisation d'un contrôle
  const resetControl = useCallback((key: keyof AdvancedFilterParams) => {
    const defaultValue = getDefaultValue(key);

    // Animation de reset
    const anim = new Animated.Value(0);
    setResetAnimations(prev => ({ ...prev, [key]: anim }));

    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      handleValueChange(key, defaultValue);
      setResetAnimations(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    });
  }, [getDefaultValue, handleValueChange]);

  // Réinitialisation de tous les contrôles
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

  // Formatage de la valeur
  const formatValue = useCallback((value: number, control: ControlConfig): string => {
    if (control.unit) {
      return `${value.toFixed(control.step < 1 ? 2 : 0)}${control.unit}`;
    }
    if (control.step < 1) {
      return value.toFixed(2);
    }
    return value.toString();
  }, []);

  // Vérification si un contrôle est modifié
  const isModified = useCallback((key: keyof AdvancedFilterParams): boolean => {
    const currentValue = params[key];
    const defaultValue = getDefaultValue(key);
    return Math.abs(currentValue - defaultValue) > 0.001;
  }, [params, getDefaultValue]);

  // Nombre de contrôles modifiés
  const modifiedCount = CONTROLS.filter(control => isModified(control.key)).length;

  // Rendu d'un contrôle
  const renderControl = (control: ControlConfig) => {
    const value = params[control.key];
    const modified = isModified(control.key);
    const defaultValue = getDefaultValue(control.key);
    const isExpanded = expandedControl === control.key;

    return (
      <View key={control.key} style={styles.control}>
        <TouchableOpacity
          style={styles.controlHeader}
          onPress={() => setExpandedControl(isExpanded ? null : control.key)}
          onLongPress={() => onShowTooltip?.(`control_${control.key}`)}
          activeOpacity={0.7}
        >
          <View style={styles.controlLabel}>
            <MaterialIcon
              name={control.icon as any}
              size={20}
              color={modified ? '#007AFF' : '#999'}
            />
            <Text style={[styles.labelText, modified && styles.labelTextModified]}>
              {control.label}
            </Text>
            {expertMode && (
              <Text style={styles.valueText}>
                {formatValue(value, control)}
              </Text>
            )}
          </View>

          <View style={styles.controlActions}>
            {modified && (
              <TouchableOpacity
                onPress={() => resetControl(control.key)}
                style={styles.resetButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcon name="restore" size={16} color="#007AFF" />
              </TouchableOpacity>
            )}

            <MaterialIcon
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.sliderContainer}>
          <Text style={styles.sliderMin}>{control.min}</Text>
          <Slider
            style={styles.slider}
            value={value}
            onValueChange={(val) => handleValueChange(control.key, val)}
            minimumValue={control.min}
            maximumValue={control.max}
            step={control.step}
            minimumTrackTintColor={modified ? '#007AFF' : '#666'}
            maximumTrackTintColor="rgba(255,255,255,0.2)"
            thumbTintColor="#fff"
          />
          <Text style={styles.sliderMax}>{control.max}</Text>
        </View>

        {isExpanded && (
          <Animated.View style={styles.expandedContent}>
            <Text style={styles.descriptionText}>
              {control.description}
            </Text>

            {expertMode && (
              <View style={styles.expertInfo}>
                <Text style={styles.expertText}>
                  Plage: {control.min} à {control.max}
                </Text>
                <Text style={styles.expertText}>
                  Défaut: {formatValue(defaultValue, control)}
                </Text>
              </View>
            )}

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => handleValueChange(control.key, defaultValue)}
              >
                <Text style={styles.quickButtonText}>Défaut</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => handleValueChange(control.key, (control.min + control.max) / 2)}
              >
                <Text style={styles.quickButtonText}>Milieu</Text>
              </TouchableOpacity>

              {modified && (
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => resetControl(control.key)}
                >
                  <Text style={styles.quickButtonText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contrôles avancés</Text>

        <View style={styles.headerActions}>
          {modifiedCount > 0 && (
            <TouchableOpacity
              onPress={resetAll}
              style={styles.resetAllButton}
            >
              <MaterialIcon name="restore" size={16} color="#007AFF" />
              <Text style={styles.resetAllText}>Reset ({modifiedCount})</Text>
            </TouchableOpacity>
          )}

          {expertMode && (
            <View style={styles.expertIndicator}>
              <MaterialIcon name="professional-hexagon" size={14} color="#FFA500" />
              <Text style={styles.expertIndicatorText}>PRO</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CONTROLS.map(renderControl)}

        {/* Espacement final */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Indicateur de modifications */}
      {modifiedCount > 0 && (
        <View style={styles.modificationIndicator}>
          <Text style={styles.modificationText}>
            {modifiedCount} paramètre{modifiedCount > 1 ? 's' : ''} modifié{modifiedCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  resetAllText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  expertIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  expertIndicatorText: {
    color: '#FFA500',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  control: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    overflow: 'hidden',
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  controlLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  labelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  labelTextModified: {
    color: '#007AFF',
  },
  valueText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  controlActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetButton: {
    padding: 5,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 12,
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
  expandedContent: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  descriptionText: {
    color: '#999',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  expertInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  expertText: {
    color: '#666',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
  modificationIndicator: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  modificationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AdvancedFilterControlsPro;
