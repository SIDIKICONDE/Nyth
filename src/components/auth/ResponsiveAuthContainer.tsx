import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { dimensions } from '../../utils/responsive';

interface ResponsiveAuthContainerProps {
  children: React.ReactNode;
  showStatusBar?: boolean;
}

export const ResponsiveAuthContainer: React.FC<ResponsiveAuthContainerProps> = ({
  children,
  showStatusBar = true,
}) => {
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;
  const insets = useSafeAreaInsets();
  const { moderateScale, hp, isTablet } = useResponsive();

  return (
    <View style={{ flex: 1 }}>
      {showStatusBar && (
        <StatusBar
          backgroundColor={isDark ? '#1a1a1a' : '#ffffff'}
          barStyle={isDark ? 'light-content' : 'dark-content'}
        />
      )}
      
      <LinearGradient
        colors={
          isDark
            ? ['#1a1a1a', '#2d2d2d', '#1a1a1a']
            : ['#ffffff', '#f8f9fa', '#ffffff']
        }
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : moderateScale(20)}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: isTablet ? dimensions.padding.xlarge * 2 : dimensions.padding.large,
              paddingTop: Math.max(insets.top, dimensions.padding.large),
              paddingBottom: Math.max(insets.bottom, dimensions.padding.large),
              minHeight: hp(100),
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                width: '100%',
                maxWidth: isTablet ? moderateScale(500) : '100%',
                alignSelf: 'center',
              }}
            >
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};