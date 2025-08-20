import { useCallback, useMemo, useState } from "react";
import { TabItem } from "../components/ui";

interface UseTabMenuOptions {
  initialTab?: number;
  onTabChange?: (index: number, tabId: string) => void;
  persistKey?: string; // Key for persisting selected tab in AsyncStorage
}

export const useTabMenu = (
  tabs: TabItem[],
  options: UseTabMenuOptions = {}
) => {
  const { initialTab = 0, onTabChange, persistKey } = options;
  const [activeTab, setActiveTab] = useState(initialTab);

  // Load persisted tab if key is provided
  useMemo(() => {
    if (persistKey) {
      // TODO: Load from AsyncStorage
      // AsyncStorage.getItem(persistKey).then((value) => {
      //   if (value) {
      //     const index = tabs.findIndex((tab) => tab.id === value);
      //     if (index !== -1) setActiveTab(index);
      //   }
      // });
    }
  }, [persistKey, tabs]);

  const handleTabChange = useCallback(
    (index: number) => {
      setActiveTab(index);
      const tab = tabs[index];

      if (tab && !tab.disabled) {
        // Call custom handler if provided
        onTabChange?.(index, tab.id);

        // Persist if key is provided
        if (persistKey) {
          // TODO: Save to AsyncStorage
          // AsyncStorage.setItem(persistKey, tab.id);
        }
      }
    },
    [tabs, onTabChange, persistKey]
  );

  const getActiveTabId = useCallback(() => {
    return tabs[activeTab]?.id || null;
  }, [tabs, activeTab]);

  const getActiveTab = useCallback(() => {
    return tabs[activeTab] || null;
  }, [tabs, activeTab]);

  const setActiveTabById = useCallback(
    (tabId: string) => {
      const index = tabs.findIndex((tab) => tab.id === tabId);
      if (index !== -1) {
        handleTabChange(index);
      }
    },
    [tabs, handleTabChange]
  );

  const isTabActive = useCallback(
    (tabId: string) => {
      return tabs[activeTab]?.id === tabId;
    },
    [tabs, activeTab]
  );

  const getTabIndex = useCallback(
    (tabId: string) => {
      return tabs.findIndex((tab) => tab.id === tabId);
    },
    [tabs]
  );

  const nextTab = useCallback(() => {
    const nextIndex = (activeTab + 1) % tabs.length;
    // Skip disabled tabs
    let targetIndex = nextIndex;
    while (tabs[targetIndex]?.disabled && targetIndex !== activeTab) {
      targetIndex = (targetIndex + 1) % tabs.length;
    }
    if (targetIndex !== activeTab) {
      handleTabChange(targetIndex);
    }
  }, [activeTab, tabs, handleTabChange]);

  const previousTab = useCallback(() => {
    const prevIndex = activeTab === 0 ? tabs.length - 1 : activeTab - 1;
    // Skip disabled tabs
    let targetIndex = prevIndex;
    while (tabs[targetIndex]?.disabled && targetIndex !== activeTab) {
      targetIndex = targetIndex === 0 ? tabs.length - 1 : targetIndex - 1;
    }
    if (targetIndex !== activeTab) {
      handleTabChange(targetIndex);
    }
  }, [activeTab, tabs, handleTabChange]);

  return {
    activeTab,
    activeTabId: getActiveTabId(),
    activeTabData: getActiveTab(),
    setActiveTab: handleTabChange,
    setActiveTabById,
    isTabActive,
    getTabIndex,
    nextTab,
    previousTab,
    // Props to spread on TabMenu component
    tabMenuProps: {
      tabs,
      activeTab,
      onTabChange: handleTabChange,
    },
  };
};
