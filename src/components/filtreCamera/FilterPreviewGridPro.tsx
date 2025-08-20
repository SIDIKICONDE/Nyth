/**
 * Grille de preview des filtres - Version Pro
 * Support du temps réel et des animations avancées
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { FilterInfo, FilterType } from '../../../specs/NativeCameraFiltersModule';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 60) / 3;

// Images de preview par défaut pour chaque type de filtre
const DEFAULT_PREVIEWS: Record<string, any> = {
  'none': require('../../../assets/filters/preview-none.jpg'),
  'sepia': require('../../../assets/filters/preview-sepia.jpg'),
  'noir': require('../../../assets/filters/preview-noir.jpg'),
  'monochrome': require('../../../assets/filters/preview-monochrome.jpg'),
  'vintage': require('../../../assets/filters/preview-vintage.jpg'),
  'cool': require('../../../assets/filters/preview-cool.jpg'),
  'warm': require('../../../assets/filters/preview-warm.jpg'),
};

interface FilterPreviewGridProProps {
  filters: FilterInfo[];
  selectedFilter: string;
  onFilterSelect: (filterName: string) => void;
  previewImage?: string;
  realtimeMode?: boolean;
  loading?: boolean;
}

const FilterPreviewGridPro: React.FC<FilterPreviewGridProProps> = ({
  filters,
  selectedFilter,
  onFilterSelect,
  previewImage,
  realtimeMode = false,
  loading = false,
}) => {
  // Ajouter l'option "Aucun filtre" au début
  const allFilters = useMemo(() => {
    const noneFilter: FilterInfo = {
      name: 'none',
      displayName: 'Original',
      type: 'NONE' as FilterType,
      description: 'Aucun filtre appliqué',
      isCustom: false,
      supportedFormats: [],
    };
    return [noneFilter, ...filters];
  }, [filters]);

  const renderFilter = ({ item }: { item: FilterInfo }) => {
    const isSelected = item.name === selectedFilter;
    const previewSource = previewImage
      ? { uri: previewImage }
      : DEFAULT_PREVIEWS[item.name] || DEFAULT_PREVIEWS.none;

    return (
      <TouchableOpacity
        style={[styles.filterItem, isSelected && styles.filterItemSelected]}
        onPress={() => onFilterSelect(item.name)}
        activeOpacity={0.7}
        disabled={loading}
      >
        <View style={styles.imageContainer}>
          <Image
            source={previewSource}
            style={styles.previewImage}
            resizeMode="cover"
          />

          {/* Overlay avec le nom du filtre */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.overlay}
          >
            <Text style={styles.filterName} numberOfLines={1}>
              {item.displayName}
            </Text>
          </LinearGradient>

          {/* Indicateur de sélection */}
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Icon name="checkmark-circle" size={24} color="#007AFF" />
            </View>
          )}

          {/* Badge pour les filtres custom */}
          {item.isCustom && (
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>CUSTOM</Text>
            </View>
          )}

          {/* Indicateur temps réel */}
          {realtimeMode && isSelected && (
            <View style={styles.realtimeIndicator}>
              <MaterialIcon name="sync" size={12} color="#00FF88" />
            </View>
          )}

          {/* Loading indicator */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des filtres...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={allFilters}
        renderItem={renderFilter}
        keyExtractor={(item) => item.name}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Indicateur de mode temps réel */}
      {realtimeMode && (
        <View style={styles.realtimeModeIndicator}>
          <MaterialIcon name="sync" size={14} color="#00FF88" />
          <Text style={styles.realtimeModeText}>Temps réel activé</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  content: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  separator: {
    height: 15,
  },
  filterItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterItemSelected: {
    borderColor: '#007AFF',
    transform: [{ scale: 0.95 }],
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'flex-end',
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  filterName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  customBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  customBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  realtimeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderRadius: 8,
    padding: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#999',
    marginTop: 10,
    fontSize: 14,
  },
  realtimeModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 10,
    alignSelf: 'center',
  },
  realtimeModeText: {
    color: '#00FF88',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default FilterPreviewGridPro;
