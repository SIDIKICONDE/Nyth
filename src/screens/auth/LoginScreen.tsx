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
import { validateEmail } from '../../utils/authValidation';
import { createOptimizedLogger } from '../../utils/optimizedLogger';
import { responsiveFontSize, responsiveSpacing, isTablet, responsiveBreakpoints } from '../../utils/responsive';

const logger = createOptimizedLogger('LoginScreen');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  // const { t } = useTranslation();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();

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
      // La navigation sera gérée automatiquement par AuthContext
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
    // Effacer l'erreur du champ lors de la modification
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isTabletDevice = isTablet();

  // Responsive values
  const titleFontSize = responsiveFontSize(28);
  const subtitleFontSize = responsiveFontSize(16);
  const baseFontSize = responsiveFontSize(16);
  const smallFontSize = responsiveFontSize(14);
  const extraSmallFontSize = responsiveFontSize(12);
  
  const iconSize = responsiveSpacing(80);
  const iconInnerSize = responsiveSpacing(40);
  
  const marginBottom = responsiveSpacing(32);
  const spacing = responsiveSpacing(16);
  const smallSpacing = responsiveSpacing(8);
  
  // Layout responsive pour tablettes
  const formMaxWidth = responsiveBreakpoints({
    lg: 500,
    xl: 600,
    default: 100,
  });

  const styles = useMemo(() => ({
    titleColor: { color: isDark ? '#ffffff' : '#1a1a1a' },
    subtitleColor: { color: isDark ? '#8a8a8a' : '#6b7280' },
    badgeBackground: { backgroundColor: currentTheme.colors.primary + '20' },
    dangerBox: { backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1 },
    linkColor: { color: currentTheme.colors.primary },
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
              name="account-circle"
              size={iconInnerSize}
              color={currentTheme.colors.primary}
            />
          </View>

          {/* Titre */}
          <Text
            style={[
              tw`font-bold mb-2`,
              styles.titleColor,
              {
                fontSize: titleFontSize,
                marginBottom: smallSpacing,
              }
            ]}
          >
            Bon retour !
          </Text>
          
          <Text
            style={[
              tw`text-center`,
              styles.subtitleColor,
              { fontSize: subtitleFontSize }
            ]}
          >
            Connectez-vous à votre compte
          </Text>
        </View>

        {/* Formulaire */}
        <View style={[tw`mb-6`, { marginBottom: responsiveSpacing(24) }]}>
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
            autoComplete="password"
            error={errors.password}
            isRequired
          />

          {/* Mot de passe oublié */}
          <TouchableOpacity
            onPress={() => {
              // TODO: Implémenter l'écran de mot de passe oublié
              Alert.alert('Non disponible', 'La réinitialisation de mot de passe sera disponible bientôt');
            }}
            style={[tw`self-end mb-4`, { marginBottom: spacing }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[
              tw`font-medium`,
              styles.linkColor,
              { fontSize: smallFontSize }
            ]}>
              Mot de passe oublié ?
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

          {/* Bouton de connexion */}
          <AuthButton
            title="Se connecter"
            onPress={handleSubmit}
            isLoading={isLoading}
            variant="primary"
            icon="login"
            style={[tw`w-full`, { marginTop: smallSpacing }]}
          />
        </View>

        {/* Authentification sociale */}
        <SocialAuthButtons
          onSocialLogin={handleSocialLogin}
          isLoading={isLoading}
        />

        {/* Lien vers l'inscription */}
        <View style={[
          tw`flex-row justify-center items-center`,
          { marginTop: marginBottom }
        ]}>
          <Text style={[styles.subtitleColor, { fontSize: baseFontSize }]}>
            Pas encore de compte ?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[
              tw`font-semibold`,
              styles.linkColor,
              { fontSize: baseFontSize }
            ]}>
              S'inscrire
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthContainer>
  );
};
