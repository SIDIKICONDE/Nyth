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
  RememberMeCheckbox,
  SkiaAuthBackground,
  SkiaAnimatedLogo,
  SkiaSuccessAnimation,
} from '../../components/auth';

// Services et hooks
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Types
import { RootStackParamList } from '../../types';
import { AuthFormData, AuthValidationErrors } from './types';

// Utilitaires
import { validateEmail } from '../../utils/authValidation';
import { createOptimizedLogger } from '../../utils/optimizedLogger';

const logger = createOptimizedLogger('LoginScreen');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
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
  const [rememberMe, setRememberMe] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

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

      // Afficher l'animation de succès hypnotique
      setShowSuccessAnimation(true);

      // Utiliser AsyncStorage directement (sans biométrie)
      if (rememberMe) {
        const credentialsData = {
          email: formData.email,
          timestamp: Date.now()
        };

        // Stocker directement dans AsyncStorage sans biométrie
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const secureKey = 'secure_user_credentials';
        await AsyncStorage.setItem(secureKey, JSON.stringify(credentialsData));

        logger.info('Identifiants stockés dans AsyncStorage (sans biométrie)');
      } else {
        // Supprimer les identifiants stockés
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const secureKey = 'secure_user_credentials';
        await AsyncStorage.removeItem(secureKey);
        logger.info('Identifiants supprimés');
      }
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

  const styles = useMemo(() => ({
    titleColor: { color: isDark ? '#ffffff' : '#1a1a1a' },
    subtitleColor: { color: isDark ? '#8a8a8a' : '#6b7280' },
    badgeBackground: { backgroundColor: currentTheme.colors.primary + '20' },
    dangerBox: { backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1 },
    linkColor: { color: currentTheme.colors.primary },
  }), [isDark, currentTheme.colors.primary]);

  return (
    <SkiaAuthBackground>
      <SkiaSuccessAnimation
        visible={showSuccessAnimation}
        onAnimationComplete={() => {
          setShowSuccessAnimation(false);
          // Ici vous pourriez naviguer vers l'écran principal
        }}
        duration={2500}
      />

      <AuthContainer>
        <View style={tw`w-full max-w-md mx-auto px-6`}>
          <View style={tw`items-center mb-8`}>
            {/* Logo Skia hypnotique */}
            <View style={tw`mb-6`}>
              <SkiaAnimatedLogo
                size={140}
                colors={['#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4']}
              />
            </View>

            {/* Titre avec effet visuel */}
            <Text
              style={[
                tw`text-3xl font-bold text-center mb-3`,
                styles.titleColor,
              ]}
            >
              ✨ Bon retour ! ✨
            </Text>

            <Text
              style={[
                tw`text-center text-base`,
                styles.subtitleColor,
              ]}
            >
              Laissez-vous hypnotiser par l'expérience...
            </Text>
          </View>

        {/* Formulaire */}
        <View style={tw`mb-6`}>
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

          {/* Options */}
          <View style={tw`flex-row justify-between items-center mb-4`}>
            {/* Se souvenir de moi */}
            <RememberMeCheckbox
              checked={rememberMe}
              onToggle={() => setRememberMe(!rememberMe)}
            />

            {/* Mot de passe oublié */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Non disponible', 'La réinitialisation de mot de passe sera disponible bientôt');
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[
                tw`text-sm font-medium`,
                styles.linkColor,
              ]}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Erreur générale */}
          {errors.general && (
            <View style={[
              tw`rounded-lg mb-4 p-3 flex-row items-start bg-red-50 border border-red-200`,
            ]}>
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

          {/* Bouton de connexion */}
          <AuthButton
            title="Se connecter"
            onPress={handleSubmit}
            isLoading={isLoading}
            variant="primary"
            icon="login"
            style={tw`w-full mt-2`}
          />
        </View>

        {/* Authentification sociale */}
        <SocialAuthButtons
          onSocialLogin={handleSocialLogin}
          isLoading={isLoading}
        />

        {/* Lien vers l'inscription */}
        <View style={tw`flex-row justify-center items-center mt-8`}>
          <Text style={[tw`text-base`, styles.subtitleColor]}>
            Pas encore de compte ?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[
              tw`font-semibold text-base`,
              styles.linkColor,
            ]}>
              S'inscrire
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthContainer>
    </SkiaAuthBackground>
  );
};
