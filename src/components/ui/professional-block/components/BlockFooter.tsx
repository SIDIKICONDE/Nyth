import React from "react";
import { View } from "react-native";
import tw from "twrnc";

interface BlockFooterProps {
  footerAction: React.ReactNode;
  padding: number;
}

export const BlockFooter: React.FC<BlockFooterProps> = ({
  footerAction,
  padding,
}) => {
  return (
    <View style={tw`px-${padding} pb-${padding} pt-0`}>{footerAction}</View>
  );
};
