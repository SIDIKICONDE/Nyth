import { useEffect } from 'react';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { useScripts } from '../contexts/ScriptsContext';

export const useProfileStats = () => {
  const { currentUser } = useAuth();
  const { incrementStat } = useUserProfile();
  const { scripts } = useScripts();

  // Surveiller les changements dans le nombre de scripts
  useEffect(() => {
    const updateScriptStats = async () => {
      if (currentUser && currentUser.uid !== 'guest' && scripts.length > 0) {
        try {
          // Mettre à jour le nombre total de scripts
          await incrementStat('totalScripts', scripts.length - (scripts.length - 1));
        } catch (error) {}
      }
    };

    updateScriptStats();
  }, [scripts.length, currentUser]);

  // Fonction pour incrémenter les stats d'enregistrement
  const incrementRecordingStats = async (duration: number) => {
    if (currentUser && currentUser.uid !== 'guest') {
      try {
        await incrementStat('totalRecordings');
        await incrementStat('totalRecordingTime', duration);
      } catch (error) {}
    }
  };

  return {
    incrementRecordingStats,
  };
}; 