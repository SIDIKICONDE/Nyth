/**
 * Sélecteur LUT 3D - Version Pro
 * Gestion avancée des LUTs sans dépendance Expo
 */

import React, { useState, useCallback, useEffect } from 'react';
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

interface LUTFile {
  id: string;
  name: string;
  path: string;
  size: number;
  addedAt: Date;
  category?: string;
  description?: string;
  preview?: string;
}

interface LUT3DPickerProProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (filterName: string) => void;
}

const STORAGE_KEY = '@nyth_lut3d_files';
const LUT_DIR = `${RNFS.DocumentDirectoryPath}/luts/`;

// LUTs populaires incluses
const POPULAR_LUTS: LUTFile[] = [
  {
    id: 'builtin_teal_orange',
    name: 'Teal & Orange',
    path: 'builtin://teal-orange',
    size: 0,
    addedAt: new Date(),
    category: 'Cinéma',
    description: 'Look cinématographique populaire avec tons teal et orange',
  },
  {
    id: 'builtin_film_stock',
    name: 'Film Stock',
    path: 'builtin://film-stock',
    size: 0,
    addedAt: new Date(),
    category: 'Vintage',
    description: 'Émulation de pellicule cinéma vintage',
  },
  {
    id: 'builtin_blockbuster',
    name: 'Blockbuster',
    path: 'builtin://blockbuster',
    size: 0,
    addedAt: new Date(),
    category: 'Cinéma',
    description: 'Style des films à gros budget',
  },
  {
    id: 'builtin_vintage_warm',
    name: 'Vintage Warm',
    path: 'builtin://vintage-warm',
    size: 0,
    addedAt: new Date(),
    category: 'Vintage',
    description: 'Teintes chaudes des années 70',
  },
];

