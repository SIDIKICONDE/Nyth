import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

export interface FilterOption {
  id: string;
  name: string;
  preview: string;
  description: string;
}

const filterOptions: FilterOption[] = [
  {
    id: 'none',
    name: 'Normal',
    preview: '🎥',
    description: 'Aucun filtre',
  },
  {
    id: 'sepia',
    name: 'Sépia',
    preview: '📷',
    description: 'Effet vintage classique',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    preview: '🎞️',
    description: 'Style rétro années 70',
  },
  {
    id: 'cool',
    name: 'Cool',
    preview: '❄️',
    description: 'Teintes bleues et froides',
  },
  {
    id: 'warm',
    name: 'Chaud',
    preview: '🔥',
    description: 'Teintes chaudes et dorées',
  },
  {
    id: 'dramatic',
    name: 'Dramatique',
    preview: '🎭',
    description: 'Contraste élevé et sombre',
  },
  {
    id: 'blackAndWhite',
    name: 'Noir & Blanc',
    preview: '⚫',
    description: 'Monochrome classique',
  },
  {
    id: 'vivid',
    name: 'Vif',
    preview: '🌈',
    description: 'Couleurs saturées et vibrantes',
  },
];

interface FilterSelectorProps {
  selectedFilter: string;
  onFilterSelect: (filterId: string) => void;
  intensity: number;
  onIntensityChange: (intensity: number) => void;
}

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  selectedFilter,
  onFilterSelect,
  intensity,
  onIntensityChange,
}) => {
  const [showIntensity, setShowIntensity] = useState(false);

  const handleFilterPress = (filterId: string) => {
    onFilterSelect(filterId);
    setShowIntensity(filterId !== 'none');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filtres Vidéo</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {filterOptions.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterOption,
              selectedFilter === filter.id && styles.selectedFilter,
            ]}
            onPress={() => handleFilterPress(filter.id)}
          >
            <Text style={styles.filterPreview}>{filter.preview}</Text>
            <Text style={[
              styles.filterName,
              selectedFilter === filter.id && styles.selectedFilterName,
            ]}>
              {filter.name}
            </Text>
            <Text style={styles.filterDescription}>{filter.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showIntensity && (
        <View style={styles.intensityContainer}>
          <Text style={styles.intensityLabel}>Intensité: {Math.round(intensity * 100)}%</Text>
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              style={styles.sliderTrack}
              onPress={(event) => {
                const { locationX } = event.nativeEvent;
                const newIntensity = Math.max(0, Math.min(1, locationX / 200));
                onIntensityChange(newIntensity);
              }}
            >
              <View 
                style={[
                  styles.sliderFill, 
                  { width: `${intensity * 100}%` }
                ]} 
              />
              <View 
                style={[
                  styles.sliderThumb, 
                  { left: `${intensity * 100}%` }
                ]} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  filtersContainer: {
    paddingHorizontal: 8,
  },
  filterOption: {
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 6,
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFilter: {
    borderColor: '#007AFF',
    backgroundColor: '#003366',
  },
  filterPreview: {
    fontSize: 24,
    marginBottom: 4,
  },
  filterName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 2,
  },
  selectedFilterName: {
    color: '#007AFF',
  },
  filterDescription: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'center',
  },
  intensityContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  intensityLabel: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderTrack: {
    width: 200,
    height: 6,
    backgroundColor: '#333333',
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    backgroundColor: '#ffffff',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
}); 