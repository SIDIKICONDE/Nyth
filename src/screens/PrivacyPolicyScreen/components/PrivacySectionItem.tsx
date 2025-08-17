import * as React from 'react';
import { View, Text, Animated } from 'react-native';
import tw from 'twrnc';
import { PrivacySectionItemProps } from '../types';

export const PrivacySectionItem = ({ section, index, currentTheme }: PrivacySectionItemProps) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(30)).current;
  
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 20,
        friction: 8,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);
  
  return (
    <Animated.View 
      style={[
        tw`mb-4`,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        }
      ]}
    >
      <View style={[
        tw`p-4 rounded-2xl`,
        {
          backgroundColor: currentTheme.colors.surface,
          borderWidth: 1,
          borderColor: currentTheme.colors.border + '30',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }
      ]}>
        {/* Contenu sans icône */}
        <Text style={[
          tw`text-lg font-bold mb-2`,
          { color: currentTheme.colors.text }
        ]}>
          {section.title}
        </Text>
        <Text style={[
          tw`text-sm leading-6`,
          { color: currentTheme.colors.textSecondary, lineHeight: 22 }
        ]}>
          {section.content}
        </Text>
      </View>
    </Animated.View>
  );
}; 