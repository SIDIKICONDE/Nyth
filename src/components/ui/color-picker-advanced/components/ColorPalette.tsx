import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import ColorOption from './ColorOption';
import { ColorPaletteProps } from '../types';


const ColorPalette: React.FC<ColorPaletteProps> = ({
  colors,
  selectedColor,
  onColorSelect,
  compact = false
}) => {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal={true} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingHorizontal: compact ? 6 : 8 }
        ]}
      >
        {colors.map((color, index) => (
          <ColorOption
            key={`color-${index}-${color}`}
            color={color}
            isSelected={selectedColor === color}
            onSelect={() => onColorSelect(color)}
            compact={compact}
            size={compact ? 'small' : 'medium'}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  contentContainer: {
    paddingVertical: 4,
  },
});

export default ColorPalette; 