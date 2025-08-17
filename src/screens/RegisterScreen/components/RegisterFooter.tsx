import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import tw from 'twrnc';
import { useTranslation } from '../../../hooks/useTranslation';
import { useTheme } from '../../../contexts/ThemeContext';

interface RegisterFooterProps {
  onNavigateToLogin: () => void;
}

export default function RegisterFooter({ onNavigateToLogin }: RegisterFooterProps) {
  const { t } = useTranslation();
  const { currentTheme } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={[
        tw`flex-row justify-center items-center`,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          }],
        },
      ]}
    >
      <Text style={[
        tw`text-sm`,
        { color: currentTheme.colors.text + '80' }
      ]}>
        {t('auth.register.haveAccount')}
      </Text>
      <TouchableOpacity 
        onPress={onNavigateToLogin}
        activeOpacity={0.7}
        style={tw`ml-1`}
      >
        <Text style={[
          tw`text-sm font-bold`,
          { color: currentTheme.colors.primary }
        ]}>
          {t('auth.register.signIn')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
} 