const LUT3DPickerPro: React.FC<LUT3DPickerProProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const [lutFiles, setLutFiles] = useState<LUTFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (visible) {
      initializeLUTSystem();
    }
  }, [visible]);

  const initializeLUTSystem = async () => {
    try {
      setLoading(true);

      // Créer le dossier LUT s'il n'existe pas
      await ensureLUTDirectory();

      // Charger les LUTs utilisateur
      const userLUTs = await loadUserLUTs();

      // Combiner avec les LUTs intégrées
      const allLUTs = [...POPULAR_LUTS, ...userLUTs];

      setLutFiles(allLUTs);

      // Vérifier l'existence des fichiers
      await validateLUTFiles(allLUTs);
    } catch (error) {
      console.error('Erreur initialisation LUT:', error);
    } finally {
      setLoading(false);
    }
  };

  const ensureLUTDirectory = async () => {
    try {
      const exists = await RNFS.exists(LUT_DIR);
      if (!exists) {
        await RNFS.mkdir(LUT_DIR);
        console.log('✅ Dossier LUT créé');
      }
    } catch (error) {
      console.error('Erreur création dossier LUT:', error);
    }
  };

  const loadUserLUTs = async (): Promise<LUTFile[]> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const files = JSON.parse(stored);
        return files.map((file: any) => ({
          ...file,
          addedAt: new Date(file.addedAt)
        }));
      }
    } catch (error) {
      console.error('Erreur chargement LUTs utilisateur:', error);
    }
    return [];
  };

  const saveUserLUTs = async (files: LUTFile[]) => {
    try {
      // Filtrer les LUTs intégrées (qui ne sont pas sauvegardées)
      const userFiles = files.filter(file => !file.path.startsWith('builtin://'));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userFiles));
    } catch (error) {
      console.error('Erreur sauvegarde LUTs:', error);
    }
  };

  const validateLUTFiles = async (files: LUTFile[]) => {
    try {
      const validationPromises = files.map(async (file) => {
        if (file.path.startsWith('builtin://')) {
          return true; // LUTs intégrées sont toujours valides
        }
        return await RNFS.exists(file.path);
      });

      const validationResults = await Promise.all(validationPromises);

      // Filtrer les fichiers valides
      const validFiles = files.filter((_, index) => validationResults[index]);
      setLutFiles(validFiles);

      // Sauvegarder seulement les fichiers valides
      await saveUserLUTs(validFiles);
    } catch (error) {
      console.error('Erreur validation fichiers LUT:', error);
    }
  };

  const importLUT = useCallback(async () => {
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
          Alert.alert(
            'Format non supporté',
            'Veuillez sélectionner un fichier .cube valide.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Vérifier la taille (max 50MB)
        if (file.size && file.size > 50 * 1024 * 1024) {
          Alert.alert(
            'Fichier trop volumineux',
            'La taille maximale autorisée est de 50MB.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Copier le fichier dans le dossier LUT
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const newPath = `${LUT_DIR}${cleanFileName}`;

        await RNFS.copyFile(file.fileCopyUri || file.uri, newPath);

        // Ajouter à la liste
        const newLUT: LUTFile = {
          id: Date.now().toString(),
          name: cleanFileName.replace('.cube', ''),
          path: newPath,
          size: file.size || 0,
          addedAt: new Date(),
          category: 'Importé',
          description: `LUT importée le ${new Date().toLocaleDateString()}`,
        };

        const updatedFiles = [...lutFiles, newLUT];
        setLutFiles(updatedFiles);
        await saveUserLUTs(updatedFiles);

        Alert.alert(
          '✅ LUT importée !',
          `"${newLUT.name}" a été ajoutée à votre collection.`,
          [{ text: 'Super !' }]
        );

        console.log('✅ LUT importée:', newLUT.name);
      }
    } catch (error) {
      console.error('❌ Erreur import LUT:', error);
      Alert.alert(
        'Erreur d\'import',
        'Impossible d\'importer la LUT. Vérifiez que le fichier est valide.',
        [{ text: 'OK' }]
      );
    } finally {
      setImporting(false);
    }
  }, [lutFiles]);

  const deleteLUT = useCallback(async (lut: LUTFile) => {
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
              // Supprimer le fichier physique si ce n'est pas une LUT intégrée
              if (!lut.path.startsWith('builtin://')) {
                await RNFS.unlink(lut.path);
              }

              // Retirer de la liste
              const updatedFiles = lutFiles.filter(f => f.id !== lut.id);
              setLutFiles(updatedFiles);
              await saveUserLUTs(updatedFiles);

              console.log('🗑️ LUT supprimée:', lut.name);
            } catch (error) {
              console.error('Erreur suppression LUT:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la LUT');
            }
          },
        },
      ]
    );
  }, [lutFiles]);

  const handleSelect = useCallback((lut: LUTFile) => {
    console.log('🎨 LUT sélectionnée:', lut.name);

    // Pour les LUTs intégrées, utiliser le nom comme filtre spécial
    if (lut.path.startsWith('builtin://')) {
      onSelect(`builtin_lut_${lut.id}`);
    } else {
      // Pour les LUTs importées, utiliser le chemin
      onSelect(`lut3d:${lut.path}`);
    }

    onClose();
  }, [onSelect, onClose]);

  // Filtrer par catégorie
  const filteredLUTs = selectedCategory === 'all'
    ? lutFiles
    : lutFiles.filter(lut => lut.category === selectedCategory);

  // Obtenir les catégories uniques
  const categories = ['all', ...Array.from(new Set(lutFiles.map(lut => lut.category).filter(Boolean)))];

  const renderCategory = useCallback(({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === item && styles.categoryTextActive,
      ]}>
        {item === 'all' ? 'Toutes' : item}
      </Text>
    </TouchableOpacity>
  ), [selectedCategory]);

  const renderLUT = useCallback(({ item }: { item: LUTFile }) => (
    <TouchableOpacity
      style={styles.lutItem}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.lutIcon}>
        <MaterialIcon
          name={item.path.startsWith('builtin://') ? "cube-outline" : "cube"}
          size={32}
          color={item.path.startsWith('builtin://') ? "#007AFF" : "#00FF88"}
        />
        {item.path.startsWith('builtin://') && (
          <View style={styles.builtinBadge}>
            <Text style={styles.builtinBadgeText}>INTÉGRÉE</Text>
          </View>
        )}
      </View>

      <View style={styles.lutInfo}>
        <Text style={styles.lutName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={styles.lutDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.lutMeta}>
          <Text style={styles.lutSize}>
            {item.path.startsWith('builtin://')
              ? 'Intégrée'
              : `${(item.size / 1024).toFixed(1)} KB`
            }
          </Text>
          {item.category && (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{item.category}</Text>
            </View>
          )}
        </View>
      </View>

      {!item.path.startsWith('builtin://') && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteLUT(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  ), [handleSelect, deleteLUT]);

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

            <Text style={styles.title}>LUT 3D Pro</Text>

            <TouchableOpacity
              onPress={importLUT}
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
            Appliquez des looks professionnels avec des LUTs 3D (.cube)
          </Text>

          {/* Catégories */}
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesList}
            contentContainerStyle={styles.categoriesContent}
          />

          {/* Liste des LUTs */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Chargement des LUTs...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredLUTs}
              renderItem={renderLUT}
              keyExtractor={(item) => item.id}
              style={styles.lutList}
              contentContainerStyle={styles.lutListContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}

          {/* Guide d'utilisation */}
          {!loading && lutFiles.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialIcon name="cube-off-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>Aucune LUT disponible</Text>
              <TouchableOpacity
                style={styles.importGuideButton}
                onPress={importLUT}
                disabled={importing}
              >
                <Icon name="cloud-upload-outline" size={24} color="#fff" />
                <Text style={styles.importGuideText}>Importer une LUT</Text>
              </TouchableOpacity>

              <Text style={styles.guideText}>
                💡 Les LUTs 3D sont des fichiers .cube qui permettent d'appliquer{'\n'}
                des looks professionnels à vos photos et vidéos.
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
  categoriesList: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
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
  lutList: {
    flex: 1,
  },
  lutListContent: {
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
    marginRight: 15,
  },
  builtinBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  builtinBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },
  lutInfo: {
    flex: 1,
  },
  lutName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  lutDescription: {
    color: '#999',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  lutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lutSize: {
    color: '#666',
    fontSize: 12,
  },
  categoryChip: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryChipText: {
    color: '#007AFF',
    fontSize: 10,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 10,
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
});

export default LUT3DPickerPro;
