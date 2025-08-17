import React from 'react';
import { View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';

export const DecorativePattern: React.FC = () => (
  <View style={tw`absolute inset-0 opacity-10`}>
    <MaterialCommunityIcons 
      name="dots-grid" 
      size={200} 
      color="white"
      style={tw`absolute -top-10 -right-10`}
    />
  </View>
); 