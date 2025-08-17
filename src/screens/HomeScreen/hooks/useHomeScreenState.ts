import { useState, useEffect } from 'react';
import { TabType, HomeScreenState } from '../types';

export function useHomeScreenState() {
  const [activeTab, setActiveTab] = useState<TabType>('scripts');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // Désactiver l'animation initiale après le premier rendu
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const updateActiveTab = (tab: TabType) => {
    setActiveTab(tab);
  };

  const updateCacheSize = (size: number) => {
    setCacheSize(size);
  };

  const updateClearingCache = (clearing: boolean) => {
    setIsClearingCache(clearing);
  };

  return {
    // État
    activeTab,
    isInitialLoad,
    cacheSize,
    isClearingCache,
    
    // Actions
    updateActiveTab,
    updateCacheSize,
    updateClearingCache,
    setActiveTab,
    setCacheSize,
    setIsClearingCache,
  };
} 