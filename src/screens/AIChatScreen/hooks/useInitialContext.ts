import { useEffect, useRef } from 'react';

interface UseInitialContextProps {
  initialContext?: string;
  onContextReceived: (content: string) => void;
}

export const useInitialContext = ({ 
  initialContext, 
  onContextReceived 
}: UseInitialContextProps) => {
  const hasInitialContextBeenSentRef = useRef(false);

  useEffect(() => {
    // Vérifier si on a un contexte initial et qu'il n'a pas déjà été traité
    if (initialContext && !hasInitialContextBeenSentRef.current) {
      // Marquer comme traité immédiatement pour éviter les duplications
      hasInitialContextBeenSentRef.current = true;
      
      // Déclencher le callback avec le contenu
      onContextReceived(initialContext);
    }
  }, []); // Aucune dépendance pour s'exécuter qu'une seule fois au montage
}; 