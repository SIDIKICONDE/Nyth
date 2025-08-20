import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import type { FilterInfo, FilterType } from '../../../specs/NativeCameraFiltersModule';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 60) / 3;

interface FilterPreviewGridProps {
  filters: FilterInfo[];
  selectedFilter: string;
  onFilterSelect: (filterName: string) => void;
  previewImage?: string;
}

// Images de preview par défaut pour chaque type de filtre
const DEFAULT_PREVIEWS: Record<string, any> = {
  none: require('../../../assets/filters/preview-none.jpg'),
  sepia: require('../../../assets/filters/preview-sepia.jpg'),
  noir: require('../../../assets/filters/preview-noir.jpg'),
  monochrome: require('../../../assets/filters/preview-monochrome.jpg'),
  vintage: require('../../../assets/filters/preview-vintage.jpg'),
  cool: require('../../../assets/filters/preview-cool.jpg'),
  warm: require('../../../assets/filters/preview-warm.jpg'),
};

const FilterPreviewGrid: React.FC<FilterPreviewGridProps> = ({
  filters,
  selectedFilter,
  onFilterSelect,
  previewImage,
}) => {
  // Ajouter l'option "Aucun filtre" au début
  const allFilters = useMemo(() => {
    const noneFilter: FilterInfo = {
      name: 'none',
      displayName: 'Original',
      type: 'NONE' as FilterType,
      description: 'Aucun filtre',
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
        </View>
      </TouchableOpacity>
    );
  };

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
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  customBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});

export default FilterPreviewGrid;
