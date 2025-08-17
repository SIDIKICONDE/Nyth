import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import tw from 'twrnc';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../contexts/AuthContext';
import { useLogout } from '../../hooks/useLogout';
import { RootStackParamList } from '../../types';
import Card from './Card';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  isGuest: boolean;
}

export default function AccountSection() {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { handleLogout } = useLogout();
  const navigation = useNavigation<NavigationProp>();

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <Card>
      <View style={tw`mb-4`}>
        <Text style={[
          tw`text-lg font-semibold`,
          { color: currentTheme.colors.text }
        ]}>
          {t('settings.account.title')}
        </Text>
        <Text style={[
          tw`text-sm mt-1`,
          { color: currentTheme.colors.text + '80' }
        ]}>
          {t('settings.account.subtitle')}
        </Text>
      </View>

      {currentUser ? (
        // Si l'utilisateur est connecté
        <View>
          <View style={[
            tw`flex-row items-center p-3 rounded-lg mb-3`,
            { backgroundColor: currentTheme.colors.surface }
          ]}>
            <View style={[
              tw`w-12 h-12 rounded-full items-center justify-center mr-3`,
              { backgroundColor: `${currentTheme.colors.primary}20` }
            ]}>
              <MaterialCommunityIcons 
                name="account" 
                size={24} 
                color={currentTheme.colors.primary} 
              />
            </View>
            <View style={tw`flex-1`}>
              <Text style={[
                tw`font-medium`,
                { color: currentTheme.colors.text }
              ]}>
                {currentUser.isGuest ? t('auth.user.guest') : (currentUser.email || t('auth.user.guest'))}
              </Text>
              <Text style={[
                tw`text-sm`,
                { color: currentTheme.colors.text + '60' }
              ]}>
                {currentUser.isGuest ? t('settings.account.guestMode') : t('settings.account.connected')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            style={[
              tw`flex-row items-center p-4 rounded-lg`,
              {
                backgroundColor: currentTheme.colors.error + '10',
                borderWidth: 1,
                borderColor: currentTheme.colors.error + '20'
              }
            ]}
          >
            <MaterialCommunityIcons 
              name="logout" 
              size={20} 
              color={currentTheme.colors.error} 
              style={tw`mr-3`}
            />
            <Text style={[
              tw`font-medium`,
              { color: currentTheme.colors.error }
            ]}>
              {t('settings.signOut.signOut')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Si l'utilisateur n'est pas connecté
        <View>
          <TouchableOpacity
            onPress={handleLogin}
            activeOpacity={0.7}
            style={[
              tw`flex-row items-center p-4 rounded-lg mb-3`,
              {
                backgroundColor: currentTheme.colors.primary + '10',
                borderWidth: 1,
                borderColor: currentTheme.colors.primary + '20'
              }
            ]}
          >
            <MaterialCommunityIcons 
              name="login" 
              size={20} 
              color={currentTheme.colors.primary} 
              style={tw`mr-3`}
            />
            <View style={tw`flex-1`}>
              <Text style={[
                tw`font-medium`,
                { color: currentTheme.colors.primary }
              ]}>
                {t('settings.account.login')}
              </Text>
              <Text style={[
                tw`text-sm mt-1`,
                { color: currentTheme.colors.text + '60' }
              ]}>
                {t('settings.account.loginDescription')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRegister}
            activeOpacity={0.7}
            style={[
              tw`flex-row items-center p-4 rounded-lg`,
              {
                backgroundColor: currentTheme.colors.secondary + '10',
                borderWidth: 1,
                borderColor: currentTheme.colors.secondary + '20'
              }
            ]}
          >
            <MaterialCommunityIcons 
              name="account-plus" 
              size={20} 
              color={currentTheme.colors.secondary} 
              style={tw`mr-3`}
            />
            <View style={tw`flex-1`}>
              <Text style={[
                tw`font-medium`,
                { color: currentTheme.colors.secondary }
              ]}>
                {t('settings.account.register')}
              </Text>
              <Text style={[
                tw`text-sm mt-1`,
                { color: currentTheme.colors.text + '60' }
              ]}>
                {t('settings.account.registerDescription')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
} 