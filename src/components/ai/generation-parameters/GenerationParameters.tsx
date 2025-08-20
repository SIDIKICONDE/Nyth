import React from "react";
import { Text, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import {
  ContentLengthControls,
  CreativitySlider,
  DurationSlider,
  ParameterSelector,
} from "./components";
import {
  emotionalToneOptions,
  narrativeStructureOptions,
  platformOptions,
  toneOptions,
} from "./constants";
import { useGenerationParameters } from "./hooks";
import { getSelectedOption } from "./utils";

interface GenerationParametersProps {
  tone: string;
  onToneChange: (tone: string) => void;
  platform?: string;
  onPlatformChange?: (platform: string) => void;
  creativity?: number;
  onCreativityChange?: (creativity: number) => void;
  duration?: number;
  onDurationChange?: (duration: number) => void;
  maxCharacters?: number;
  onMaxCharactersChange?: (maxCharacters: number) => void;

  // Content length parameters
  wordCount?: number;
  onWordCountChange?: (count: number | undefined) => void;
  characterCount?: number;
  onCharacterCountChange?: (count: number | undefined) => void;
  paragraphCount?: number;
  onParagraphCountChange?: (count: number | undefined) => void;

  // Advanced parameters
  showAdvanced?: boolean;
  narrativeStructure?: string;
  onNarrativeStructureChange?: (structure: string) => void;
  emotionalTone?: string;
  onEmotionalToneChange?: (tone: string) => void;
  // Control platform selector display
  showPlatformSelection?: boolean;
  // Control content length controls display
  showContentLengthControls?: boolean;
}

export const GenerationParameters: React.FC<GenerationParametersProps> = ({
  tone,
  onToneChange,
  platform = "tiktok",
  onPlatformChange = () => {},
  creativity = 0.7,
  onCreativityChange = () => {},
  duration,
  onDurationChange = () => {},
  maxCharacters,
  onMaxCharactersChange = () => {},

  // Content length parameters
  wordCount,
  onWordCountChange = () => {},
  characterCount,
  onCharacterCountChange = () => {},
  paragraphCount,
  onParagraphCountChange = () => {},

  // Advanced parameters
  showAdvanced = false,
  narrativeStructure,
  onNarrativeStructureChange = () => {},
  emotionalTone,
  onEmotionalToneChange = () => {},
  // Control platform selector display
  showPlatformSelection = true,
  // Control content length controls display
  showContentLengthControls = true,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const {
    showToneSelection,
    isPlatformSelectionOpen,
    showNarrativeStructureSelection,
    showEmotionalToneSelection,
    toggleToneSelection,
    togglePlatformSelection,
    toggleNarrativeStructureSelection,
    toggleEmotionalToneSelection,
    closeToneSelection,
    closePlatformSelection,
    closeNarrativeStructureSelection,
    closeEmotionalToneSelection,
  } = useGenerationParameters();

  // Selected options with translation
  const selectedTone = {
    ...getSelectedOption(toneOptions, tone),
    label: t(getSelectedOption(toneOptions, tone).label),
  };
  const selectedPlatform = getSelectedOption(platformOptions, platform);
  const selectedNarrativeStructure = narrativeStructure
    ? {
        ...getSelectedOption(narrativeStructureOptions, narrativeStructure),
        label: t(
          getSelectedOption(narrativeStructureOptions, narrativeStructure).label
        ),
      }
    : {
        ...narrativeStructureOptions[0],
        label: t(narrativeStructureOptions[0].label),
      };
  const selectedEmotionalTone = emotionalTone
    ? {
        ...getSelectedOption(emotionalToneOptions, emotionalTone),
        label: t(getSelectedOption(emotionalToneOptions, emotionalTone).label),
      }
    : {
        ...emotionalToneOptions[0],
        label: t(emotionalToneOptions[0].label),
      };

  // Selection handlers
  const handleToneSelect = (toneId: string) => {
    onToneChange(toneId);
    closeToneSelection();
  };

  const handlePlatformSelect = (platformId: string) => {
    onPlatformChange(platformId);
    closePlatformSelection();
  };

  const handleNarrativeStructureSelect = (structureId: string) => {
    onNarrativeStructureChange(structureId);
    closeNarrativeStructureSelection();
  };

  const handleEmotionalToneSelect = (toneId: string) => {
    onEmotionalToneChange(toneId);
    closeEmotionalToneSelection();
  };

  return (
    <View style={tw`mt-6`}>
      <Text
        style={[
          tw`text-base font-medium mb-4`,
          { color: currentTheme.colors.text },
        ]}
      >
        {t("ai.parameters.title")}
      </Text>

      {/* Tone selection */}
      <ParameterSelector
        label={t("ai.parameters.tone")}
        selectedOption={selectedTone}
        options={toneOptions.map((opt) => ({
          ...opt,
          label: t(opt.label),
        }))}
        isOpen={showToneSelection}
        onToggle={toggleToneSelection}
        onSelect={handleToneSelect}
      />

      {/* Platform selection - conditional based on showPlatformSelection */}
      {showPlatformSelection && (
        <ParameterSelector
          label={t("ai.parameters.platform")}
          selectedOption={selectedPlatform}
          options={platformOptions}
          isOpen={isPlatformSelectionOpen}
          onToggle={togglePlatformSelection}
          onSelect={handlePlatformSelect}
        />
      )}

      {/* Creativity */}
      <CreativitySlider
        creativity={creativity}
        onCreativityChange={onCreativityChange}
      />

      {/* Script duration */}
      <DurationSlider
        duration={duration}
        onDurationChange={onDurationChange}
        wordCount={wordCount}
      />

      {/* Content length controls */}
      {showContentLengthControls && (
        <ContentLengthControls
          wordCount={wordCount}
          onWordCountChange={onWordCountChange}
          characterCount={characterCount}
          onCharacterCountChange={onCharacterCountChange}
          paragraphCount={paragraphCount}
          onParagraphCountChange={onParagraphCountChange}
        />
      )}

      {/* Advanced parameters */}
      {showAdvanced && (
        <>
          <Text
            style={[
              tw`text-base font-medium mt-6 mb-4`,
              { color: currentTheme.colors.text },
            ]}
          >
            {t("ai.parameters.advanced")}
          </Text>

          {/* Narrative structure */}
          <ParameterSelector
            label={t("ai.parameters.narrativeStructure")}
            selectedOption={selectedNarrativeStructure}
            options={narrativeStructureOptions.map((opt) => ({
              ...opt,
              label: t(opt.label),
            }))}
            isOpen={showNarrativeStructureSelection}
            onToggle={toggleNarrativeStructureSelection}
            onSelect={handleNarrativeStructureSelect}
          />

          {/* Emotional tone */}
          <ParameterSelector
            label={t("ai.parameters.emotionalTone")}
            selectedOption={selectedEmotionalTone}
            options={emotionalToneOptions.map((opt) => ({
              ...opt,
              label: t(opt.label),
            }))}
            isOpen={showEmotionalToneSelection}
            onToggle={toggleEmotionalToneSelection}
            onSelect={handleEmotionalToneSelect}
          />
        </>
      )}
    </View>
  );
};
