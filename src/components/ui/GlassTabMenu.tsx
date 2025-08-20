import { BlurView } from "@react-native-community/blur";
import React from "react";
import { ViewStyle } from "react-native";
import { useFont } from "../../contexts/FontContext";
import { useTheme } from "../../contexts/ThemeContext";
import TabMenu from "./TabMenu";

export interface GlassTabMenuProps
  extends Omit<import("./TabMenu").TabMenuProps, "containerStyle"> {
  intensity?: number; // Blur intensity
  tint?: "light" | "dark" | "default";
  style?: ViewStyle;
}

/**
 * GlassTabMenu
 * A wrapper around TabMenu that adds a beautiful Apple-style glassmorphism effect using BlurView.
 */
const GlassTabMenu: React.FC<GlassTabMenuProps> = ({
  intensity = 50,
  tint = "default",
  style,
  ...rest
}) => {
  const { currentTheme } = useTheme();
  const { getUIFontStyle } = useFont();

  return (
    <BlurView
      blurAmount={intensity}
      blurType="dark"
      style={[
        {
          overflow: "hidden",
          borderRadius: 30,
          borderWidth: 1,
          borderColor: currentTheme.isDark
            ? "rgba(255,255,255,0.15)"
            : "rgba(0,0,0,0.1)",
        },
        style,
      ]}
    >
      <TabMenu
        {...rest}
        showIndicator={true}
        enableSwipe={true}
        enableAnimation={true}
        showIcons={true}
        iconPosition="left"
        centered={true}
        containerStyle={{ backgroundColor: "transparent" }}
        tabStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        activeTabStyle={{
          backgroundColor: currentTheme.colors.primary,
        }}
        activeLabelStyle={{
          color: "white",
          ...getUIFontStyle(),
        }}
        indicatorStyle={{
          backgroundColor: currentTheme.colors.primary,
          borderRadius: 26,
        }}
        labelStyle={{
          marginLeft: 8,
          color: currentTheme.colors.textSecondary,
          ...getUIFontStyle(),
        }}
      />
    </BlurView>
  );
};

export default GlassTabMenu;
