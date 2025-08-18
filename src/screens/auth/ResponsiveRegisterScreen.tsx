import React, { useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Alert,
  Platform,
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
import { ResponsiveRow } from '../../components/common/ResponsiveGrid';

// Services et hooks
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { dimensions } from '../../utils/responsive';

// Types
import { RootStackParamList } from '../../types';
import { AuthFormData, AuthValidationErrors } from './types';

// Utilitaires
import { validateEmail, calculatePasswordStrength } from '../../utils/authValidation';
import { createOptimizedLogger } from '../../utils/optimizedLogger';

const logger = createOptimizedLogger('ResponsiveRegisterScreen');

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

export const ResponsiveRegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
  const { moderateScale, isTablet } = useResponsive();

  // État du formulaire
  const [formData, setFormData] = useState<AuthFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<AuthValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: AuthValidationErrors = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else {
      const passwordStrength = calculatePasswordStrength(formData.password);
      if (passwordStrength < 60) {
        newErrors.password = 'Le mot de passe est trop faible. Utilisez au moins 8 caractères avec majuscules, minuscules et chiffres';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!acceptTerms) {
      newErrors.general = 'Vous devez accepter les conditions d\'utilisation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signUp(
        formData.email,
        formData.password,
        `${formData.firstName} ${formData.lastName}`
      );
      logger.info('Inscription réussie');
    } catch (error) {
      logger.error('Erreur d\'inscription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur d\'inscription';
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
      logger.info(`Inscription ${provider} réussie`);
    } catch (error) {
      logger.error(`Erreur d'inscription ${provider}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Erreur d'inscription ${provider}`;
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

  // Indicateur de force du mot de passe
  const getPasswordStrength = () => {
    if (!formData.password) return null;
    const strength = calculatePasswordStrength(formData.password);
    
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
    const labels = ['Très faible', 'Faible', 'Moyen', 'Fort'];
    
    const scoreIndex = Math.floor((strength / 100) * 4);
    const clampedIndex = Math.min(Math.max(scoreIndex, 0), 3);
    
    return {
      color: colors[clampedIndex],
      label: labels[clampedIndex],
      width: strength,
    };
  };

  const passwordStrength = getPasswordStrength();

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
            name="account-plus"
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
          Créer un compte
        </ResponsiveText>
        
        <ResponsiveText
          variant="body"
          color={isDark ? '#8a8a8a' : '#6b7280'}
          align="center"
        >
          Rejoignez-nous aujourd'hui
        </ResponsiveText>
      </View>

      {/* Formulaire */}
      <View style={{ marginBottom: dimensions.margin.large }}>
        {/* Nom et prénom */}
        <ResponsiveRow gap={12}>
          <View style={{ flex: 1 }}>
            <ResponsiveAuthInput
              label="Prénom"
              icon="account"
              placeholder="Votre prénom"
              value={formData.firstName || ''}
              onChangeText={(value) => updateFormData('firstName', value)}
              autoCapitalize="words"
              error={errors.firstName}
              isRequired
            />
          </View>
          <View style={{ flex: 1 }}>
            <ResponsiveAuthInput
              label="Nom"
              icon="account"
              placeholder="Votre nom"
              value={formData.lastName || ''}
              onChangeText={(value) => updateFormData('lastName', value)}
              autoCapitalize="words"
              error={errors.lastName}
              isRequired
            />
          </View>
        </ResponsiveRow>

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
          autoComplete="new-password"
          error={errors.password}
          isRequired
        />

        {/* Indicateur de force du mot de passe */}
        {passwordStrength && (
          <View style={{ marginBottom: dimensions.margin.medium }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: moderateScale(4),
            }}>
              <ResponsiveText
                variant="small"
                color={isDark ? '#8a8a8a' : '#6b7280'}
              >
                Force du mot de passe
              </ResponsiveText>
              <ResponsiveText
                variant="small"
                weight="medium"
                color={passwordStrength.color}
              >
                {passwordStrength.label}
              </ResponsiveText>
            </View>
            <View style={{
              height: moderateScale(8),
              borderRadius: dimensions.borderRadius.small,
              backgroundColor: isDark ? '#404040' : '#e5e7eb',
            }}>
              <View
                style={{
                  height: '100%',
                  borderRadius: dimensions.borderRadius.small,
                  backgroundColor: passwordStrength.color,
                  width: `${passwordStrength.width}%`,
                }}
              />
            </View>
          </View>
        )}

        <ResponsiveAuthInput
          label="Confirmer le mot de passe"
          icon="lock-check"
          placeholder="Confirmez votre mot de passe"
          value={formData.confirmPassword || ''}
          onChangeText={(value) => updateFormData('confirmPassword', value)}
          isPassword
          autoComplete="new-password"
          error={errors.confirmPassword}
          isRequired
        />

        {/* Conditions d'utilisation */}
        <TouchableOpacity
          onPress={() => setAcceptTerms(!acceptTerms)}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: dimensions.margin.medium,
          }}
        >
          <View style={{
            width: moderateScale(20),
            height: moderateScale(20),
            borderRadius: dimensions.borderRadius.small,
            borderWidth: 2,
            marginRight: dimensions.margin.small,
            marginTop: moderateScale(2),
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: acceptTerms ? currentTheme.colors.primary : (isDark ? '#404040' : '#d1d5db'),
            backgroundColor: acceptTerms ? currentTheme.colors.primary : 'transparent',
          }}>
            {acceptTerms && (
              <MaterialCommunityIcons
                name="check"
                size={moderateScale(12)}
                color="#ffffff"
              />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <ResponsiveText
              variant="small"
              color={isDark ? '#8a8a8a' : '#6b7280'}
            >
              J'accepte les{' '}
              <ResponsiveText
                variant="small"
                weight="medium"
                color={currentTheme.colors.primary}
              >
                conditions d'utilisation
              </ResponsiveText>
              {' '}et la{' '}
              <ResponsiveText
                variant="small"
                weight="medium"
                color={currentTheme.colors.primary}
              >
                politique de confidentialité
              </ResponsiveText>
            </ResponsiveText>
          </View>
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

        {/* Bouton d'inscription */}
        <ResponsiveAuthButton
          title="Créer mon compte"
          onPress={handleSubmit}
          isLoading={isLoading}
          variant="primary"
          icon="account-plus"
          fullWidth
        />
      </View>

      {/* Authentification sociale */}
      <ResponsiveSocialAuthButtons
        onSocialLogin={handleSocialLogin}
        isLoading={isLoading}
      />

      {/* Lien vers la connexion */}
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
          Déjà un compte ?{' '}
        </ResponsiveText>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <ResponsiveText 
            variant="body" 
            weight="bold"
            color={currentTheme.colors.primary}
          >
            Se connecter
          </ResponsiveText>
        </TouchableOpacity>
      </View>
    </ResponsiveAuthContainer>
  );
};