import React, { Suspense, lazy } from "react";
import { View, ActivityIndicator } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import tw from "twrnc";
import { ScriptDisplayStyle } from "../../../hooks/useDisplayPreferences";
import { TabType } from "../types";

import { createOptimizedLogger } from '../../../utils/optimizedLogger';

// 🔥 LAZY LOADING: Chargement différé des composants lourds
const LibraryScriptsList = lazy(() =>
  import("../../../components/home").then(module => ({
    default: module.LibraryScriptsList
  }))
);

const VideoLibraryList = lazy(() =>
  import("../../../components/home").then(module => ({
    default: module.VideoLibraryList
  }))
);

// 🔥 COMPOSANT DE LOADING optimisé
const LoadingComponent = () => (
  <View style={tw`flex-1 items-center justify-center`}>
    <ActivityIndicator size="large" color="#3B82F6" />
  </View>
);
const logger = createOptimizedLogger('ContentTabs');

interface ContentTabsProps {
  activeTab: TabType;
  isInitialLoad: boolean;
  numColumns: number;
  scripts: any[];
  recordings: any[];
  selectedScripts: string[];
  selectedRecordings: string[];
  selectionMode: boolean;
  scriptDisplayStyle: ScriptDisplayStyle;
  onScriptPress: (scriptId: string) => void;
  onRecordingPress: (recordingId: string) => void;
  onScriptDelete: (scriptId: string) => void;
  onRecordingDelete: (recordingId: string) => void;
  onToggleScriptSelection: (id: string) => void;
  onToggleRecordingSelection: (id: string) => void;
  onDeleteSelected: () => void;
  onToggleSelectionMode: () => void;
  onScriptShare?: (scriptId: string) => void;
  onScriptDuplicate?: (scriptId: string) => void;
  onScriptExport?: (scriptId: string) => void;
  onToggleFavorite?: (scriptId: string) => void;
}

export const ContentTabs = React.memo(function ContentTabs({
  activeTab,
  isInitialLoad,
  numColumns,
  scripts,
  recordings,
  selectedScripts,
  selectedRecordings,
  selectionMode,
  scriptDisplayStyle,
  onScriptPress,
  onRecordingPress,
  onScriptDelete,
  onRecordingDelete,
  onToggleScriptSelection,
  onToggleRecordingSelection,
  onDeleteSelected,
  onToggleSelectionMode,
  onScriptShare,
  onScriptDuplicate,
  onScriptExport,
  onToggleFavorite,
}: ContentTabsProps) {
  logger.debug("📚 ContentTabs - Props reçues:");
  logger.debug("  - scriptDisplayStyle:", scriptDisplayStyle);
  logger.debug("  - activeTab:", activeTab);
  logger.debug("  - scripts.length:", scripts.length);
  logger.debug("  - recordings.length:", recordings.length);

  // Mode stack : force 1 colonne et active l'effet empilé
  const isStackMode = scriptDisplayStyle === "stack";
  const effectiveNumColumns = isStackMode ? 1 : numColumns;

  return (
    <View
      style={tw`flex-1 pt-1`}
      key={`content-${activeTab}-${scriptDisplayStyle}`}
    >
      <Animated.View
        entering={isInitialLoad ? FadeIn.delay(300).duration(500) : undefined}
        style={tw`flex-1`}
      >
        {activeTab === "scripts" ? (
          <View style={tw`flex-1`}>
            <Suspense fallback={<LoadingComponent />}>
              {scriptDisplayStyle === "library" ? (
                <LibraryScriptsList
                  scripts={scripts}
                  onScriptPress={onScriptPress}
                  onScriptDelete={onScriptDelete}
                  selectedScripts={selectedScripts}
                  onToggleSelection={onToggleScriptSelection}
                  onDeleteSelected={onDeleteSelected}
                  isSelectionModeActive={selectionMode}
                  onEnableSelectionMode={onToggleSelectionMode}
                  onScriptShare={onScriptShare}
                  onScriptDuplicate={onScriptDuplicate}
                  onScriptExport={onScriptExport}
                  onToggleFavorite={onToggleFavorite}
                />
              ) : (
                <LibraryScriptsList
                  scripts={scripts}
                  onScriptPress={onScriptPress}
                  onScriptDelete={onScriptDelete}
                  selectedScripts={selectedScripts}
                  onToggleSelection={onToggleScriptSelection}
                  onDeleteSelected={onDeleteSelected}
                  isSelectionModeActive={selectionMode}
                  onEnableSelectionMode={onToggleSelectionMode}
                  onScriptShare={onScriptShare}
                  onScriptDuplicate={onScriptDuplicate}
                  onScriptExport={onScriptExport}
                  onToggleFavorite={onToggleFavorite}
                />
              )}
            </Suspense>
          </View>
        ) : (
          <View style={tw`flex-1`}>
            <Suspense fallback={<LoadingComponent />}>
              {scriptDisplayStyle === "library" ? (
                <VideoLibraryList
                  recordings={recordings}
                  scripts={scripts}
                  selectedRecordings={selectedRecordings}
                  isSelectionModeActive={selectionMode}
                  onRecordingPress={onRecordingPress}
                  onRecordingLongPress={() => onToggleSelectionMode()}
                  onToggleSelection={onToggleRecordingSelection}
                  onDeleteSelected={onDeleteSelected}
                />
              ) : (
                <VideoLibraryList
                  recordings={recordings}
                  scripts={scripts}
                  selectedRecordings={selectedRecordings}
                  isSelectionModeActive={selectionMode}
                  onRecordingPress={onRecordingPress}
                  onRecordingLongPress={() => onToggleSelectionMode()}
                  onToggleSelection={onToggleRecordingSelection}
                  onDeleteSelected={onDeleteSelected}
                />
              )}
            </Suspense>
          </View>
        )}
      </Animated.View>
    </View>
  );
});
