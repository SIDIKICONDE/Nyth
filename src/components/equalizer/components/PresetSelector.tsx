import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Animated,
  Platform
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../../contexts/ThemeContext';
import { EqualizerPreset } from '../types';

interface PresetSelectorProps {
  presets: EqualizerPreset[];
  currentPreset: string;
  onPresetSelect: (presetName: string) => void;
  onSavePreset?: (name: string, gains: number[]) => Promise<boolean>;
  onDeletePreset?: (name: string) => Promise<boolean>;
  isCustomPreset?: (name: string) => boolean;
  currentGains?: number[];
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  presets,
  currentPreset,
  onPresetSelect,
  onSavePreset,
  onDeletePreset,
  isCustomPreset,
  currentGains = []
}) => {
  const { currentTheme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(currentPreset);
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Animation d'ouverture/fermeture
  const toggleModal = useCallback(() => {
    if (showModal) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start(() => setShowModal(false));
    } else {
      setShowModal(true);
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 7
      }).start();
    }
  }, [showModal, animatedValue]);

  // Sélectionner un preset
  const handlePresetSelect = useCallback((presetName: string) => {
    setSelectedPreset(presetName);
    onPresetSelect(presetName);
    toggleModal();
  }, [onPresetSelect, toggleModal]);

  // Sauvegarder un nouveau preset
  const handleSavePreset = useCallback(async () => {
    if (!onSavePreset || !newPresetName.trim()) return;

    const name = newPresetName.trim();
    
    // Vérifier si le nom existe déjà
    if (presets.some(p => p.name === name)) {
      Alert.alert(
        'Nom déjà utilisé',
        'Un preset avec ce nom existe déjà. Voulez-vous le remplacer ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Remplacer',
            style: 'destructive',
            onPress: async () => {
              const success = await onSavePreset(name, currentGains);
              if (success) {
                setShowSaveModal(false);
                setNewPresetName('');
                handlePresetSelect(name);
              }
            }
          }
        ]
      );
      return;
    }

    const success = await onSavePreset(name, currentGains);
    if (success) {
      setShowSaveModal(false);
      setNewPresetName('');
      handlePresetSelect(name);
    }
  }, [newPresetName, presets, currentGains, onSavePreset, handlePresetSelect]);

  // Supprimer un preset
  const handleDeletePreset = useCallback((presetName: string) => {
    if (!onDeletePreset || !isCustomPreset?.(presetName)) return;

    Alert.alert(
      'Supprimer le preset',
      `Êtes-vous sûr de vouloir supprimer le preset "${presetName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const success = await onDeletePreset(presetName);
            if (success && selectedPreset === presetName) {
              handlePresetSelect('Flat');
            }
          }
        }
      ]
    );
  }, [onDeletePreset, isCustomPreset, selectedPreset, handlePresetSelect]);

  const modalScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1]
  });

  const modalOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  return (
    <>
      {/* Bouton de sélection */}
      <Pressable
        style={[styles.selectorButton, { backgroundColor: currentTheme.colors.surface }]}
        onPress={toggleModal}
      >
        <Icon name="tune" size={20} color={currentTheme.colors.primary} />
        <Text style={[styles.selectorText, { color: currentTheme.colors.text }]}>
          {selectedPreset}
        </Text>
        <Icon name="arrow-drop-down" size={24} color={currentTheme.colors.textSecondary} />
      </Pressable>

      {/* Modal de sélection */}
      <Modal
        visible={showModal}
        transparent
        animationType="none"
        onRequestClose={toggleModal}
      >
        <Pressable style={styles.modalOverlay} onPress={toggleModal}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }]
              }
            ]}
          >
            <BlurView
              style={StyleSheet.absoluteFillObject}
              blurType={currentTheme.isDark ? 'dark' : 'light'}
              blurAmount={20}
            />
            
            <View style={[styles.modalInner, { backgroundColor: currentTheme.colors.card + 'F0' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>
                  Presets d'égaliseur
                </Text>
                {onSavePreset && (
                  <Pressable
                    style={[styles.saveButton, { backgroundColor: currentTheme.colors.primary }]}
                    onPress={() => {
                      toggleModal();
                      setTimeout(() => setShowSaveModal(true), 300);
                    }}
                  >
                    <Icon name="add" size={20} color="#FFFFFF" />
                  </Pressable>
                )}
              </View>

              <ScrollView 
                style={styles.presetList}
                showsVerticalScrollIndicator={false}
              >
                {presets.map((preset) => {
                  const isSelected = preset.name === selectedPreset;
                  const isCustom = isCustomPreset?.(preset.name) || false;
                  
                  return (
                    <Pressable
                      key={preset.name}
                      style={[
                        styles.presetItem,
                        {
                          backgroundColor: isSelected 
                            ? currentTheme.colors.primary + '20'
                            : 'transparent',
                          borderColor: isSelected 
                            ? currentTheme.colors.primary 
                            : currentTheme.colors.border
                        }
                      ]}
                      onPress={() => handlePresetSelect(preset.name)}
                      onLongPress={() => isCustom && handleDeletePreset(preset.name)}
                    >
                      <View style={styles.presetInfo}>
                        <Text style={[
                          styles.presetName,
                          {
                            color: isSelected ? currentTheme.colors.primary : currentTheme.colors.text,
                            fontWeight: isSelected ? '600' : '400'
                          }
                        ]}>
                          {preset.name}
                        </Text>
                        {isCustom && (
                          <Text style={[styles.customLabel, { color: currentTheme.colors.textSecondary }]}>
                            Personnalisé
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <Icon name="check" size={20} color={currentTheme.colors.primary} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Modal de sauvegarde */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowSaveModal(false)}
        >
          <View style={[styles.saveModalContent, { backgroundColor: currentTheme.colors.card }]}>
            <Text style={[styles.saveModalTitle, { color: currentTheme.colors.text }]}>
              Sauvegarder le preset
            </Text>
            
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  borderColor: currentTheme.colors.border
                }
              ]}
              placeholder="Nom du preset"
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={newPresetName}
              onChangeText={setNewPresetName}
              autoFocus
              maxLength={30}
            />

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.cancelButton, { backgroundColor: currentTheme.colors.surface }]}
                onPress={() => {
                  setShowSaveModal(false);
                  setNewPresetName('');
                }}
              >
                <Text style={[styles.buttonText, { color: currentTheme.colors.text }]}>
                  Annuler
                </Text>
              </Pressable>
              
              <Pressable
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: newPresetName.trim() 
                      ? currentTheme.colors.primary 
                      : currentTheme.colors.surface,
                    opacity: newPresetName.trim() ? 1 : 0.5
                  }
                ]}
                onPress={handleSavePreset}
                disabled={!newPresetName.trim()}
              >
                <Text style={[
                  styles.buttonText,
                  { color: newPresetName.trim() ? '#FFFFFF' : currentTheme.colors.textSecondary }
                ]}>
                  Sauvegarder
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalInner: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetList: {
    maxHeight: 400,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 16,
  },
  customLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  saveModalContent: {
    width: '100%',
    maxWidth: 350,
    padding: 24,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      }
    })
  },
  saveModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  }
});
