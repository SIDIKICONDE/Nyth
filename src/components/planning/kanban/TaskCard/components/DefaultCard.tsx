import React, { useState } from "react";
import { TouchableOpacity, View, Image, ScrollView } from "react-native";
import { UIText } from "../../../../ui/Typography";
import { CoverFlowCarousel } from "../../../../ui/CoverFlowCarousel";
import { PRIORITY_COLORS } from "../constants";
import { ImageViewer } from "../../../TaskModal/components/ImageViewer";
import { FileViewer } from "../../../TaskModal/components/FileViewer";
import { styles } from "../styles";
import { DefaultCardProps } from "../types";
import { getCardOpacity, getCardTransform } from "../utils";

export const DefaultCard: React.FC<DefaultCardProps> = ({
  task,
  onPress,
  onEdit,
  onLongPress,
  isDragging = false,
  customStyles,
  cardIcon,
  customization,
  themeColors,
}) => {
  const { showEstimatedTime, showAttachments } = customization;
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [fileViewerVisible, setFileViewerVisible] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          styles.defaultCard,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            transform: getCardTransform(isDragging),
            opacity: getCardOpacity(isDragging),
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: customStyles?.shadowOpacity ?? 0.1,
            shadowRadius: 3,
            elevation: customStyles?.elevation ?? 3,
          },
          customStyles,
        ]}
        onPress={onPress}
        onLongPress={handleLongPress}
        delayLongPress={300}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <UIText style={styles.cardIcon}>{cardIcon}</UIText>
          <UIText
            size="sm"
            weight="medium"
            style={[styles.cardTitle, { color: themeColors.text }]}
            numberOfLines={2}
          >
            {task.title}
          </UIText>
        </View>

        {task.description && (
          <UIText
            size="xs"
            style={[styles.description, { color: themeColors.textSecondary }]}
            numberOfLines={2}
          >
            {task.description}
          </UIText>
        )}

        {/* Images attachées avec CoverFlow */}
        {showAttachments && task.images && task.images.length > 0 && (
          <CoverFlowCarousel
            images={task.images.map((image) => image.url)}
            onImagePress={(index) => {
              setSelectedImageIndex(index);
              setImageViewerVisible(true);
            }}
            itemWidth={40}
            itemHeight={32}
            maxVisibleItems={4}
            themeColors={{
              border: themeColors.border,
              textSecondary: themeColors.textSecondary,
            }}
          />
        )}

        {/* Pièces jointes */}
        {showAttachments && task.attachments && task.attachments.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSelectedFileIndex(0);
              setFileViewerVisible(true);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 8,
              marginBottom: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: `${themeColors.primary}10`,
              borderRadius: 4,
            }}
          >
            <UIText size="xs" style={{ marginRight: 4 }}>
              📎
            </UIText>
            <UIText size="xs" color={themeColors.textSecondary}>
              {task.attachments.length} fichier
              {task.attachments.length > 1 ? "s" : ""}
            </UIText>
          </TouchableOpacity>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.cardMeta}>
            <View
              style={[
                styles.priorityIndicator,
                { backgroundColor: PRIORITY_COLORS[task.priority] },
              ]}
            />
            <UIText
              size="xs"
              style={[
                styles.priorityText,
                { color: themeColors.textSecondary },
              ]}
            >
              {task.priority}
            </UIText>
            {showEstimatedTime && task.estimatedHours && (
              <>
                <UIText
                  size="xs"
                  style={[
                    styles.separator,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  •
                </UIText>
                <UIText
                  size="xs"
                  style={[
                    styles.timeText,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {task.estimatedHours}h
                </UIText>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* ImageViewer */}
      {task.images && task.images.length > 0 && (
        <ImageViewer
          visible={imageViewerVisible}
          images={task.images}
          initialIndex={selectedImageIndex}
          onClose={() => setImageViewerVisible(false)}
        />
      )}

      {/* FileViewer */}
      {task.attachments && task.attachments.length > 0 && (
        <FileViewer
          visible={fileViewerVisible}
          files={task.attachments}
          initialIndex={selectedFileIndex}
          onClose={() => setFileViewerVisible(false)}
        />
      )}
    </>
  );
};
