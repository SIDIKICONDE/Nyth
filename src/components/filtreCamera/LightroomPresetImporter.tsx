/**
 * Importateur de presets Lightroom - Version Pro
 * Support pour les fichiers .xmp et .xml de Lightroom
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { XMLParser } from 'fast-xml-parser';

interface LightroomPreset {
  id: string;
  name: string;
  fileName: string;
  path: string;
  importedAt: Date;
  settings: {
    exposure?: number;
    contrast?: number;
    highlights?: number;
    shadows?: number;
    whites?: number;
    blacks?: number;
    clarity?: number;
    vibrance?: number;
    saturation?: number;
    temperature?: number;
    tint?: number;
    hue?: number;
    saturationHue?: number;
    luminance?: number;
  };
  preview?: string;
  favorite: boolean;
}

interface LightroomPresetImporterProps {
  visible: boolean;
  onClose: () => void;
  onImport: (preset: LightroomPreset) => void;
}

const STORAGE_KEY = '@nyth_lightroom_presets';

const LightroomPresetImporter: React.FC<LightroomPresetImporterProps> = ({
  visible,
  onClose,
  onImport,
}) => {
  const [presets, setPresets] = useState<LightroomPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      loadPresets();
    }
  }, [visible]);

  const loadPresets = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedPresets = JSON.parse(stored).map((p: any) => ({
          ...p,
          importedAt: new Date(p.importedAt),
        }));
        setPresets(parsedPresets);
      }
    } catch (error) {
      console.error('Erreur chargement presets Lightroom:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePresets = async (newPresets: LightroomPreset[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
    } catch (error) {
      console.error('Erreur sauvegarde presets Lightroom:', error);
    }
  };

  // Parser les fichiers XMP de Lightroom
  const parseXMPFile = useCallback(async (filePath: string): Promise<Partial<LightroomPreset['settings']>> => {
    try {
      const content = await RNFS.readFile(filePath, 'utf8');
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        textNodeName: 'value',
        parseAttributeValue: true,
        parseTagValue: true,
      });

      const result = parser.parse(content);

      // Extraire les réglages Lightroom
      const settings: Partial<LightroomPreset['settings']> = {};

      // Navigation dans la structure XMP
      const xmp = result['x:xmpmeta']?.['rdf:RDF']?.['rdf:Description'];

      if (xmp) {
        // Exposition
        if (xmp['crs:Exposure2012']) {
          settings.exposure = parseFloat(xmp['crs:Exposure2012']);
        }

        // Contraste
        if (xmp['crs:Contrast2012']) {
          settings.contrast = parseFloat(xmp['crs:Contrast2012']) / 100 + 1;
        }

        // Tons clairs
        if (xmp['crs:Highlights2012']) {
          settings.highlights = parseFloat(xmp['crs:Highlights2012']) / 100;
        }

        // Tons sombres
        if (xmp['crs:Shadows2012']) {
          settings.shadows = parseFloat(xmp['crs:Shadows2012']) / 100;
        }

        // Blancs
        if (xmp['crs:Whites2012']) {
          settings.whites = parseFloat(xmp['crs:Whites2012']) / 100;
        }

        // Noirs
        if (xmp['crs:Blacks2012']) {
          settings.blacks = parseFloat(xmp['crs:Blacks2012']) / 100;
        }

        // Clarté
        if (xmp['crs:Clarity2012']) {
          settings.clarity = parseFloat(xmp['crs:Clarity2012']) / 100;
        }

        // Vibrance
        if (xmp['crs:Vibrance2012']) {
          settings.vibrance = parseFloat(xmp['crs:Vibrance2012']) / 100;
        }

        // Saturation globale
        if (xmp['crs:Saturation2012']) {
          settings.saturation = parseFloat(xmp['crs:Saturation2012']) / 100 + 1;
        }

        // Température
        if (xmp['crs:Temperature']) {
          settings.temperature = parseFloat(xmp['crs:Temperature']);
        }

        // Teinte
        if (xmp['crs:Tint']) {
          settings.tint = parseFloat(xmp['crs:Tint']) / 100;
        }

        // Balance des couleurs (HSL)
        if (xmp['crs:HueAdjustmentRed']) {
          settings.hue = parseFloat(xmp['crs:HueAdjustmentRed']) / 100;
        }
        if (xmp['crs:SaturationAdjustmentRed']) {
          settings.saturationHue = parseFloat(xmp['crs:SaturationAdjustmentRed']) / 100 + 1;
        }
        if (xmp['crs:LuminanceAdjustmentRed']) {
          settings.luminance = parseFloat(xmp['crs:LuminanceAdjustmentRed']) / 100;
        }
      }

      return settings;
    } catch (error) {
      console.error('Erreur parsing XMP:', error);
      throw new Error('Format de fichier XMP non reconnu');
    }
  }, []);

  // Importer un preset Lightroom
  const importPreset = useCallback(async () => {
    try {
      setImporting(true);

      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory',
      });

      if (result && result[0]) {
        const file = result[0];

        // Vérifier l'extension
        if (!file.name || (!file.name.toLowerCase().endsWith('.xmp') && !file.name.toLowerCase().endsWith('.xml'))) {
          Alert.alert(
            'Format non supporté',
            'Veuillez sélectionner un fichier .xmp ou .xml de Lightroom.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Parser le fichier
        const settings = await parseXMPFile(file.fileCopyUri || file.uri);

        // Créer le preset
        const newPreset: LightroomPreset = {
          id: Date.now().toString(),
          name: file.name.replace(/\.(xmp|xml)$/i, ''),
          fileName: file.name,
          path: file.fileCopyUri || file.uri,
          importedAt: new Date(),
          settings,
          favorite: false,
        };

        // Ajouter à la liste
        const updatedPresets = [...presets, newPreset];
        setPresets(updatedPresets);
        await savePresets(updatedPresets);

        Alert.alert(
          '✅ Preset Lightroom importé !',
          `"${newPreset.name}" a été ajouté à votre collection.`,
          [{ text: 'Super !' }]
        );

        console.log('🎨 Preset Lightroom importé:', newPreset.name, settings);
      }
    } catch (error) {
      console.error('❌ Erreur import preset Lightroom:', error);
      Alert.alert(
        'Erreur d\'import',
        'Impossible d\'importer le preset. Vérifiez que le fichier est valide.',
        [{ text: 'OK' }]
      );
    } finally {
      setImporting(false);
    }
  }, [presets, parseXMPFile]);

  const deletePreset = useCallback(async (preset: LightroomPreset) => {
    Alert.alert(
      'Supprimer le preset',
      `Voulez-vous supprimer "${preset.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Retirer de la liste
              const updatedPresets = presets.filter(p => p.id !== preset.id);
              setPresets(updatedPresets);
              await savePresets(updatedPresets);

              console.log('🗑️ Preset Lightroom supprimé:', preset.name);
            } catch (error) {
              console.error('Erreur suppression preset:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le preset');
            }
          },
        },
      ]
    );
  }, [presets]);

  const toggleFavorite = useCallback(async (presetId: string) => {
    const updatedPresets = presets.map(preset =>
      preset.id === presetId
        ? { ...preset, favorite: !preset.favorite }
        : preset
    );
    setPresets(updatedPresets);
    await savePresets(updatedPresets);
  }, [presets]);

  const applyPreset = useCallback((preset: LightroomPreset) => {
    // Convertir les réglages Lightroom vers les paramètres de l'interface
    const filterParams = {
      brightness: (preset.settings.exposure || 0) * 0.5,
      contrast: preset.settings.contrast || 1,
      saturation: preset.settings.saturation || 1,
      hue: (preset.settings.hue || 0) * 180,
      gamma: 1 + (preset.settings.clarity || 0) * 0.2,
      warmth: (preset.settings.temperature || 0) / 100,
      tint: preset.settings.tint || 0,
      shadows: preset.settings.shadows || 0,
      highlights: preset.settings.highlights || 0,
    };

    // Appliquer via le callback
    onImport({
      ...preset,
      settings: filterParams,
    });

    onClose();
  }, [onImport, onClose]);

  const renderPreset = useCallback(({ item }: { item: LightroomPreset }) => (
    <TouchableOpacity
      style={styles.presetCard}
      onPress={() => applyPreset(item)}
      activeOpacity={0.8}
    >
      <View style={styles.presetHeader}>
        <View style={styles.lightroomBadge}>
          <MaterialIcon name="lightroom" size={16} color="#fff" />
        </View>

        <TouchableOpacity
          style={[styles.favoriteButton, item.favorite && styles.favoriteButtonActive]}
          onPress={() => toggleFavorite(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcon
            name={item.favorite ? "heart" : "heart-outline"}
            size={20}
            color={item.favorite ? "#FF6B6B" : "#666"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.presetContent}>
        <Text style={styles.presetName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.presetFileName} numberOfLines={1}>
          {item.fileName}
        </Text>

        <View style={styles.presetMeta}>
          <Text style={styles.presetSettingsCount}>
            {Object.keys(item.settings).length} réglages
          </Text>
          <Text style={styles.presetDate}>
            {item.importedAt.toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.settingsPreview}>
          {Object.entries(item.settings).slice(0, 3).map(([key, value]) => (
            <View key={key} style={styles.settingChip}>
              <Text style={styles.settingText}>
                {key}: {typeof value === 'number' ? value.toFixed(2) : value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deletePreset(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [applyPreset, toggleFavorite, deletePreset]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <BlurView
          blurType="dark"
          blurAmount={Platform.OS === 'ios' ? 80 : 100}
          style={StyleSheet.absoluteFillObject}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={onClose}
            activeOpacity={1}
          />
        </BlurView>

        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.title}>📷 Import Lightroom</Text>

            <TouchableOpacity
              onPress={importPreset}
              style={styles.importButton}
              disabled={importing}
            >
              {importing ? (
                <ActivityIndicator color="#007AFF" size="small" />
              ) : (
                <Icon name="add" size={28} color="#007AFF" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Importez vos presets Lightroom (.xmp) et appliquez-les directement !
          </Text>

          {/* Liste des presets */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Chargement des presets...</Text>
            </View>
          ) : (
            <FlatList
              data={presets}
              renderItem={renderPreset}
              keyExtractor={(item) => item.id}
              style={styles.presetList}
              contentContainerStyle={styles.presetListContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}

          {/* Guide d'utilisation */}
          {!loading && presets.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialIcon name="lightroom" size={64} color="#666" />
              <Text style={styles.emptyText}>Aucun preset Lightroom</Text>

              <TouchableOpacity
                style={styles.importGuideButton}
                onPress={importPreset}
                disabled={importing}
              >
                <Icon name="cloud-upload-outline" size={24} color="#fff" />
                <Text style={styles.importGuideText}>Importer un preset</Text>
              </TouchableOpacity>

              <Text style={styles.guideText}>
                💡 Exportez vos presets depuis Lightroom (Fichier → Export) puis importez-les ici !
              </Text>
            </View>
          )}

          {/* Stats */}
          {presets.length > 0 && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {presets.length} preset{presets.length > 1 ? 's' : ''} •
                {presets.filter(p => p.favorite).length} favori{presets.filter(p => p.favorite).length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
    paddingBottom: 40,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    padding: 5,
  },
  importButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    paddingVertical: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  presetList: {
    flex: 1,
  },
  presetListContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  separator: {
    height: 10,
  },
  presetCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  lightroomBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  favoriteButton: {
    padding: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  favoriteButtonActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  presetContent: {
    flex: 1,
  },
  presetName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  presetFileName: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  presetMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  presetSettingsCount: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  presetDate: {
    color: '#666',
    fontSize: 11,
  },
  settingsPreview: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  settingChip: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  settingText: {
    color: '#007AFF',
    fontSize: 10,
    fontWeight: '500',
  },
  deleteButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  importGuideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
  },
  importGuideText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  guideText: {
    color: '#999',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  statsText: {
    color: '#666',
    fontSize: 12,
  },
});

export default LightroomPresetImporter;
