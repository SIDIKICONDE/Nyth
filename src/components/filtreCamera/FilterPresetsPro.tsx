/**
 * Presets de filtres professionnels - Version Pro
 * Collection complète de looks prédéfinis sans Expo
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AdvancedFilterParams } from '../../../specs/NativeCameraFiltersModule';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filterName: string;
  intensity: number;
  params: AdvancedFilterParams;
  category: 'portrait' | 'landscape' | 'artistic' | 'cinematic' | 'vintage' | 'professional';
  preview?: any;
  tags: string[];
  createdAt: Date;
  usageCount: number;
  favorite: boolean;
}

interface FilterPresetsProProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (preset: FilterPreset) => void;
}

// Presets professionnels prédéfinis
const PROFESSIONAL_PRESETS: FilterPreset[] = [
  // === PORTRAITS ===
  {
    id: 'portrait-soft',
    name: 'Portrait Doux',
    description: 'Adoucit la peau et ajoute une lueur chaleureuse. Parfait pour les portraits naturels.',
    filterName: 'warm',
    intensity: 0.6,
    params: {
      brightness: 0.1,
      contrast: 0.95,
      saturation: 0.9,
      hue: 0,
      gamma: 1.1,
      warmth: 0.3,
      tint: 0,
      exposure: 0.1,
      shadows: 0.1,
      highlights: -0.1,
      vignette: 0.2,
      grain: 0,
    },
    category: 'portrait',
    tags: ['beauté', 'naturel', 'chaud', 'flatteur'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },
  {
    id: 'portrait-dramatic',
    name: 'Portrait Dramatique',
    description: 'Contraste élevé pour des portraits intenses avec des ombres profondes.',
    filterName: 'color_controls',
    intensity: 1,
    params: {
      brightness: -0.05,
      contrast: 1.3,
      saturation: 0.85,
      hue: 0,
      gamma: 0.9,
      warmth: -0.1,
      tint: 0,
      exposure: 0,
      shadows: -0.2,
      highlights: 0.1,
      vignette: 0.4,
      grain: 0.1,
    },
    category: 'portrait',
    tags: ['dramatique', 'contraste', 'ombres', 'cinéma'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },
  {
    id: 'portrait-bw-classic',
    name: 'Noir & Blanc Classique',
    description: 'Conversion noir et blanc avec détails préservés et tons riches.',
    filterName: 'noir',
    intensity: 1,
    params: {
      brightness: 0,
      contrast: 1.4,
      saturation: 0,
      hue: 0,
      gamma: 0.85,
      warmth: 0,
      tint: 0,
      exposure: -0.1,
      shadows: -0.3,
      highlights: 0.2,
      vignette: 0.4,
      grain: 0.3,
    },
    category: 'portrait',
    tags: ['noir-blanc', 'classique', 'timeless', 'art'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },

  // === PAYSAGES ===
  {
    id: 'landscape-vibrant',
    name: 'Paysage Vibrant',
    description: 'Couleurs éclatantes pour la nature avec ciel bleu et verts saturés.',
    filterName: 'color_controls',
    intensity: 1,
    params: {
      brightness: 0.05,
      contrast: 1.1,
      saturation: 1.3,
      hue: 0,
      gamma: 1,
      warmth: 0.1,
      tint: 0,
      exposure: 0.1,
      shadows: 0.1,
      highlights: -0.1,
      vignette: 0.1,
      grain: 0,
    },
    category: 'landscape',
    tags: ['nature', 'vibrant', 'ciel', 'verts'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },
  {
    id: 'landscape-moody',
    name: 'Paysage Mélancolique',
    description: 'Ambiance sombre et mystérieuse avec tons froids et contrastes subtils.',
    filterName: 'cool',
    intensity: 0.8,
    params: {
      brightness: -0.1,
      contrast: 1.2,
      saturation: 0.7,
      hue: -10,
      gamma: 0.95,
      warmth: -0.3,
      tint: 0.1,
      exposure: -0.2,
      shadows: -0.3,
      highlights: 0,
      vignette: 0.5,
      grain: 0.2,
    },
    category: 'landscape',
    tags: ['mélancolique', 'sombre', 'mystérieux', 'atmosphérique'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },
  {
    id: 'landscape-golden-hour',
    name: 'Heure Dorée',
    description: 'Simule la lumière chaude de fin de journée avec teintes dorées.',
    filterName: 'warm',
    intensity: 0.9,
    params: {
      brightness: 0.15,
      contrast: 1.05,
      saturation: 1.2,
      hue: 15,
      gamma: 1.2,
      warmth: 0.4,
      tint: -0.1,
      exposure: 0.2,
      shadows: 0.2,
      highlights: -0.3,
      vignette: 0.3,
      grain: 0.1,
    },
    category: 'landscape',
    tags: ['dorée', 'coucher-soleil', 'chaud', 'magique'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },

  // === CINÉMATIQUE ===
  {
    id: 'cinematic-teal-orange',
    name: 'Teal & Orange',
    description: 'Look cinématographique populaire avec tons teal et orange contrastés.',
    filterName: 'color_controls',
    intensity: 1,
    params: {
      brightness: 0,
      contrast: 1.15,
      saturation: 1.1,
      hue: -5,
      gamma: 0.95,
      warmth: 0.2,
      tint: -0.15,
      exposure: 0,
      shadows: -0.1,
      highlights: 0,
      vignette: 0.25,
      grain: 0.1,
    },
    category: 'cinematic',
    tags: ['cinéma', 'teal-orange', 'hollywood', 'professionnel'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },
  {
    id: 'cinematic-blockbuster',
    name: 'Blockbuster',
    description: 'Style de film à gros budget avec couleurs saturées et contrastes marqués.',
    filterName: 'color_controls',
    intensity: 1,
    params: {
      brightness: -0.05,
      contrast: 1.25,
      saturation: 0.95,
      hue: 0,
      gamma: 0.9,
      warmth: 0.05,
      tint: 0.05,
      exposure: 0.05,
      shadows: -0.2,
      highlights: 0.1,
      vignette: 0.35,
      grain: 0.05,
    },
    category: 'cinematic',
    tags: ['blockbuster', 'action', 'dramatique', 'hollywood'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },
  {
    id: 'cinematic-film-noir',
    name: 'Film Noir',
    description: 'Style noir et blanc cinématographique avec contrastes extrêmes.',
    filterName: 'noir',
    intensity: 1,
    params: {
      brightness: -0.2,
      contrast: 1.6,
      saturation: 0,
      hue: 0,
      gamma: 0.75,
      warmth: 0,
      tint: 0,
      exposure: -0.3,
      shadows: -0.4,
      highlights: 0.3,
      vignette: 0.6,
      grain: 0.4,
    },
    category: 'cinematic',
    tags: ['film-noir', 'noir-blanc', 'classique', 'dramatique'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },

  // === ARTISTIQUE ===
  {
    id: 'artistic-film',
    name: 'Film Analogique',
    description: 'Émulation de pellicule cinéma avec grain et couleurs délavées.',
    filterName: 'vintage',
    intensity: 0.7,
    params: {
      brightness: 0.05,
      contrast: 0.95,
      saturation: 0.85,
      hue: 5,
      gamma: 1.1,
      warmth: 0.15,
      tint: -0.05,
      exposure: 0.1,
      shadows: 0.1,
      highlights: -0.2,
      vignette: 0.3,
      grain: 0.4,
    },
    category: 'artistic',
    tags: ['analogique', 'film', 'vintage', 'grain'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },
  {
    id: 'artistic-pop-art',
    name: 'Pop Art',
    description: 'Style coloré et saturé inspiré de l\'art pop avec contrastes marqués.',
    filterName: 'color_controls',
    intensity: 1,
    params: {
      brightness: 0.1,
      contrast: 1.4,
      saturation: 1.5,
      hue: 10,
      gamma: 0.9,
      warmth: 0.3,
      tint: 0,
      exposure: 0.2,
      shadows: 0.2,
      highlights: -0.4,
      vignette: 0.1,
      grain: 0.1,
    },
    category: 'artistic',
    tags: ['pop-art', 'coloré', 'vibrant', 'artistique'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },

  // === VINTAGE ===
  {
    id: 'vintage-70s',
    name: 'Années 70',
    description: 'Couleurs chaudes et délavées des années 70 avec teintes orangées.',
    filterName: 'vintage',
    intensity: 0.9,
    params: {
      brightness: 0.1,
      contrast: 0.85,
      saturation: 0.75,
      hue: 15,
      gamma: 1.2,
      warmth: 0.4,
      tint: 0.1,
      exposure: 0.2,
      shadows: 0.2,
      highlights: -0.3,
      vignette: 0.4,
      grain: 0.5,
    },
    category: 'vintage',
    tags: ['70s', 'rétro', 'orange', 'délavé'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },
  {
    id: 'vintage-faded',
    name: 'Délavé',
    description: 'Effet photo ancienne décolorée avec tons sépia et grain.',
    filterName: 'sepia',
    intensity: 0.4,
    params: {
      brightness: 0.15,
      contrast: 0.8,
      saturation: 0.5,
      hue: 10,
      gamma: 1.3,
      warmth: 0.2,
      tint: 0,
      exposure: 0.3,
      shadows: 0.3,
      highlights: -0.2,
      vignette: 0.5,
      grain: 0.3,
    },
    category: 'vintage',
    tags: ['délavé', 'ancien', 'sépia', 'grain'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },

  // === PROFESSIONNEL ===
  {
    id: 'pro-flat',
    name: 'Look Plat',
    description: 'Look plat professionnel pour le grading couleur ultérieur.',
    filterName: 'color_controls',
    intensity: 0.3,
    params: {
      brightness: 0,
      contrast: 1,
      saturation: 0.8,
      hue: 0,
      gamma: 1,
      warmth: 0,
      tint: 0,
      exposure: 0,
      shadows: 0,
      highlights: 0,
      vignette: 0,
      grain: 0,
    },
    category: 'professional',
    tags: ['professionnel', 'plat', 'grading', 'coloriste'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },
  {
    id: 'pro-high-key',
    name: 'High Key',
    description: 'Look clair et lumineux pour un style propre et moderne.',
    filterName: 'color_controls',
    intensity: 1,
    params: {
      brightness: 0.3,
      contrast: 0.8,
      saturation: 0.9,
      hue: 0,
      gamma: 1.2,
      warmth: 0.1,
      tint: 0,
      exposure: 0.4,
      shadows: 0.4,
      highlights: -0.2,
      vignette: 0,
      grain: 0,
    },
    category: 'professional',
    tags: ['high-key', 'lumineux', 'moderne', 'propre'],
    createdAt: new Date('2024-01-01'),
    usageCount: 0,
    favorite: false,
  },
];

const CATEGORIES = [
  { id: 'all', name: 'Tous', icon: 'apps', color: '#666' },
  { id: 'portrait', name: 'Portrait', icon: 'person', color: '#FF6B6B' },
  { id: 'landscape', name: 'Paysage', icon: 'image', color: '#4ECDC4' },
  { id: 'cinematic', name: 'Cinéma', icon: 'film', color: '#F093FB' },
  { id: 'artistic', name: 'Artistique', icon: 'color-palette', color: '#667EEA' },
  { id: 'vintage', name: 'Vintage', icon: 'time', color: '#FA709A' },
  { id: 'professional', name: 'Pro', icon: 'professional-hexagon', color: '#FFA500' },
];

const FilterPresetsPro: React.FC<FilterPresetsProProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [presets, setPresets] = useState<FilterPreset[]>(PROFESSIONAL_PRESETS);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Charger les presets sauvegardés
  React.useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const saved = await AsyncStorage.getItem('@nyth_filter_presets');
      if (saved) {
        const savedPresets = JSON.parse(saved).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
        }));
        setPresets([...PROFESSIONAL_PRESETS, ...savedPresets]);
      }
    } catch (error) {
      console.error('Erreur chargement presets:', error);
    }
  };

  const toggleFavorite = useCallback(async (presetId: string) => {
    const updatedPresets = presets.map(preset =>
      preset.id === presetId
        ? { ...preset, favorite: !preset.favorite }
        : preset
    );
    setPresets(updatedPresets);

    try {
      await AsyncStorage.setItem('@nyth_filter_presets', JSON.stringify(updatedPresets));
    } catch (error) {
      console.error('Erreur sauvegarde favoris:', error);
    }
  }, [presets]);

  const sharePreset = useCallback(async (preset: FilterPreset) => {
    try {
      const presetConfig = {
        name: preset.name,
        description: preset.description,
        filterName: preset.filterName,
        intensity: preset.intensity,
        params: preset.params,
        category: preset.category,
        tags: preset.tags,
      };

      await Share.share({
        message: `Découvrez ce preset: ${JSON.stringify(presetConfig)}`,
        title: `Preset ${preset.name}`,
      });
    } catch (error) {
      console.error('Erreur partage preset:', error);
    }
  }, []);

  // Filtrer les presets
  const filteredPresets = presets.filter(preset => {
    const categoryMatch = selectedCategory === 'all' || preset.category === selectedCategory;
    const favoriteMatch = !favoritesOnly || preset.favorite;
    return categoryMatch && favoriteMatch;
  });

  const renderCategory = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <MaterialIcon
        name={item.icon as any}
        size={20}
        color={selectedCategory === item.id ? '#fff' : item.color}
      />
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.categoryTextActive,
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderPreset = ({ item }: { item: FilterPreset }) => (
    <TouchableOpacity
      style={styles.presetCard}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
      activeOpacity={0.8}
    >
      <View style={styles.presetHeader}>
        <View style={[styles.categoryIndicator, { backgroundColor: getCategoryColor(item.category) }]}>
          <Text style={styles.categoryIndicatorText}>
            {item.category.substring(0, 3).toUpperCase()}
          </Text>
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
        <Text style={styles.presetDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.presetMeta}>
          <View style={styles.presetInfo}>
            <Text style={styles.presetFilter}>
              {item.filterName} • {Math.round(item.intensity * 100)}%
            </Text>
            <Text style={styles.presetUsage}>
              {item.usageCount} utilisations
            </Text>
          </View>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => sharePreset(item)}
          >
            <Icon name="share-outline" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const getCategoryColor = (category: string): string => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat ? cat.color : '#666';
  };

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

            <Text style={styles.title}>Presets Pro</Text>

            <TouchableOpacity
              style={[styles.filterButton, favoritesOnly && styles.filterButtonActive]}
              onPress={() => setFavoritesOnly(!favoritesOnly)}
            >
              <MaterialIcon
                name="heart"
                size={20}
                color={favoritesOnly ? "#FF6B6B" : "#666"}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Collection de presets professionnels pour tous vos besoins créatifs
          </Text>

          {/* Catégories */}
          <FlatList
            data={CATEGORIES}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesList}
            contentContainerStyle={styles.categoriesContent}
          />

          {/* Liste des presets */}
          <FlatList
            data={filteredPresets}
            renderItem={renderPreset}
            keyExtractor={(item) => item.id}
            style={styles.presetsList}
            contentContainerStyle={styles.presetsContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          {/* Statistiques */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {filteredPresets.length} preset{filteredPresets.length > 1 ? 's' : ''} •
              {presets.filter(p => p.favorite).length} favori{presets.filter(p => p.favorite).length > 1 ? 's' : ''}
            </Text>
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
  filterButton: {
    padding: 5,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 15,
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
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 6,
  },
  categoryTextActive: {
    color: '#fff',
  },
  presetsList: {
    flex: 1,
  },
  presetsContent: {
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
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  categoryIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryIndicatorText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
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
    marginBottom: 6,
  },
  presetDescription: {
    color: '#999',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  presetMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  presetInfo: {
    flex: 1,
  },
  presetFilter: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  presetUsage: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tagChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagText: {
    color: '#999',
    fontSize: 10,
    fontWeight: '500',
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

export default FilterPresetsPro;
