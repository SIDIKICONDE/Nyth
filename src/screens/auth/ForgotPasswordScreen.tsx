import React, { useState, useMemo } from 'react';
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
} from '../../components/auth';

// Services et hooks
import { useTheme } from '../../contexts/ThemeContext';

// Types
import { RootStackParamList } from '../../types';
import { AuthValidationErrors } from './types';

// Utilitaires
import { validateEmail } from '../../utils/authValidation';
import { createOptimizedLogger } from '../../utils/optimizedLogger';

const logger = createOptimizedLogger('ForgotPasswordScreen');

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { currentTheme } = useTheme();
  const isDark = currentTheme.isDark;

  // État du formulaire
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<AuthValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: AuthValidationErrors = {};

    if (!email) {
      newErrors.email = 'L\'email est requis';
    } else if (!validateEmail(email)) {
      newErrors.email = 'L\'email n\'est pas valide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // TODO: Implémenter l'appel API pour réinitialisation de mot de passe
      // await resetPassword(email);

      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsSuccess(true);
      logger.info('Demande de réinitialisation envoyée');

      Alert.alert(
        'Email envoyé !',
        `Un email de réinitialisation a été envoyé à ${email}. Vérifiez votre boîte mail et suivez les instructions.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      logger.error('Erreur de réinitialisation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email';
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Mise à jour de l'email avec nettoyage des erreurs
  const updateEmail = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const styles = useMemo(() => ({
    titleColor: { color: isDark ? '#ffffff' : '#1a1a1a' },
    subtitleColor: { color: isDark ? '#8a8a8a' : '#6b7280' },
    badgeBackground: { backgroundColor: currentTheme.colors.primary + '20' },
    linkColor: { color: currentTheme.colors.primary },
  }), [isDark, currentTheme.colors.primary]);

  if (isSuccess) {
    return (
      <AuthContainer>
        <View style={tw`w-full max-w-md mx-auto px-6`}>
          <View style={tw`items-center mb-8`}>
            {/* Icône de succès */}
            <View
              style={[
                tw`w-20 h-20 rounded-full items-center justify-center mb-4`,
                { backgroundColor: '#10b981' + '20' },
              ]}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={40}
                color="#10b981"
              />
            </View>

            <Text
              style={[
                tw`text-2xl font-bold text-center mb-2`,
                styles.titleColor,
              ]}
            >
              Email envoyé !
            </Text>

            <Text
              style={[
                tw`text-center text-base mb-6`,
                styles.subtitleColor,
              ]}
            >
              Vérifiez votre boîte mail et suivez les instructions pour réinitialiser votre mot de passe.
            </Text>

            <AuthButton
              title="Retour à la connexion"
              onPress={() => navigation.goBack()}
              variant="primary"
              style={tw`w-full`}
            />
          </View>
        </View>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      <View style={tw`w-full max-w-md mx-auto px-6`}>
        {/* Header avec bouton retour */}
        <View style={tw`flex-row items-center mb-8`}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={tw`mr-4 p-2`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={isDark ? '#ffffff' : '#1a1a1a'}
            />
          </TouchableOpacity>

          <View style={tw`flex-1 items-center mr-8`}>
            <Text
              style={[
                tw`text-2xl font-bold text-center`,
                styles.titleColor,
              ]}
            >
              Mot de passe oublié
            </Text>
          </View>
        </View>

        <View style={tw`items-center mb-8`}>
          {/* Icône */}
          <View
            style={[
              tw`w-20 h-20 rounded-full items-center justify-center mb-4`,
              styles.badgeBackground,
            ]}
          >
            <MaterialCommunityIcons
              name="email-lock"
              size={40}
              color={currentTheme.colors.primary}
            />
          </View>

          <Text
            style={[
              tw`text-xl font-bold text-center mb-2`,
              styles.titleColor,
            ]}
          >
            Réinitialiser le mot de passe
          </Text>

          <Text
            style={[
              tw`text-center text-base`,
              styles.subtitleColor,
            ]}
          >
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Text>
        </View>

        {/* Formulaire */}
        <View style={tw`mb-6`}>
          <AuthInput
            label="Email"
            icon="email"
            placeholder="votre@email.com"
            value={email}
            onChangeText={updateEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            isRequired
          />

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

          {/* Bouton d'envoi */}
          <AuthButton
            title="Envoyer le lien de réinitialisation"
            onPress={handleSubmit}
            isLoading={isLoading}
            variant="primary"
            icon="email-send"
            style={tw`w-full mt-2`}
          />
        </View>

        {/* Lien vers la connexion */}
        <View style={tw`flex-row justify-center items-center mt-8`}>
          <Text style={[tw`text-base`, styles.subtitleColor]}>
            Vous vous souvenez de votre mot de passe ?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
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
