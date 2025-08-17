import React from "react";
import { View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import TitleInput from "./TitleInput";
import ContentEditor from "./ContentEditor";
import { Script } from "../../types";

interface PortraitLayoutProps {
  title: string;
  content: string;
  wordCount: number;
  currentScript: Script | null;
  contentInputRef: React.RefObject<import("react-native").TextInput | null>;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onSelectionChange: (event: {
    nativeEvent: { selection: { start: number; end: number } };
  }) => void;
  onSaveScript: () => void;
  onDismissKeyboard: () => void;
}

export default function PortraitLayout({
  title,
  content,
  wordCount,
  currentScript,
  contentInputRef,
  onTitleChange,
  onContentChange,
  onSelectionChange,
  onSaveScript,
  onDismissKeyboard,
}: PortraitLayoutProps) {
  const { currentTheme } = useTheme();

  return (
    <View
      style={[
        tw`flex-1 px-4 py-2`,
        {
          maxHeight: "100%",
          overflow: "hidden",
        },
      ]}
    >
      <TitleInput title={title} onTitleChange={onTitleChange} />

      <View style={{ flex: 1 }}>
        <ContentEditor
          content={content}
          onContentChange={onContentChange}
          onSelectionChange={onSelectionChange}
          contentInputRef={contentInputRef}
          isLandscape={false}
        />
      </View>
    </View>
  );
}
