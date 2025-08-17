import { CustomTheme as Theme } from "@/types/theme";
import React from "react";
import { HelpContent as HelpContentType } from "../types";
import {
  ListRenderer,
  StepsRenderer,
  TextRenderer,
  TipRenderer,
  WarningRenderer,
} from "./ContentRenderers";

interface HelpContentProps {
  content: HelpContentType;
  currentTheme: Theme;
}

export const HelpContent: React.FC<HelpContentProps> = ({
  content,
  currentTheme,
}) => {
  switch (content.type) {
    case "text":
      return <TextRenderer content={content} currentTheme={currentTheme} />;
    case "list":
      return <ListRenderer content={content} currentTheme={currentTheme} />;
    case "steps":
      return <StepsRenderer content={content} currentTheme={currentTheme} />;
    case "warning":
      return <WarningRenderer content={content} currentTheme={currentTheme} />;
    case "tip":
      return <TipRenderer content={content} currentTheme={currentTheme} />;
    default:
      return null;
  }
};
