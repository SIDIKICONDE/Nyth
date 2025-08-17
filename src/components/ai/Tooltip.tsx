import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as React from "react";
import { useState } from "react";
import {
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import tw from "twrnc";

import { useTheme } from "../../contexts/ThemeContext";
import { useCentralizedFont } from "../../hooks/useCentralizedFont";
import { useTranslation } from "../../hooks/useTranslation";
import { ContentText, UIText } from "../ui/Typography";

// Interface pour les props du composant Tooltip
export interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);
  const { currentTheme } = useTheme();
  const { t } = useTranslation();
  const { ui, content: contentFont } = useCentralizedFont();

  return (
    <View style={tw`relative`}>
      <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View
            style={tw`flex-1 justify-center items-center bg-black bg-opacity-30`}
          >
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={[
                tw`mx-5 p-4 rounded-xl`,
                {
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                  borderWidth: 1,
                  maxWidth: 300,
                },
              ]}
            >
              <UIText
                size="sm"
                weight="medium"
                style={[ui, tw`mb-3`, { color: currentTheme.colors.accent }]}
              >
                <MaterialCommunityIcons
                  name="information"
                  size={16}
                  color={currentTheme.colors.accent}
                />{" "}
                {t("aiSettings.tooltip.title")}
              </UIText>
              <ContentText
                size="sm"
                style={[contentFont, { color: currentTheme.colors.text }]}
              >
                {content}
              </ContentText>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={[
                  tw`mt-3 self-end px-3 py-1 rounded-full`,
                  { backgroundColor: `${currentTheme.colors.accent}20` },
                ]}
              >
                <UIText
                  size="xs"
                  weight="medium"
                  style={[ui, { color: currentTheme.colors.accent }]}
                >
                  {t("aiSettings.tooltip.ok")}
                </UIText>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default Tooltip;
