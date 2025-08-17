import { CustomTheme as Theme } from "@/types/theme";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import React from "react";
import { Text, View } from "react-native";
import tw from "twrnc";
import { HelpContent } from "../types";

interface ContentRenderersProps {
  content: HelpContent;
  currentTheme: Theme;
}

export const TextRenderer: React.FC<ContentRenderersProps> = ({
  content,
  currentTheme,
}) => (
  <Text
    style={[tw`text-sm leading-6 mb-4`, { color: currentTheme.colors.text }]}
  >
    {content.content as string}
  </Text>
);

export const ListRenderer: React.FC<ContentRenderersProps> = ({
  content,
  currentTheme,
}) => (
  <View style={tw`mb-4`}>
    {content.title && (
      <Text
        style={[
          tw`text-sm font-semibold mb-2`,
          { color: currentTheme.colors.text },
        ]}
      >
        {content.title}
      </Text>
    )}
    {Array.isArray(content.content) &&
      content.content.map((item, index) => (
        <View key={index} style={tw`flex-row items-start mb-1`}>
          <Text
            style={[
              tw`text-xs mr-2 mt-1`,
              { color: currentTheme.colors.accent },
            ]}
          >
            •
          </Text>
          <Text
            style={[
              tw`text-sm flex-1 leading-5`,
              { color: currentTheme.colors.text },
            ]}
          >
            {item}
          </Text>
        </View>
      ))}
  </View>
);

export const StepsRenderer: React.FC<ContentRenderersProps> = ({
  content,
  currentTheme,
}) => (
  <View style={tw`mb-4`}>
    {content.title && (
      <Text
        style={[
          tw`text-sm font-semibold mb-2`,
          { color: currentTheme.colors.text },
        ]}
      >
        {content.title}
      </Text>
    )}
    {Array.isArray(content.content) &&
      content.content.map((step, index) => (
        <View key={index} style={tw`flex-row items-start mb-2`}>
          <View
            style={[
              tw`w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5`,
              { backgroundColor: currentTheme.colors.accent },
            ]}
          >
            <Text style={tw`text-white text-xs font-bold`}>{index + 1}</Text>
          </View>
          <Text
            style={[
              tw`text-sm flex-1 leading-5`,
              { color: currentTheme.colors.text },
            ]}
          >
            {step}
          </Text>
        </View>
      ))}
  </View>
);

export const WarningRenderer: React.FC<ContentRenderersProps> = ({
  content,
}) => (
  <View
    style={[
      tw`p-3 rounded-lg mb-4 flex-row items-start`,
      {
        backgroundColor: "#FEF3C7",
        borderLeftWidth: 4,
        borderLeftColor: "#F59E0B",
      },
    ]}
  >
    <MaterialCommunityIcons
      name="alert"
      size={20}
      color="#F59E0B"
      style={tw`mr-2`}
    />
    <Text style={[tw`text-sm flex-1 leading-5`, { color: "#92400E" }]}>
      {content.content as string}
    </Text>
  </View>
);

export const TipRenderer: React.FC<ContentRenderersProps> = ({ content }) => (
  <View
    style={[
      tw`p-3 rounded-lg mb-4 flex-row items-start`,
      {
        backgroundColor: "#D1FAE5",
        borderLeftWidth: 4,
        borderLeftColor: "#10B981",
      },
    ]}
  >
    <MaterialCommunityIcons
      name="lightbulb"
      size={20}
      color="#10B981"
      style={tw`mr-2`}
    />
    <Text style={[tw`text-sm flex-1 leading-5`, { color: "#065F46" }]}>
      {content.content as string}
    </Text>
  </View>
);
