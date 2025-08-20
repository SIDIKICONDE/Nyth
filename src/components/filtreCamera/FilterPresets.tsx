import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import type { AdvancedFilterParams } from '../../../specs/NativeCameraFiltersModule';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FilterPresetsProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (preset: FilterPreset) => void;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filterName: string;
  intensity: number;
  params: AdvancedFilterParams;
  category: 'portrait' | 'landscape' | 'artistic' | 'cinematic' | 'vintage';
  preview?: any; // Image source
}

const PRESETS: FilterPreset[] = [
  // Portraits
  {
    id: 'portrait-soft',
    name: 'Portrait Doux',
    description: 'Adoucit la peau et ajoute une lueur chaleureuse',
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
  },
  {
    id: 'portrait-dramatic',
    name: 'Portrait Dramatique',
    description: 'Contraste élevé pour des portraits intenses',
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
  },
  
  // Paysages
  {
    id: 'landscape-vibrant',
    name: 'Paysage Vibrant',
    description: 'Couleurs éclatantes pour la nature',
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
  },
  {
    id: 'landscape-moody',
    name: 'Paysage Mélancolique',
    description: 'Ambiance sombre et mystérieuse',
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
  },

  // Artistique
  {
    id: 'artistic-film',
    name: 'Film Analogique',
    description: 'Émulation de pellicule cinéma',
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
  },
  {
    id: 'artistic-noir',
    name: 'Noir Contrasté',
    description: 'Noir et blanc dramatique',
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
    category: 'artistic',
  },

  // Cinématique
  {
    id: 'cinematic-teal-orange',
    name: 'Teal & Orange',
    description: 'Look cinématographique populaire',
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
  },
  {
    id: 'cinematic-blockbuster',
    name: 'Blockbuster',
    description: 'Style de film à gros budget',
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
  },

  // Vintage
  {
    id: 'vintage-70s',
    name: 'Années 70',
    description: 'Couleurs chaudes et délavées',
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
  },
  {
    id: 'vintage-faded',
    name: 'Délavé',
    description: 'Effet photo ancienne décolorée',
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
  },
];

const CATEGORIES = [
  { id: 'all', name: 'Tous', icon: 'apps' },
  { id: 'portrait', name: 'Portrait', icon: 'person' },
  { id: 'landscape', name: 'Paysage', icon: 'image' },
  { id: 'artistic', name: 'Artistique', icon: 'color-palette' },
  { id: 'cinematic', name: 'Cinéma', icon: 'film' },
  { id: 'vintage', name: 'Vintage', icon: 'time' },
];

const FilterPresets: React.FC<FilterPresetsProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredPresets = selectedCategory === 'all' 
    ? PRESETS 
    : PRESETS.filter(p => p.category === selectedCategory);

  const renderCategory = ({ item }: { item: typeof CATEGORIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Icon 
        name={item.icon as any} 
        size={20} 
        color={selectedCategory === item.id ? '#fff' : '#999'} 
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
      <View style={styles.presetImageContainer}>
        <LinearGradient
          colors={getCategoryColors(item.category)}
          style={styles.presetGradient}
        >
          <MaterialIcon 
            name={getCategoryIcon(item.category) as any} 
            size={32} 
            color="#fff" 
          />
        </LinearGradient>
      </View>

      <View style={styles.presetInfo}>
        <Text style={styles.presetName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.presetDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.presetStats}>
          <View style={styles.presetStat}>
            <Icon name="color-filter" size={12} color="#666" />
            <Text style={styles.presetStatText}>{item.filterName}</Text>
          </View>
          <View style={styles.presetStat}>
            <Icon name="speedometer" size={12} color="#666" />
            <Text style={styles.presetStatText}>{Math.round(item.intensity * 100)}%</Text>
          </View>
        </View>
      </View>

      <Icon name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  const getCategoryColors = (category: string): string[] => {
    switch (category) {
      case 'portrait':
        return ['#FF6B6B', '#FF8E53'];
      case 'landscape':
        return ['#4ECDC4', '#44A08D'];
      case 'artistic':
        return ['#667EEA', '#764BA2'];
      case 'cinematic':
        return ['#F093FB', '#F5576C'];
      case 'vintage':
        return ['#FA709A', '#FEE140'];
      default:
        return ['#667EEA', '#764BA2'];
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'portrait':
        return 'face-woman';
      case 'landscape':
        return 'image-filter-hdr';
      case 'artistic':
        return 'palette';
      case 'cinematic':
        return 'movie-open';
      case 'vintage':
        return 'clock-time-eight';
      default:
        return 'auto-fix';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <BlurView blurType="dark" blurAmount={80} style={StyleSheet.absoluteFillObject}>
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
            
            <Text style={styles.title}>Presets</Text>
            
            <View style={{ width: 38 }} />
          </View>

          <FlatList
            data={CATEGORIES}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesList}
            contentContainerStyle={styles.categoriesContent}
          />

          <FlatList
            data={filteredPresets}
            renderItem={renderPreset}
            keyExtractor={(item) => item.id}
            style={styles.presetsList}
            contentContainerStyle={styles.presetsContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    paddingVertical: 20,
  },
  separator: {
    height: 10,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
  },
  presetImageContainer: {
    marginRight: 15,
  },
  presetGradient: {
    width: 60,
    height: 60,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  presetDescription: {
    color: '#999',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  presetStats: {
    flexDirection: 'row',
    gap: 15,
  },
  presetStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  presetStatText: {
    color: '#666',
    fontSize: 11,
  },
});

export default FilterPresets;
