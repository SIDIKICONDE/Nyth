import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LUT3DPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (lutPath: string) => void;
}

interface LUTFile {
  id: string;
  name: string;
  path: string;
  size: number;
  addedAt: Date;
}

const STORAGE_KEY = '@nyth_lut3d_files';
const LUT_DIR = `${RNFS.DocumentDirectoryPath}/luts/`;

const LUT3DPicker: React.FC<LUT3DPickerProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const [lutFiles, setLutFiles] = useState<LUTFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadLUTFiles();
      ensureLUTDirectory();
    }
  }, [visible]);

  const ensureLUTDirectory = async () => {
    try {
      const exists = await RNFS.exists(LUT_DIR);
      if (!exists) {
        await RNFS.mkdir(LUT_DIR);
      }
    } catch (error) {
      console.error('Erreur création dossier LUT:', error);
    }
  };

  const loadLUTFiles = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const files = JSON.parse(stored);
        // Vérifier que les fichiers existent toujours
        const existingFiles = await Promise.all(
          files.map(async (file: LUTFile) => {
            const exists = await RNFS.exists(file.path);
            return exists ? file : null;
          })
        );
        setLutFiles(existingFiles.filter(Boolean));
      }
    } catch (error) {
      console.error('Erreur chargement LUTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLUTFiles = async (files: LUTFile[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(files));
      setLutFiles(files);
    } catch (error) {
      console.error('Erreur sauvegarde LUTs:', error);
    }
  };

  const importLUT = async () => {
    try {
      setImporting(true);
      
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory',
      });

      if (result && result[0]) {
        const file = result[0];
        // Vérifier l'extension
        if (!file.name || !file.name.toLowerCase().endsWith('.cube')) {
          Alert.alert('Erreur', 'Veuillez sélectionner un fichier .cube');
          return;
        }

        // Copier le fichier dans le dossier LUT
        const newPath = `${LUT_DIR}${file.name}`;
        await RNFS.copyFile(file.fileCopyUri || file.uri, newPath);

        // Ajouter à la liste
        const newLUT: LUTFile = {
          id: Date.now().toString(),
          name: file.name.replace('.cube', ''),
          path: newPath,
          size: file.size || 0,
          addedAt: new Date(),
        };

        const updatedFiles = [...lutFiles, newLUT];
        await saveLUTFiles(updatedFiles);
        
        Alert.alert('Succès', 'LUT importée avec succès');
      }
    } catch (error) {
      console.error('Erreur import LUT:', error);
      Alert.alert('Erreur', "Impossible d'importer la LUT");
    } finally {
      setImporting(false);
    }
  };

  const deleteLUT = async (lut: LUTFile) => {
    Alert.alert(
      'Supprimer la LUT',
      `Voulez-vous supprimer "${lut.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await RNFS.unlink(lut.path);
              const updatedFiles = lutFiles.filter(f => f.id !== lut.id);
              await saveLUTFiles(updatedFiles);
            } catch (error) {
              console.error('Erreur suppression LUT:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la LUT');
            }
          },
        },
      ]
    );
  };

  const handleSelect = (lut: LUTFile) => {
    onSelect(lut.path);
    onClose();
  };

  const renderLUT = ({ item }: { item: LUTFile }) => (
    <TouchableOpacity
      style={styles.lutItem}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.lutIcon}>
        <MaterialIcon name="cube-outline" size={32} color="#007AFF" />
      </View>
      
      <View style={styles.lutInfo}>
        <Text style={styles.lutName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.lutSize}>
          {(item.size / 1024).toFixed(1)} KB
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteLUT(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
            
            <Text style={styles.title}>LUT 3D</Text>
            
            <TouchableOpacity onPress={importLUT} style={styles.importButton} disabled={importing}>
              {importing ? (
                <ActivityIndicator color="#007AFF" size="small" />
              ) : (
                <Icon name="add" size={28} color="#007AFF" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Importez des fichiers .cube pour appliquer des looks professionnels
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : lutFiles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcon name="cube-off-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>Aucune LUT importée</Text>
              <TouchableOpacity 
                style={styles.importButtonLarge} 
                onPress={importLUT}
                disabled={importing}
              >
                <Icon name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.importButtonText}>Importer une LUT</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={lutFiles}
              renderItem={renderLUT}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}

          {/* Presets de LUT populaires */}
          <View style={styles.presetsSection}>
            <Text style={styles.presetsTitle}>LUTs recommandées</Text>
            <View style={styles.presetsList}>
              <TouchableOpacity style={styles.presetItem}>
                <Text style={styles.presetName}>Teal & Orange</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetItem}>
                <Text style={styles.presetName}>Film Emulation</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetItem}>
                <Text style={styles.presetName}>Cinematic</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    maxHeight: '80%',
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
    paddingVertical: 100,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  importButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  separator: {
    height: 10,
  },
  lutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
  },
  lutIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lutInfo: {
    flex: 1,
    marginLeft: 15,
  },
  lutName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  lutSize: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  deleteButton: {
    padding: 10,
  },
  presetsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetsTitle: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  presetsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  presetName: {
    color: '#fff',
    fontSize: 14,
  },
});

export default LUT3DPicker;
