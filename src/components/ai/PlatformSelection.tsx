import React from "react";
import { TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { useTranslation } from "../../hooks/useTranslation";
import { Collapsible } from "../common";
import { UIText } from "../ui/Typography";

interface Platform {
  id: string;
  name: string;
  color: string;
  icon: React.ReactElement;
}

interface PlatformSelectionProps {
  selectedPlatform: string;
  onPlatformSelect: (platform: string) => void;
}

export const PlatformSelection: React.FC<PlatformSelectionProps> = ({
  selectedPlatform,
  onPlatformSelect,
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui } = useCentralizedFont();

  const platforms: Platform[] = [
    {
      id: "tiktok",
      name: t("aiGenerator.platform.tiktok.name"),
      color: "#000000",
      icon: (
        <View
          style={[
            tw`w-6 h-6 rounded-lg items-center justify-center`,
            { backgroundColor: "#000000" },
          ]}
        >
          <UIText size="sm" weight="bold" style={[ui, { color: "#ffffff" }]}>
            {t("aiGenerator.platform.tiktok.abbrev", "TT")}
          </UIText>
        </View>
      ),
    },
    {
      id: "youtube",
      name: t("aiGenerator.platform.youtube.name"),
      color: "#FF0000",
      icon: (
        <View
          style={[
            tw`w-6 h-6 rounded-lg items-center justify-center`,
            { backgroundColor: "#FF0000" },
          ]}
        >
          <UIText size="xs" style={[ui, { color: "#ffffff" }]}>
            {t("aiGenerator.platform.youtube.icon", "▶")}
          </UIText>
        </View>
      ),
    },
    {
      id: "instagram",
      name: t("aiGenerator.platform.instagram.name"),
      color: "#E4405F",
      icon: (
        <View
          style={[
            tw`w-6 h-6 rounded-lg items-center justify-center border-2`,
            {
              backgroundColor: "#ffffff",
              borderColor: "#E4405F",
            },
          ]}
        >
          <View
            style={[tw`w-3 h-3 rounded border`, { borderColor: "#E4405F" }]}
          >
            <View
              style={[
                tw`w-0.5 h-0.5 rounded-full absolute`,
                {
                  backgroundColor: "#E4405F",
                  top: 0.5,
                  right: 0.5,
                },
              ]}
            />
          </View>
        </View>
      ),
    },
    {
      id: "linkedin",
      name: t("aiGenerator.platform.linkedin.name"),
      color: "#0077B5",
      icon: (
        <View
          style={[
            tw`w-6 h-6 rounded-lg items-center justify-center`,
            { backgroundColor: "#0077B5" },
          ]}
        >
          <UIText size="sm" weight="bold" style={[ui, { color: "#ffffff" }]}>
            {t("aiGenerator.platform.linkedin.abbrev", "in")}
          </UIText>
        </View>
      ),
    },
  ];

  // Get selected platform label
  const getSelectedPlatformLabel = () => {
    const selectedPlatformObj = platforms.find(
      (p) => p.id === selectedPlatform
    );
    return selectedPlatformObj ? selectedPlatformObj.name : "";
  };

  return (
    <Collapsible
      title={t("aiGenerator.platform.title")}
      icon="🎯"
      isDefaultOpen={true}
      selectedValue={selectedPlatform}
      selectedLabel={getSelectedPlatformLabel()}
      helpMessage={t("aiGenerator.platform.help")}
    >
      <View style={tw`flex-row gap-1`}>
        {platforms.map((platform) => (
          <TouchableOpacity
            key={platform.id}
            onPress={() => {
              if (selectedPlatform === platform.id) {
                onPlatformSelect("");
              } else {
                onPlatformSelect(platform.id);
              }
            }}
            style={[
              tw`flex-1 p-1.5 rounded-lg border items-center`,
              {
                backgroundColor:
                  selectedPlatform === platform.id
                    ? `${platform.color}15`
                    : currentTheme.colors.surface,
                borderColor:
                  selectedPlatform === platform.id
                    ? platform.color
                    : currentTheme.colors.border,
                borderWidth: selectedPlatform === platform.id ? 2 : 1,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: selectedPlatform === platform.id ? 0.1 : 0.03,
                shadowRadius: 2,
                elevation: selectedPlatform === platform.id ? 2 : 1,
                transform: [
                  {
                    scale: selectedPlatform === platform.id ? 1.01 : 1,
                  },
                ],
              },
            ]}
          >
            {selectedPlatform === platform.id && (
              <View
                style={[
                  tw`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full items-center justify-center`,
                  { backgroundColor: platform.color },
                ]}
              >
                <UIText
                  size="xs"
                  weight="bold"
                  style={[ui, { color: "white" }]}
                >
                  {t("common.checkmark", "✓")}
                </UIText>
              </View>
            )}

            {platform.icon}
            <UIText
              size="xs"
              weight="medium"
              style={[
                ui,
                tw`mt-0.5`,
                {
                  color:
                    selectedPlatform === platform.id
                      ? platform.color
                      : currentTheme.colors.text,
                },
              ]}
            >
              {platform.name}
            </UIText>
          </TouchableOpacity>
        ))}
      </View>
    </Collapsible>
  );
};
