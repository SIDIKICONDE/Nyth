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
// import { useTranslation } from '../../hooks/useTranslation';

// Types
import { RootStackParamList } from '../../types';
import { AuthFormData, AuthValidationErrors } from './types';

// Utilitaires
import { validateEmail, calculatePasswordStrength } from '../../utils/authValidation';
import { createOptimizedLogger } from '../../utils/optimizedLogger';
import { responsiveFontSize, responsiveSpacing, isTablet, responsiveBreakpoints } from '../../utils/responsive';

const logger = createOptimizedLogger('RegisterScreen');

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  // const { t } = useTranslation();
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
      // La navigation sera gérée automatiquement par AuthContext
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
    // Effacer l'erreur du champ lors de la modification
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
  const isTabletDevice = isTablet();

  // Responsive values
  const titleFontSize = responsiveFontSize(28);
  const subtitleFontSize = responsiveFontSize(16);
  const baseFontSize = responsiveFontSize(16);
  const smallFontSize = responsiveFontSize(14);
  const extraSmallFontSize = responsiveFontSize(12);
  
  const iconSize = responsiveSpacing(80);
  const iconInnerSize = responsiveSpacing(40);
  const checkboxSize = responsiveSpacing(20);
  
  const marginBottom = responsiveSpacing(32);
  const spacing = responsiveSpacing(16);
  const smallSpacing = responsiveSpacing(8);
  
  // Layout responsive pour tablettes
  const inputLayout = isTabletDevice ? 'row' : 'col';
  const formMaxWidth = responsiveBreakpoints({
    lg: 600,
    xl: 700,
    default: '100%',
  });

  const styles = useMemo(() => ({
    titleColor: { color: isDark ? '#ffffff' : '#1a1a1a' },
    subtitleColor: { color: isDark ? '#8a8a8a' : '#6b7280' },
    badgeBackground: { backgroundColor: currentTheme.colors.primary + '20' },
    progressBackground: { backgroundColor: isDark ? '#404040' : '#e5e7eb' },
    dangerBox: { backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1 },
    linkColor: { color: currentTheme.colors.primary },
    checkboxBorder: (checked: boolean) => ({
      borderColor: checked ? currentTheme.colors.primary : (isDark ? '#404040' : '#d1d5db'),
      backgroundColor: checked ? currentTheme.colors.primary : 'transparent',
    }),
  }), [isDark, currentTheme.colors.primary]);

  return (
    <AuthContainer>
      <View style={[tw`w-full`, { maxWidth: formMaxWidth }]}>
        <View style={[tw`items-center`, { marginBottom }]}>
          {/* Logo ou icône */}
          <View
            style={[
              tw`rounded-full items-center justify-center mb-4`,
              styles.badgeBackground,
              {
                width: iconSize,
                height: iconSize,
                marginBottom: spacing,
              }
            ]}
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={iconInnerSize}
              color={currentTheme.colors.primary}
            />
          </View>

          {/* Titre */}
          <Text style={[
            tw`font-bold mb-2`,
            styles.titleColor,
            {
              fontSize: titleFontSize,
              marginBottom: smallSpacing,
            }
          ]}>
            Créer un compte
          </Text>
          
          <Text style={[
            tw`text-center`,
            styles.subtitleColor,
            { fontSize: subtitleFontSize }
          ]}>
            Rejoignez-nous aujourd'hui
          </Text>
        </View>

        {/* Formulaire */}
        <View style={[tw`mb-6`, { marginBottom: responsiveSpacing(24) }]}>
          {/* Nom et prénom */}
          <View style={[
            tw`mb-4`,
            isTabletDevice ? tw`flex-row gap-3` : tw``,
          ]}>
            <View style={isTabletDevice ? tw`flex-1` : tw`mb-4`}>
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
            <View style={isTabletDevice ? tw`flex-1` : tw``}>
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
            <View style={[tw`mb-4`, { marginBottom: spacing }]}>
              <View style={tw`flex-row justify-between items-center mb-1`}>
                <Text style={[styles.subtitleColor, { fontSize: extraSmallFontSize }]}>
                  Force du mot de passe
                </Text>
                <Text style={[
                  tw`font-medium`,
                  { color: passwordStrength.color, fontSize: extraSmallFontSize }
                ]}>
                  {passwordStrength.label}
                </Text>
              </View>
              <View style={[
                tw`h-2 rounded-full`,
                styles.progressBackground,
                { height: responsiveSpacing(8) }
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
            style={[tw`flex-row items-start mb-4`, { marginBottom: spacing }]}
          >
            <View style={[
              tw`rounded border-2 mr-3 mt-0.5 items-center justify-center`,
              styles.checkboxBorder(acceptTerms),
              {
                width: checkboxSize,
                height: checkboxSize,
                marginRight: responsiveSpacing(12),
              }
            ]}>
              {acceptTerms && (
                <MaterialCommunityIcons
                  name="check"
                  size={responsiveSpacing(12)}
                  color="#ffffff"
                />
              )}
            </View>
            <Text style={[
              tw`flex-1`,
              styles.subtitleColor,
              { fontSize: smallFontSize }
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
            <View style={[
              tw`rounded-lg mb-4 flex-row items-center`,
              styles.dangerBox,
              {
                padding: responsiveSpacing(12),
                marginBottom: spacing,
              }
            ]}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={responsiveFontSize(16)}
                color="#ef4444"
                style={[tw`mr-2`, { marginRight: smallSpacing }]}
              />
              <Text style={[
                tw`text-red-700 flex-1`,
                { fontSize: smallFontSize }
              ]}>
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
            style={[tw`w-full`, { marginTop: smallSpacing }]}
          />
        </View>

        {/* Authentification sociale */}
        <SocialAuthButtons
          onSocialLogin={handleSocialLogin}
          isLoading={isLoading}
        />

        {/* Lien vers la connexion */}
        <View style={[
          tw`flex-row justify-center items-center`,
          { marginTop: marginBottom }
        ]}>
          <Text style={[styles.subtitleColor, { fontSize: baseFontSize }]}>
            Déjà un compte ?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[
              tw`font-semibold`,
              styles.linkColor,
              { fontSize: baseFontSize }
            ]}>
              Se connecter
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthContainer>
  );
};
