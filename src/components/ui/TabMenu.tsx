import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { UIText } from "./Typography";
import { useContrastOptimization } from "../../hooks/useContrastOptimization";

// Types
export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: number | string;
  disabled?: boolean;
}

export type TabMenuVariant = "default" | "pills" | "underline" | "segment";

export interface TabMenuProps {
  tabs: TabItem[];
  activeTab: number;
  onTabChange: (index: number) => void;
  variant?: TabMenuVariant;
  showIndicator?: boolean;
  enableSwipe?: boolean;
  enableAnimation?: boolean;
  containerStyle?: ViewStyle;
  tabStyle?: ViewStyle;
  activeTabStyle?: ViewStyle;
  labelStyle?: TextStyle;
  activeLabelStyle?: TextStyle;
  indicatorStyle?: ViewStyle;
  showIcons?: boolean;
  iconPosition?: "left" | "top";
  scrollable?: boolean;
  centered?: boolean;
}

const { width: screenWidth } = Dimensions.get("window");

const TabMenu: React.FC<TabMenuProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = "default",
  showIndicator = true,
  enableSwipe = true,
  enableAnimation = true,
  containerStyle,
  tabStyle,
  activeTabStyle,
  labelStyle,
  activeLabelStyle,
  indicatorStyle,
  showIcons = true,
  iconPosition = "left",
  scrollable = false,
  centered = true,
}) => {
  const { currentTheme } = useTheme();
  const { getOptimizedTabColors, getOptimizedBadgeColors } =
    useContrastOptimization();
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [tabWidths, setTabWidths] = useState<number[]>([]);
  const [tabPositions, setTabPositions] = useState<number[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Calculate tab dimensions
  const calculateTabDimensions = useCallback(() => {
    if (containerWidth === 0 || tabs.length === 0) return;

    if (scrollable) {
      // For scrollable tabs, each tab has its own width
      // This would be calculated after measuring each tab
      return;
    }

    // For non-scrollable tabs, distribute width equally
    const tabWidth = containerWidth / tabs.length;
    const widths = new Array(tabs.length).fill(tabWidth);
    const positions = widths.map((_, index) => index * tabWidth);

    setTabWidths(widths);
    setTabPositions(positions);
  }, [containerWidth, tabs.length, scrollable]);

  useEffect(() => {
    calculateTabDimensions();
  }, [calculateTabDimensions]);

  // Animate indicator to active tab
  useEffect(() => {
    if (
      !showIndicator ||
      !enableAnimation ||
      tabPositions.length === 0 ||
      tabWidths.length === 0
    ) {
      return;
    }

    const targetPosition = tabPositions[activeTab] || 0;
    const targetWidth = tabWidths[activeTab] || 0;

    if (enableAnimation) {
      Animated.spring(translateX, {
        toValue: targetPosition,
        useNativeDriver: true,
        tension: 100,
        friction: 15,
      }).start();
    } else {
      translateX.setValue(targetPosition);
    }

    // Scroll to active tab if scrollable
    if (scrollable && scrollViewRef.current) {
      const scrollToX = targetPosition - containerWidth / 2 + targetWidth / 2;
      scrollViewRef.current.scrollTo({
        x: Math.max(0, scrollToX),
        animated: true,
      });
    }
  }, [
    activeTab,
    tabPositions,
    tabWidths,
    enableAnimation,
    showIndicator,
    translateX,
    containerWidth,
    scrollable,
  ]);

  // Gesture handlers
  const onGestureEvent = useCallback(
    Animated.event([{ nativeEvent: { translationX: translateX } }], {
      useNativeDriver: true,
    }),
    [translateX]
  );

  const onHandlerStateChange = useCallback(
    (event: any) => {
      if (!enableSwipe || event.nativeEvent.state !== State.END) return;

      const { translationX, velocityX } = event.nativeEvent;
      const threshold = containerWidth / (tabs.length * 2);

      let newIndex = activeTab;

      if (Math.abs(velocityX) > 500) {
        // Fast swipe
        newIndex = velocityX > 0 ? activeTab - 1 : activeTab + 1;
      } else if (Math.abs(translationX) > threshold) {
        // Slow swipe
        newIndex = translationX > 0 ? activeTab - 1 : activeTab + 1;
      }

      newIndex = Math.max(0, Math.min(tabs.length - 1, newIndex));

      if (newIndex !== activeTab && !tabs[newIndex].disabled) {
        onTabChange(newIndex);
      }

      // Animate back to position
      const targetPosition = tabPositions[newIndex] || 0;
      Animated.spring(translateX, {
        toValue: targetPosition,
        useNativeDriver: true,
        tension: 100,
        friction: 15,
      }).start();
    },
    [
      activeTab,
      containerWidth,
      enableSwipe,
      onTabChange,
      tabPositions,
      tabs,
      translateX,
    ]
  );

  // Tab press handler
  const handleTabPress = useCallback(
    (index: number) => {
      if (!tabs[index].disabled && index !== activeTab) {
        onTabChange(index);
      }
    },
    [activeTab, onTabChange, tabs]
  );

  // Get variant styles
  const getVariantStyles = useCallback(() => {
    const baseContainer: ViewStyle = {
      backgroundColor: "transparent",
    };

    const baseTab: ViewStyle = {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: iconPosition === "top" ? "column" : "row",
      alignItems: "center",
      justifyContent: "center",
    };

    const baseIndicator: ViewStyle = {
      position: "absolute",
      height: "100%",
      backgroundColor: currentTheme.colors.accent,
    };

    switch (variant) {
      case "pills":
        return {
          container: {
            ...baseContainer,
            backgroundColor: currentTheme.isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.05)",
            borderRadius: 30,
            padding: 4,
          },
          tab: {
            ...baseTab,
            borderRadius: 26,
          },
          activeTab: {
            backgroundColor: getOptimizedTabColors(true).background,
          },
          indicator: {
            ...baseIndicator,
            borderRadius: 26,
            backgroundColor: getOptimizedTabColors(true).background,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          },
        };

      case "underline":
        return {
          container: {
            ...baseContainer,
            borderBottomWidth: 1,
            borderBottomColor: currentTheme.isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          },
          tab: baseTab,
          activeTab: {},
          indicator: {
            ...baseIndicator,
            height: 3,
            bottom: -1,
            top: undefined,
            borderRadius: 1.5,
          },
        };

      case "segment":
        return {
          container: {
            ...baseContainer,
            borderWidth: 1,
            borderColor: currentTheme.colors.accent,
            borderRadius: 8,
            backgroundColor: "transparent",
          },
          tab: {
            ...baseTab,
            paddingVertical: 10,
          },
          activeTab: {},
          indicator: {
            ...baseIndicator,
            backgroundColor: currentTheme.colors.accent,
            opacity: 0.1,
            borderRadius: 6,
          },
        };

      default:
        return {
          container: baseContainer,
          tab: baseTab,
          activeTab: {},
          indicator: {
            ...baseIndicator,
            opacity: 0.1,
            borderRadius: 8,
          },
        };
    }
  }, [variant, currentTheme, iconPosition]);

  const variantStyles = useMemo(() => getVariantStyles(), [getVariantStyles]);

  // Render tab item
  const renderTab = useCallback(
    (tab: TabItem, index: number) => {
      const isActive = index === activeTab;
      const isDisabled = tab.disabled;

      return (
        <TouchableOpacity
          key={tab.id}
          onPress={() => handleTabPress(index)}
          disabled={isDisabled}
          style={[
            variantStyles.tab,
            tabStyle,
            isActive && variantStyles.activeTab,
            isActive && activeTabStyle,
            isDisabled && tw`opacity-50`,
            !scrollable && { flex: 1 },
          ]}
          activeOpacity={0.7}
        >
          {showIcons && tab.icon && (
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={20}
              color={
                isActive
                  ? getOptimizedTabColors(true).text
                  : currentTheme.colors.textSecondary
              }
              style={[
                iconPosition === "left" ? tw`mr-2` : tw`mb-1`,
                isDisabled && tw`opacity-50`,
              ]}
            />
          )}
          <UIText
            size="sm"
            weight="medium"
            color={
              isActive
                ? getOptimizedTabColors(true).text
                : currentTheme.colors.textSecondary
            }
            style={[
              labelStyle || {},
              ...(isActive && activeLabelStyle ? [activeLabelStyle] : []),
              ...(isDisabled ? [tw`opacity-50`] : []),
            ]}
          >
            {tab.label}
          </UIText>
          {tab.badge !== undefined && (
            <View
              style={[
                tw`ml-2 px-2 py-0.5 rounded-full`,
                {
                  backgroundColor: isActive
                    ? getOptimizedBadgeColors(true).background
                    : currentTheme.colors.textSecondary,
                },
              ]}
            >
              <UIText
                size="xs"
                weight="medium"
                color={getOptimizedBadgeColors(true).text}
              >
                {tab.badge}
              </UIText>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [
      activeTab,
      currentTheme,
      handleTabPress,
      iconPosition,
      labelStyle,
      activeLabelStyle,
      showIcons,
      tabStyle,
      activeTabStyle,
      variantStyles,
      variant,
      scrollable,
    ]
  );

  // Main container layout handler
  const handleLayout = useCallback((event: any) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

  const content = (
    <View
      style={[
        tw`relative`,
        variantStyles.container,
        containerStyle,
        centered && !scrollable && tw`self-center`,
      ]}
      onLayout={handleLayout}
    >
      {/* Animated Indicator */}
      {showIndicator && containerWidth > 0 && tabWidths[activeTab] && (
        <Animated.View
          style={[
            variantStyles.indicator,
            indicatorStyle,
            {
              width: tabWidths[activeTab],
              transform: [{ translateX }],
            },
          ]}
        />
      )}

      {/* Tabs */}
      <View style={[tw`flex-row`, !scrollable && tw`flex-1`]}>
        {tabs.map(renderTab)}
      </View>
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`px-4`}
      >
        {content}
      </ScrollView>
    );
  }

  if (enableSwipe) {
    return (
      <GestureHandlerRootView>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-10, 10]}
          failOffsetY={[-20, 20]}
        >
          {content}
        </PanGestureHandler>
      </GestureHandlerRootView>
    );
  }

  return content;
};

export default TabMenu;
