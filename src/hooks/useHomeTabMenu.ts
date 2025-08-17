import { useMemo } from "react";
import { TabItem } from "../components/ui";
import { useDisplayPreferences } from "./useDisplayPreferences";
import { useTabMenu } from "./useTabMenu";
import { useTranslation } from "./useTranslation";

type TabType = "scripts" | "videos";

interface UseHomeTabMenuOptions {
  initialTab?: TabType;
  scriptsCount: number;
  recordingsCount: number;
  onTabChange?: (tabType: TabType) => void;
}

export const useHomeTabMenu = ({
  initialTab = "scripts",
  scriptsCount,
  recordingsCount,
  onTabChange,
}: UseHomeTabMenuOptions) => {
  const { t } = useTranslation();
  const { scriptDisplayStyle } = useDisplayPreferences();

  const isLibraryMode = scriptDisplayStyle === "library";

  // Create tabs configuration
  const tabs: TabItem[] = useMemo(
    () => [
      {
        id: "scripts",
        label: t("home.tabs.scripts"),
        icon: isLibraryMode ? "bookshelf" : "file-document-multiple",
        badge: scriptsCount,
      },
      {
        id: "videos",
        label: t("home.tabs.videos"),
        icon: isLibraryMode ? "cassette" : "video-vintage",
        badge: recordingsCount,
      },
    ],
    [t, isLibraryMode, scriptsCount, recordingsCount]
  );

  // Convert TabType to index
  const initialTabIndex = useMemo(() => {
    return initialTab === "scripts" ? 0 : 1;
  }, [initialTab]);

  // Use our generic tab menu hook
  const {
    activeTab: activeTabIndex,
    activeTabId,
    setActiveTab,
    setActiveTabById,
    tabMenuProps,
    ...rest
  } = useTabMenu(tabs, {
    initialTab: initialTabIndex,
    onTabChange: (index, tabId) => {
      const tabType: TabType = tabId as TabType;
      onTabChange?.(tabType);
    },
    persistKey: "homeScreenActiveTab",
  });

  // Convert back to TabType
  const activeTabType: TabType = useMemo(() => {
    return activeTabIndex === 0 ? "scripts" : "videos";
  }, [activeTabIndex]);

  // Convert TabType to index for external API
  const setActiveTabByType = (tabType: TabType) => {
    const index = tabType === "scripts" ? 0 : 1;
    setActiveTab(index);
  };

  return {
    // Current state
    activeTab: activeTabType,
    activeTabIndex,
    activeTabId,
    tabs,
    isLibraryMode,

    // Actions
    setActiveTab: setActiveTabByType,
    setActiveTabById,
    setActiveTabByIndex: setActiveTab,

    // For TabMenu component
    tabMenuProps: {
      ...tabMenuProps,
      onTabChange: (index: number) => {
        const tabType: TabType = index === 0 ? "scripts" : "videos";
        setActiveTab(index);
        onTabChange?.(tabType);
      },
    },

    // Additional utilities
    ...rest,
  };
};
