import { UIText } from "@/components/ui";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useDisplayPreferences } from "../../hooks/useDisplayPreferences";
import { useTranslation } from "../../hooks/useTranslation";
import { Script } from "../../types";
import EmptyState from "./EmptyState";
import { BookShelf, ITEMS_PER_ROW, LibraryHeader } from "./library";
import { useGyroscopeManager } from "../../hooks/useGyroscopeManager";

interface LibraryScriptsListProps {
  scripts: Script[];
  onScriptPress: (scriptId: string) => void;
  onScriptDelete: (scriptId: string) => void;
  selectedScripts?: string[];
  onToggleSelection?: (scriptId: string) => void;
  onDeleteSelected?: () => void;
  isSelectionModeActive?: boolean;
  onEnableSelectionMode?: () => void;
  onScriptShare?: (scriptId: string) => void;
  onScriptDuplicate?: (scriptId: string) => void;
  onScriptExport?: (scriptId: string) => void;
  onToggleFavorite?: (scriptId: string) => void;
}

export default function LibraryScriptsList({
  scripts,
  onScriptPress,
  onScriptDelete,
  selectedScripts = [],
  onToggleSelection,
  onDeleteSelected,
  isSelectionModeActive = false,
  onEnableSelectionMode,
  onScriptShare,
  onScriptDuplicate,
  onScriptExport,
  onToggleFavorite,
}: LibraryScriptsListProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { showLibraryHeader } = useDisplayPreferences();
  const { handleScrollStart, handleScrollEnd } = useGyroscopeManager({
    disableDuringScroll: true,
  });

  const handleScriptLongPress = (scriptId: string) => {
    if (!isSelectionModeActive && onEnableSelectionMode && onToggleSelection) {
      onEnableSelectionMode();
      onToggleSelection(scriptId);
    }
  };

  // Grouper les scripts par rangées
  const rows = [];
  for (let i = 0; i < scripts.length; i += ITEMS_PER_ROW) {
    rows.push(scripts.slice(i, i + ITEMS_PER_ROW));
  }

  if (scripts.length === 0) {
    return <EmptyState type="scripts" />;
  }

  return (
    <>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-24`}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={handleScrollStart}
        onMomentumScrollBegin={handleScrollStart}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {showLibraryHeader && <LibraryHeader scriptsCount={scripts.length} />}

        {/* Étagères de livres */}
        {rows.map((row, rowIndex) => (
          <BookShelf
            key={rowIndex}
            scripts={row}
            rowIndex={rowIndex}
            selectedScripts={selectedScripts}
            isSelectionModeActive={isSelectionModeActive}
            onScriptPress={onScriptPress}
            onScriptLongPress={handleScriptLongPress}
            onToggleSelection={onToggleSelection}
            onScriptShare={onScriptShare}
            onScriptDuplicate={onScriptDuplicate}
            onScriptExport={onScriptExport}
            onScriptDelete={onScriptDelete}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </ScrollView>

      {/* Bouton de suppression en mode sélection */}
      {isSelectionModeActive &&
        selectedScripts.length > 0 &&
        onDeleteSelected && (
          <View style={tw`absolute bottom-4 left-4 right-4`}>
            <TouchableOpacity
              onPress={onDeleteSelected}
              style={[
                tw`py-3 px-4 rounded-xl flex-row items-center justify-center`,
                { backgroundColor: currentTheme.colors.error },
              ]}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={22}
                color="white"
                style={tw`mr-2`}
              />
              <UIText weight="bold" style={{ color: "white" }}>
                {t("home.script.deleteSelected", {
                  count: selectedScripts.length,
                  scripts:
                    selectedScripts.length > 1
                      ? t("home.script.scripts")
                      : t("home.script.script"),
                })}
              </UIText>
            </TouchableOpacity>
          </View>
        )}
    </>
  );
}
