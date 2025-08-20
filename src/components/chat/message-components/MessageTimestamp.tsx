import React from "react";
import tw from "twrnc";
import { UIText } from "../../ui/Typography";

interface MessageTimestampProps {
  timestamp: Date | number;
  style: any;
}

export const MessageTimestamp: React.FC<MessageTimestampProps> = ({
  timestamp,
  style,
}) => {
  // Convertir en Date si c'est un number (timestamp Unix)
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  return (
    <UIText size="xs" style={[style, tw`ml-2`]}>
      {date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </UIText>
  );
};
