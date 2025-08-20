import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { AppleAuthProvider, signInWithCredential, getAuth } from '@react-native-firebase/auth';
import tw from 'twrnc';

export const AppleSignInTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAppleSignIn = async () => {
    setIsLoading(true);
    setLogs([]);
    
    try {
      addLog('🔄 Début du test Apple Sign-In');

      // Test 1: Vérifier la plateforme
      addLog(`📱 Plateforme: ${Platform.OS}`);
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign-In disponible uniquement sur iOS');
      }

      // Test 2: Vérifier le support
      addLog('🔍 Vérification du support Apple Sign-In...');
      const isSupported = appleAuth.isSupported;
      addLog(`✅ Apple Sign-In supporté: ${isSupported}`);
      
      if (!isSupported) {
        throw new Error('Apple Sign-In non supporté sur cet appareil');
      }

      // Test 3: Effectuer la requête
      addLog('🔐 Lancement de la requête Apple Sign-In...');
      const result = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      addLog(`📧 Email reçu: ${result.email || 'Non fourni'}`);
      addLog(`👤 Nom complet: ${result.fullName?.givenName} ${result.fullName?.familyName}`);
      addLog(`🔑 Identity Token: ${result.identityToken ? 'Reçu' : 'Non reçu'}`);

      if (!result.identityToken) {
        throw new Error('Token d\'identité Apple manquant');
      }

      // Test 4: Créer les credentials Firebase
      addLog('🔥 Création des credentials Firebase...');
      const credential = AppleAuthProvider.credential(result.identityToken);
      
      // Test 5: Connexion Firebase
      addLog('🔥 Connexion Firebase...');
      const auth = getAuth();
      const userCredential = await signInWithCredential(auth, credential);
      
      addLog(`✅ Connexion réussie! UID: ${userCredential.user.uid}`);
      addLog(`📧 Email Firebase: ${userCredential.user.email}`);
      
      Alert.alert('Succès!', 'Apple Sign-In fonctionne correctement');

    } catch (error: any) {
      const errorMessage = error?.message || 'Erreur inconnue';
      const errorCode = error?.code || 'Pas de code';
      
      addLog(`❌ Erreur: ${errorMessage}`);
      addLog(`🔢 Code d'erreur: ${errorCode}`);
      
      console.error('Erreur Apple Sign-In:', error);
      Alert.alert('Erreur', `${errorMessage}\nCode: ${errorCode}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={tw`flex-1 p-4 bg-gray-100`}>
      <Text style={tw`text-2xl font-bold mb-4 text-center`}>
        Test Apple Sign-In
      </Text>

      <TouchableOpacity
        onPress={testAppleSignIn}
        disabled={isLoading}
        style={[
          tw`bg-black rounded-lg p-4 mb-4`,
          { opacity: isLoading ? 0.6 : 1 }
        ]}
      >
        <Text style={tw`text-white text-center font-semibold`}>
          {isLoading ? '⏳ Test en cours...' : '🍎 Tester Apple Sign-In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={clearLogs}
        style={tw`bg-gray-500 rounded-lg p-2 mb-4`}
      >
        <Text style={tw`text-white text-center`}>
          🗑️ Effacer les logs
        </Text>
      </TouchableOpacity>

      <Text style={tw`text-lg font-semibold mb-2`}>
        📋 Logs de débogage:
      </Text>
      
      <View style={tw`flex-1 bg-white rounded-lg p-3`}>
        {logs.length === 0 ? (
          <Text style={tw`text-gray-500 italic`}>
            Aucun log pour le moment...
          </Text>
        ) : (
          logs.map((log, index) => (
            <Text key={index} style={tw`text-sm mb-1 font-mono`}>
              {log}
            </Text>
          ))
        )}
      </View>
    </View>
  );
};
