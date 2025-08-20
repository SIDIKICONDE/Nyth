import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '../utils/optimizedLogger';

const logger = createLogger('AuthStateListener');

interface AuthStateChangeEvent {
  user: any;
  reason: string;
}

export const useAuthStateListener = (onAuthStateChange?: (user: any, reason: string) => void) => {
  const { user, refreshAuthState } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const lastAuthStateRef = useRef<string>('');
  const listenerRef = useRef<((event: CustomEvent<AuthStateChangeEvent>) => void) | null>(null);

  // Fonction pour gérer les changements d'état d'authentification
  const handleAuthStateChange = (newUser: any, reason: string) => {
    const userKey = newUser ? `${newUser.uid}_${newUser.isGuest ? 'guest' : 'firebase'}` : 'null';
    
    // Éviter les notifications redondantes
    if (lastAuthStateRef.current === userKey) {
      return;
    }
    
    lastAuthStateRef.current = userKey;
    logger.info(`État d'auth changé: ${reason}`, {
      user: newUser ? (newUser.email || 'Invité') : 'Déconnecté',
      userType: newUser?.isGuest ? 'Invité' : (newUser ? 'Firebase' : 'Aucun')
    });
    
    // Appeler le callback personnalisé si fourni
    if (onAuthStateChange) {
      onAuthStateChange(newUser, reason);
    }
    
    setIsReady(true);
  };

  // Surveiller les changements d'AsyncStorage pour détecter les changements d'état
  const checkAuthStateChanges = async () => {
    try {
      const authStateChanged = await AsyncStorage.getItem('@auth_state_changed');
      if (authStateChanged) {
        const timestamp = parseInt(authStateChanged);
        const now = Date.now();
        
        // Si le changement est récent (moins de 5 secondes), forcer un rafraîchissement
        if (now - timestamp < 5000) {
          logger.info('Changement d\'état d\'auth détecté, rafraîchissement...');
          await refreshAuthState();
          await AsyncStorage.removeItem('@auth_state_changed');
        }
      }
    } catch (error) {
      logger.warn('Erreur vérification changement d\'état d\'auth:', error);
    }
  };

  useEffect(() => {
    // Initialiser l'état
    handleAuthStateChange(user, 'initial_load');
    
    // Vérifier périodiquement les changements d'état
    const interval = setInterval(checkAuthStateChanges, 1000);
    
    // Écouter les événements personnalisés (pour les environnements web)
    if (typeof window !== 'undefined' && window.addEventListener) {
      const customEventListener = (event: CustomEvent<AuthStateChangeEvent>) => {
        handleAuthStateChange(event.detail.user, event.detail.reason);
      };
      
      listenerRef.current = customEventListener;
      window.addEventListener('authStateChanged', customEventListener as EventListener);
    }
    
    return () => {
      clearInterval(interval);
      
      if (typeof window !== 'undefined' && window.removeEventListener && listenerRef.current) {
        window.removeEventListener('authStateChanged', listenerRef.current as EventListener);
      }
    };
  }, []);

  // Surveiller les changements directs de l'utilisateur
  useEffect(() => {
    handleAuthStateChange(user, 'user_state_update');
  }, [user]);

  // Fonction pour forcer un rafraîchissement manuel
  const forceRefresh = async () => {
    logger.info('Rafraîchissement manuel de l\'état d\'auth demandé');
    await refreshAuthState();
    setIsReady(false);
    setTimeout(() => setIsReady(true), 100);
  };

  return {
    isReady,
    currentUser: user,
    forceRefresh,
    handleAuthStateChange
  };
}; 