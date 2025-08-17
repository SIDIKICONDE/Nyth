import React from 'react';
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';


import { AIStatus } from '../../types/chat';
import { getEnabledProviders, AI_PROVIDERS } from '../../config/aiConfig';
import { useTranslation } from '../../hooks/useTranslation';
import { useAIStatus } from '../../hooks/useAIStatus';
import { useSecureNavigation } from '../../hooks/biometric-auth';

interface AIStatusManagerProps {
  checkAiConnection: () => Promise<any>;
  children: (props: {
    aiStatus: AIStatus;
    showHuggingFaceButton: boolean;
    activateHuggingFace: () => void;
    activeProviders: string[];
  }) => React.ReactNode;
}

export const AIStatusManager: React.FC<AIStatusManagerProps> = ({ checkAiConnection, children }) => {
  const { navigateToAISettings } = useSecureNavigation();
  const { t } = useTranslation();
  const { isConfigured, isLoading, availableAPIs } = useAIStatus();
  
  // Initialize status explicitly to "unknown" until we confirm connection
  const [aiStatus, setAiStatus] = useState<AIStatus>('unknown');
  const [showHuggingFaceButton, setShowHuggingFaceButton] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [activeProviders, setActiveProviders] = useState<string[]>([]);

  // Get active AI providers
  const fetchActiveProviders = async () => {
    try {
      const providers = await getEnabledProviders();
      const mainProviders = providers;
      setActiveProviders(mainProviders);
    } catch (error) {
      setActiveProviders([]);
    }
  };

  // Check AI connection status on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsCheckingConnection(true);
        
        // Reset status to unknown during verification
        setAiStatus('unknown');
        
        const result = await checkAiConnection();
        
        if (result && result.status) {
          // Only update status if we have a valid result
          if (result.status === 'connected') {
            setAiStatus(result.status);
            
            // Get active providers
            await fetchActiveProviders();
          } else {
            // Ensure we stay at "unknown" if status is not clearly defined
            setAiStatus('unknown');
          }
          
          setShowHuggingFaceButton(result.hasHuggingFaceKeyButNotActivated || false);
        } else {
          // No result or invalid result, stay at "unknown"
          setAiStatus('unknown');
        }
      } catch (error) {
        setAiStatus('unknown');
      } finally {
        setIsCheckingConnection(false);
      }
    };

    checkConnection();
    
    // Set up periodic connection check every 60 seconds
    const connectionCheckInterval = setInterval(checkConnection, 60000);
    
    return () => {
      clearInterval(connectionCheckInterval);
    };
  }, [checkAiConnection]);

  // Function to redirect to settings and suggest activating Hugging Face
  const activateHuggingFace = () => {
    // Redirect the user to the settings screen
    navigateToAISettings();
    
    // Display an explanatory message
    setTimeout(() => {
      Alert.alert(
        t('aiStatusManager.huggingFace.activateTitle'),
        t('aiStatusManager.huggingFace.activateMessage'),
        [{ text: t('aiStatusManager.huggingFace.understood') }]
      );
    }, 500);
  };

  return (
    <>
      {children({
        // If checking is in progress, ensure status is "unknown"
        aiStatus: isCheckingConnection ? 'unknown' : aiStatus,
        showHuggingFaceButton,
        activateHuggingFace,
        activeProviders
      })}
    </>
  );
};

export default AIStatusManager; 