import * as React from 'react';
import { useState, useRef, useEffect } from 'react';

import { createOptimizedLogger } from '../../utils/optimizedLogger';
const logger = createOptimizedLogger('AnimatedMessagesContext');

// Create the context
export const AnimatedMessagesContext = React.createContext<{
  markMessageAsAnimated: (messageId: string) => void;
  isMessageAnimated: (messageId: string) => boolean;
  unmarkMessageAsAnimated: (messageId: string) => void;
  clearAllAnimations: () => void;
}>({
  markMessageAsAnimated: () => {},
  isMessageAnimated: () => false,
  unmarkMessageAsAnimated: () => {},
  clearAllAnimations: () => {}
});

// Hook for using the context
export const useAnimatedMessages = () => React.useContext(AnimatedMessagesContext);

// Component to track which messages have already been animated
export const AnimatedMessagesTracker: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [animatedMessageIds, setAnimatedMessageIds] = useState<Set<string>>(new Set());
  
  // Référence pour éviter les réanimations lors de la première charge
  const isInitialMount = useRef(true);
  const lastMessageCount = useRef(0);
  
  // Function to mark a message as already animated
  const markMessageAsAnimated = (messageId: string) => {
    setAnimatedMessageIds(prev => {
      if (prev.has(messageId)) {
        return prev; // Éviter la mise à jour si déjà présent
      }
      const newSet = new Set(prev);
      newSet.add(messageId);
      logger.debug('🎬 Message marqué comme animé:', messageId, '- Total:', newSet.size);
      return newSet;
    });
  };
  
  // Function to check if a message has already been animated
  const isMessageAnimated = (messageId: string) => {
    return animatedMessageIds.has(messageId);
  };
  
  // Function to unmark a message as animated (pour réanimation)
  const unmarkMessageAsAnimated = (messageId: string) => {
    setAnimatedMessageIds(prev => {
      if (!prev.has(messageId)) {
        return prev; // Éviter la mise à jour si pas présent
      }
      const newSet = new Set(prev);
      newSet.delete(messageId);
      logger.debug('🔄 Message désanimé pour réanimation:', messageId, '- Total:', newSet.size);
      return newSet;
    });
  };
  
  // Function to clear all animations (useful for conversation reset)
  const clearAllAnimations = () => {
    logger.debug('🧹 Nettoyage de toutes les animations');
    setAnimatedMessageIds(new Set());
  };
  
  // Effet pour marquer comme non-initial après le premier rendu
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      logger.debug('🚀 AnimatedMessagesTracker initialisé');
    }
  }, []);
  
  // Use React context to pass these functions to child components
  return (
    <AnimatedMessagesContext.Provider value={{ 
      markMessageAsAnimated, 
      isMessageAnimated, 
      unmarkMessageAsAnimated,
      clearAllAnimations 
    }}>
      {children}
    </AnimatedMessagesContext.Provider>
  );
}; 