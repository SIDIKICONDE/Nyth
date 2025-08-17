import { useState } from 'react';

export const useGenerationParameters = () => {
  const [showToneSelection, setShowToneSelection] = useState(false);
  const [isPlatformSelectionOpen, setIsPlatformSelectionOpen] = useState(false);
  const [showNarrativeStructureSelection, setShowNarrativeStructureSelection] = useState(false);
  const [showEmotionalToneSelection, setShowEmotionalToneSelection] = useState(false);

  const toggleToneSelection = () => setShowToneSelection(!showToneSelection);
  const togglePlatformSelection = () => setIsPlatformSelectionOpen(!isPlatformSelectionOpen);
  const toggleNarrativeStructureSelection = () => setShowNarrativeStructureSelection(!showNarrativeStructureSelection);
  const toggleEmotionalToneSelection = () => setShowEmotionalToneSelection(!showEmotionalToneSelection);

  const closeToneSelection = () => setShowToneSelection(false);
  const closePlatformSelection = () => setIsPlatformSelectionOpen(false);
  const closeNarrativeStructureSelection = () => setShowNarrativeStructureSelection(false);
  const closeEmotionalToneSelection = () => setShowEmotionalToneSelection(false);

  return {
    // États
    showToneSelection,
    isPlatformSelectionOpen,
    showNarrativeStructureSelection,
    showEmotionalToneSelection,
    
    // Toggles
    toggleToneSelection,
    togglePlatformSelection,
    toggleNarrativeStructureSelection,
    toggleEmotionalToneSelection,
    
    // Close functions
    closeToneSelection,
    closePlatformSelection,
    closeNarrativeStructureSelection,
    closeEmotionalToneSelection,
  };
}; 