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
            contentContainerStyle={tw`flex-grow justify-center items-center px-6 py-8`}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};
