import React from "react";
import { ScrollView, View } from "react-native";
import tw from "twrnc";
import { H4, UIText } from "../../components/ui/Typography";
import { useTheme } from "../../contexts/ThemeContext";
import { Script } from "../../types";
import ActionButton from "./ActionButton";
import ContentEditor from "./ContentEditor";
import StatisticsPanel from "./StatisticsPanel";
import TitleInput from "./TitleInput";

interface LandscapeLayoutProps {
  title: string;
  content: string;
  wordCount: number;
  currentScript: Script | null;
  contentInputLandscapeRef: React.RefObject<
    import("react-native").TextInput | null
  >;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onContentSizeChangeLandscape: () => void;
  onSaveScript: () => void;
  onDismissKeyboard: () => void;
}

export default function LandscapeLayout({
  title,
  content,
  wordCount,
  currentScript,
  contentInputLandscapeRef,
  onTitleChange,
  onContentChange,
  onContentSizeChangeLandscape,
  onSaveScript,
  onDismissKeyboard,
}: LandscapeLayoutProps) {
  const { currentTheme } = useTheme();

  return (
    <View style={tw`flex-1 flex-row`}>
      {/* Left column: Title and editing area */}
      <View style={tw`flex-1 px-4`}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-4`}
        >
          <TitleInput title={title} onTitleChange={onTitleChange} />

          <ContentEditor
            content={content}
            onContentChange={onContentChange}
            onContentSizeChange={onContentSizeChangeLandscape}
            contentInputRef={contentInputLandscapeRef}
            isLandscape={true}
          />
        </ScrollView>
      </View>

      {/* Right column: Modern preview */}
      <View
        style={[
          tw`w-1/3 px-4 border-l`,
          { borderColor: currentTheme.colors.border },
        ]}
      >
        <View style={tw`flex-1`}>
          {/* PreviewPanel a été supprimé */}
          <View style={tw`flex-1 py-3`}>
            <View style={tw`flex-row items-center mb-3`}>
              <View
                style={[
                  tw`w-1 h-6 rounded-full mr-3`,
                  { backgroundColor: currentTheme.colors.accent },
                ]}
              />
              <H4 style={{ color: currentTheme.colors.text }}>
                👁️ Aperçu en direct
              </H4>
            </View>
            <View
              style={[
                tw`flex-1 p-4 rounded-xl`,
                { backgroundColor: currentTheme.colors.surface },
              ]}
            >
              <UIText color={currentTheme.colors.textMuted}>
                Aperçu supprimé
              </UIText>
            </View>
          </View>

          {/* Statistics panel and actions */}
          <View
            style={[
              tw`mt-4 p-4 rounded-xl`,
              { backgroundColor: currentTheme.colors.surface },
            ]}
          >
            <StatisticsPanel
              wordCount={wordCount}
              content={content}
              isCompact={false}
            />

            <ActionButton
              currentScript={currentScript}
              onSaveScript={onSaveScript}
              onDismissKeyboard={onDismissKeyboard}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
