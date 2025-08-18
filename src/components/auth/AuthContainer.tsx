import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import tw from 'twrnc';
import { useTheme } from '../../contexts/ThemeContext';
import { getMaxContainerWidth, responsiveSpacing, isTablet } from '../../utils/responsive';

interface AuthContainerProps {
  children: React.ReactNode;
  showStatusBar?: boolean;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  children,
  showStatusBar = true,
}) => {
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;
  const maxWidth = getMaxContainerWidth();
  const horizontalPadding = responsiveSpacing(24);
  const verticalPadding = responsiveSpacing(32);
  const isTabletDevice = isTablet();

  return (
    <View style={tw`flex-1`}>
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
        style={tw`flex-1`}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          style={tw`flex-1`}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={tw`flex-1`}
            contentContainerStyle={[
              tw`flex-grow`,
              {
                paddingHorizontal: horizontalPadding,
                paddingVertical: verticalPadding,
                alignItems: 'center',
              }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View 
              style={[
                tw`w-full`,
                { 
                  maxWidth: maxWidth,
                  justifyContent: isTabletDevice ? 'flex-start' : 'center',
                  flex: 1,
                }
              ]}
            >
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};
