import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../../contexts/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import SearchBar from "./SearchBar";

interface TabNavigationProps {
  currentPage: number;
  onPageChange: (pageIndex: number) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  currentPage,
  onPageChange,
  searchText,
  onSearchChange,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const [showSearchBar, setShowSearchBar] = React.useState(false);

  const tabs = [
    {
      index: 0,
      icon: "cog-outline",
      label: t("menu.settings"),
    },
    {
      index: 1,
      icon: "chat-outline",
      label: t("menu.conversations"),
    },
  ];

  const toggleSearchBar = React.useCallback(() => {
    setShowSearchBar((prev) => !prev);
  }, []);

  return (
    <View style={tw`px-3 pb-2`}>
      <View style={tw`flex-row items-center justify-center mb-3`}>
        {/* Simple tab selector */}
        <View
          style={[
            tw`flex-row rounded-2xl p-1`,
            {
              backgroundColor: currentTheme.isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.06)",
            },
          ]}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.index}
              onPress={() => onPageChange(tab.index)}
              style={[
                tw`px-4 py-2 rounded-xl flex-row items-center justify-center mx-1`,
                {
                  backgroundColor:
                    currentPage === tab.index
                      ? currentTheme.colors.primary
                      : "transparent",
                },
              ]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={20}
                color={
                  currentPage === tab.index
                    ? "white"
                    : currentTheme.colors.textSecondary
                }
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Search icon */}
        {currentPage === 1 && (
          <TouchableOpacity
            onPress={toggleSearchBar}
            style={[
              tw`ml-4 w-10 h-10 rounded-full items-center justify-center`,
              {
                backgroundColor: currentTheme.isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.06)",
              },
            ]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={showSearchBar ? "close" : "magnify"}
              size={20}
              color={
                showSearchBar
                  ? currentTheme.colors.accent
                  : currentTheme.colors.textSecondary
              }
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Search bar */}
      {currentPage === 1 && showSearchBar && (
        <View style={tw`px-0.3 mt-3`}>
          <SearchBar
            value={searchText}
            onChangeText={onSearchChange}
            placeholder={t("menu.searchPlaceholder")}
          />
        </View>
      )}
    </View>
  );
};

export default TabNavigation;
