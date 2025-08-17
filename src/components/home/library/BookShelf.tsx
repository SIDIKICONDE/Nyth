import LinearGradient from "react-native-linear-gradient";
import React from "react";
import { View } from "react-native";
import { Script } from "../../../types";
import { ITEMS_PER_ROW } from "./BookDimensions";
import { BookItem } from "./BookItem";
import { bookStyles } from "./BookStyles";

interface BookShelfProps {
  scripts: Script[];
  rowIndex: number;
  selectedScripts: string[];
  isSelectionModeActive: boolean;
  onScriptPress: (scriptId: string) => void;
  onScriptLongPress: (scriptId: string) => void;
  onToggleSelection?: (scriptId: string) => void;
  onScriptShare?: (scriptId: string) => void;
  onScriptDuplicate?: (scriptId: string) => void;
  onScriptExport?: (scriptId: string) => void;
  onScriptDelete?: (scriptId: string) => void;
  onToggleFavorite?: (scriptId: string) => void;
}

export const BookShelf: React.FC<BookShelfProps> = ({
  scripts,
  rowIndex,
  selectedScripts,
  isSelectionModeActive,
  onScriptPress,
  onScriptLongPress,
  onToggleSelection,
  onScriptShare,
  onScriptDuplicate,
  onScriptExport,
  onScriptDelete,
  onToggleFavorite,
}) => {
  return (
    <View style={bookStyles.shelf}>
      <View style={bookStyles.rowContainer}>
        {scripts.map((script, index) => (
          <BookItem
            key={script.id}
            script={script}
            index={rowIndex * ITEMS_PER_ROW + index}
            onPress={() => onScriptPress(script.id)}
            onLongPress={() => onScriptLongPress(script.id)}
            isSelected={selectedScripts.includes(script.id)}
            onToggleSelection={() =>
              onToggleSelection && onToggleSelection(script.id)
            }
            isSelectionModeActive={isSelectionModeActive}
            onScriptShare={onScriptShare}
            onScriptDuplicate={onScriptDuplicate}
            onScriptExport={onScriptExport}
            onScriptDelete={onScriptDelete}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </View>

      {/* Étagère moderne en métal brossé */}
      <LinearGradient
        colors={["#4a5568", "#2d3748", "#1a202c"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={bookStyles.shelfBoard}
      >
        {/* Reflet métallique */}
        <View style={bookStyles.shelfReflection} />
      </LinearGradient>
    </View>
  );
};
