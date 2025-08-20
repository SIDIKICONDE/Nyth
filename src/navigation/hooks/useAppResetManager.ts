import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '../../utils/optimizedLogger';

const logger = createLogger('AppResetManager');

interface UseAppResetManagerProps {
  setAppResetCounter: (counter: number | ((prev: number) => number)) => void;
  setIsInitialLoading: (loading: boolean) => void;
  checkAppStatus: () => Promise<void>;
}

export const useAppResetManager = ({
  setAppResetCounter,
  setIsInitialLoading,
  checkAppStatus,
}: UseAppResetManagerProps) => {
  useEffect(() => {
    // Vérifier périodiquement s'il y a un indicateur de redémarrage
    const intervalId = setInterval(async () => {
      try {
        const forceRestart = await AsyncStorage.getItem('forceAppRestart');
        if (forceRestart === 'true') {
          // Effacer l'indicateur
          await AsyncStorage.removeItem('forceAppRestart');
          
          // Forcer le rechargement
          logger.info('App restart request detected');
          setAppResetCounter((prev: number) => prev + 1);
          await checkAppStatus();
          setIsInitialLoading(true);
        }
      } catch (error) {
        logger.error('Error checking restart flag', error);
      }
    }, 1000);

    // Vérifier également si nous venons d'une réinitialisation 
    const checkResetFlag = async () => {
      try {
        const comeFromReset = await AsyncStorage.getItem('comeFromReset');
        if (comeFromReset === 'true') {
          // Supprimer le drapeau
          await AsyncStorage.removeItem('comeFromReset');
          
          logger.info('App reset detected');
          setAppResetCounter((prev: number) => prev + 1);
          await checkAppStatus();
          setIsInitialLoading(true);
        }
      } catch (error) {
        logger.error('Error checking reset flag', error);
      }
    };
    
    checkResetFlag();

    return () => {
      clearInterval(intervalId);
    };
  }, [setAppResetCounter, setIsInitialLoading, checkAppStatus]);
}; 