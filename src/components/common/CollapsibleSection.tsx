import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { useTheme } from '../../contexts/ThemeContext';

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  iconColor?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  icon,
  iconColor,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  const { currentTheme } = useTheme();
  const animatedHeight = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={tw`mx-4 mb-4`}>
      <TouchableOpacity
        style={[
          tw`p-4 rounded-xl flex-row items-center justify-between`,
          { 
            backgroundColor: currentTheme.colors.surface,
            shadowColor: currentTheme.colors.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }
        ]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <View style={tw`flex-row items-center flex-1`}>
          <View style={[
            tw`w-10 h-10 rounded-full items-center justify-center mr-3`,
            { backgroundColor: (iconColor || currentTheme.colors.primary) + '20' }
          ]}>
            <MaterialCommunityIcons 
              name={icon as any} 
              size={24} 
              color={iconColor || currentTheme.colors.primary} 
            />
          </View>
          <Text style={[
            tw`text-base font-medium`,
            { color: currentTheme.colors.text }
          ]}>
            {title}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <MaterialCommunityIcons 
            name="chevron-down" 
            size={24} 
            color={currentTheme.colors.textSecondary} 
          />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          tw`overflow-hidden`,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 5000], // Augmenté pour permettre plus de contenu
            }),
            opacity: animatedHeight,
          },
        ]}
      >
        <View style={tw`mt-2`}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
} 