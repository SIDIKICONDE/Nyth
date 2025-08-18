import React, { useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Composants responsive
import { ResponsiveAuthContainer } from '../../components/auth/ResponsiveAuthContainer';
import { ResponsiveAuthInput } from '../../components/auth/ResponsiveAuthInput';
import { ResponsiveAuthButton } from '../../components/auth/ResponsiveAuthButton';
import { ResponsiveSocialAuthButtons } from '../../components/auth/ResponsiveSocialAuthButtons';
import { ResponsiveText } from '../../components/common/ResponsiveText';
import { ResponsiveView } from '../../components/common/ResponsiveView';

// Services et hooks
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { dimensions } from '../../utils/responsive';

// Types
import { RootStackParamList } from '../../types';
import { AuthFormData, AuthValidationErrors } from './types';

// Utilitaires
import { validateEmail } from '../../utils/authValidation';
import { createOptimizedLogger } from '../../utils/optimizedLogger';

const logger = createOptimizedLogger('ResponsiveLoginScreen');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export const ResponsiveLoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const { moderateScale, isTablet } = useResponsive();

  // État du formulaire
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<AuthValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: AuthValidationErrors = {};

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signIn(formData.email, formData.password);
      logger.info('Connexion réussie');
    } catch (error) {
      logger.error('Erreur de connexion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Authentification sociale
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      switch (provider) {
        case 'google':
          await signInWithGoogle();
          break;
        case 'apple':
          await signInWithApple();
          break;
      }
      logger.info(`Connexion ${provider} réussie`);
    } catch (error) {
      logger.error(`Erreur de connexion ${provider}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Erreur de connexion ${provider}`;
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Mise à jour des champs du formulaire
  const updateFormData = (field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <ResponsiveAuthContainer>
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: dimensions.margin.xlarge }}>
        {/* Logo */}
        <View
          style={{
            width: moderateScale(isTablet ? 100 : 80),
            height: moderateScale(isTablet ? 100 : 80),
            borderRadius: dimensions.borderRadius.round,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: dimensions.margin.large,
            backgroundColor: currentTheme.colors.primary + '20',
          }}
        >
          <MaterialCommunityIcons
            name="account-circle"
            size={moderateScale(isTablet ? 50 : 40)}
            color={currentTheme.colors.primary}
          />
        </View>

        {/* Titre */}
        <ResponsiveText
          variant={isTablet ? "h1" : "h2"}
          weight="bold"
          align="center"
          style={{ marginBottom: dimensions.margin.small }}
        >
          Bon retour !
        </ResponsiveText>
        
        <ResponsiveText
          variant="body"
          color={isDark ? '#8a8a8a' : '#6b7280'}
          align="center"
        >
          Connectez-vous à votre compte
        </ResponsiveText>
      </View>

      {/* Formulaire */}
      <View style={{ marginBottom: dimensions.margin.large }}>
        <ResponsiveAuthInput
          label="Email"
          icon="email"
          placeholder="votre@email.com"
          value={formData.email}
          onChangeText={(value) => updateFormData('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
          isRequired
        />

        <ResponsiveAuthInput
          label="Mot de passe"
          icon="lock"
          placeholder="Votre mot de passe"
          value={formData.password}
          onChangeText={(value) => updateFormData('password', value)}
          isPassword
          autoComplete="password"
          error={errors.password}
          isRequired
        />

        {/* Mot de passe oublié */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Non disponible', 'La réinitialisation de mot de passe sera disponible bientôt');
          }}
          style={{ 
            alignSelf: 'flex-end', 
            marginBottom: dimensions.margin.medium 
          }}
        >
          <ResponsiveText 
            variant="caption" 
            weight="medium"
            color={currentTheme.colors.primary}
          >
            Mot de passe oublié ?
          </ResponsiveText>
        </TouchableOpacity>

        {/* Erreur générale */}
        {errors.general && (
          <View style={{
            padding: dimensions.padding.medium,
            borderRadius: dimensions.borderRadius.medium,
            marginBottom: dimensions.margin.medium,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#fef2f2',
            borderWidth: 1,
            borderColor: '#fecaca',
          }}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={moderateScale(16)}
              color="#ef4444"
              style={{ marginRight: dimensions.margin.small }}
            />
            <ResponsiveText 
              variant="small" 
              color="#ef4444"
              style={{ flex: 1 }}
            >
              {errors.general}
            </ResponsiveText>
          </View>
        )}

        {/* Bouton de connexion */}
        <ResponsiveAuthButton
          title="Se connecter"
          onPress={handleSubmit}
          isLoading={isLoading}
          variant="primary"
          icon="login"
          fullWidth
        />
      </View>

      {/* Authentification sociale */}
      <ResponsiveSocialAuthButtons
        onSocialLogin={handleSocialLogin}
        isLoading={isLoading}
      />

      {/* Lien vers l'inscription */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: dimensions.margin.xlarge,
      }}>
        <ResponsiveText 
          variant="body"
          color={isDark ? '#8a8a8a' : '#6b7280'}
        >
          Pas encore de compte ?{' '}
        </ResponsiveText>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <ResponsiveText 
            variant="body" 
            weight="bold"
            color={currentTheme.colors.primary}
          >
            S'inscrire
          </ResponsiveText>
        </TouchableOpacity>
      </View>
    </ResponsiveAuthContainer>
  );
};