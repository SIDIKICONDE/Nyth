import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';

// Composants
import {
  AuthContainer,
  AuthInput,
  AuthButton,
  SocialAuthButtons,
} from '../../components/auth';

// Services et hooks
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Types
import { RootStackParamList } from '../../types';
import { AuthFormData, AuthValidationErrors } from './types';

// Utilitaires
import { validateEmail, calculatePasswordStrength } from '../../utils/authValidation';
import { createOptimizedLogger } from '../../utils/optimizedLogger';

const logger = createOptimizedLogger('RegisterScreen');

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();

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

  const styles = useMemo(() => ({
    titleColor: { color: isDark ? '#ffffff' : '#1a1a1a' },
    subtitleColor: { color: isDark ? '#8a8a8a' : '#6b7280' },
    badgeBackground: { backgroundColor: currentTheme.colors.primary + '20' },
    progressBackground: { backgroundColor: isDark ? '#404040' : '#e5e7eb' },
    linkColor: { color: currentTheme.colors.primary },
    checkboxBorder: (checked: boolean) => ({
      borderColor: checked ? currentTheme.colors.primary : (isDark ? '#404040' : '#d1d5db'),
      backgroundColor: checked ? currentTheme.colors.primary : 'transparent',
    }),
  }), [isDark, currentTheme.colors.primary]);

  return (
    <AuthContainer>
      <View style={tw`w-full max-w-md mx-auto px-6`}>
        <View style={tw`items-center mb-8`}>
          {/* Logo ou icône */}
          <View
            style={[
              tw`w-20 h-20 rounded-full items-center justify-center mb-4`,
              styles.badgeBackground,
            ]}
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={40}
              color={currentTheme.colors.primary}
            />
          </View>

          {/* Titre */}
          <Text style={[
            tw`text-2xl font-bold text-center mb-2`,
            styles.titleColor,
          ]}>
            Créer un compte
          </Text>
          
          <Text style={[
            tw`text-center text-base`,
            styles.subtitleColor,
          ]}>
            Rejoignez-nous aujourd'hui
          </Text>
        </View>

        {/* Formulaire */}
        <View style={tw`mb-6`}>
          {/* Nom et prénom */}
          <View style={tw`flex-row gap-3 mb-4`}>
            <View style={tw`flex-1`}>
              <AuthInput
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
            <View style={tw`flex-1`}>
              <AuthInput
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
          </View>

          <AuthInput
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

          <AuthInput
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
            <View style={tw`mb-4`}>
              <View style={tw`flex-row justify-between items-center mb-1`}>
                <Text style={[tw`text-xs`, styles.subtitleColor]}>
                  Force du mot de passe
                </Text>
                <Text style={[
                  tw`font-medium text-xs`,
                  { color: passwordStrength.color }
                ]}>
                  {passwordStrength.label}
                </Text>
              </View>
              <View style={[
                tw`h-2 rounded-full`,
                styles.progressBackground,
              ]}>
                <View
                  style={[
                    tw`h-full rounded-full`,
                    { backgroundColor: passwordStrength.color, width: `${passwordStrength.width}%` },
                  ]}
                />
              </View>
            </View>
          )}

          <AuthInput
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
            style={tw`flex-row items-start mb-4`}
          >
            <View style={[
              tw`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center`,
              styles.checkboxBorder(acceptTerms),
            ]}>
              {acceptTerms && (
                <MaterialCommunityIcons
                  name="check"
                  size={12}
                  color="#ffffff"
                />
              )}
            </View>
            <Text style={[
              tw`flex-1 text-sm`,
              styles.subtitleColor,
            ]}>
              J'accepte les{' '}
              <Text style={[tw`font-medium`, styles.linkColor]}>
                conditions d'utilisation
              </Text>
              {' '}et la{' '}
              <Text style={[tw`font-medium`, styles.linkColor]}>
                politique de confidentialité
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Erreur générale */}
          {errors.general && (
            <View style={tw`rounded-lg mb-4 p-3 flex-row items-start bg-red-50 border border-red-200`}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={16}
                color="#ef4444"
                style={tw`mr-2 mt-0.5`}
              />
              <Text style={tw`text-red-700 text-sm flex-1`}>
                {errors.general}
              </Text>
            </View>
          )}

          {/* Bouton d'inscription */}
          <AuthButton
            title="Créer mon compte"
            onPress={handleSubmit}
            isLoading={isLoading}
            variant="primary"
            icon="account-plus"
            style={tw`w-full mt-2`}
          />
        </View>

        {/* Authentification sociale */}
        <SocialAuthButtons
          onSocialLogin={handleSocialLogin}
          isLoading={isLoading}
        />

        {/* Lien vers la connexion */}
        <View style={tw`flex-row justify-center items-center mt-8`}>
          <Text style={[tw`text-base`, styles.subtitleColor]}>
            Déjà un compte ?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[
              tw`font-semibold text-base`,
              styles.linkColor,
            ]}>
              Se connecter
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthContainer>
  );
};
