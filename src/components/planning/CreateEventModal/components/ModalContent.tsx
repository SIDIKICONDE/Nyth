import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { PlanningEvent } from "@/types/planning";
import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { UIText } from "../../../ui/Typography";
import { DateTimeSelector } from "./DateTimeSelector";
import { DurationSelector } from "./DurationSelector";
import { PrioritySelector } from "./PrioritySelector";
import { TextFields } from "./TextFields";
import { TypeSelector } from "./TypeSelector";

interface ModalContentProps {
  fadeAnim: Animated.Value;
  // Text fields
  title: string;
  setTitle: (title: string) => void;
  location: string;
  setLocation: (location: string) => void;
  tags: string;
  setTags: (tags: string) => void;
  // Type and priority
  type: PlanningEvent["type"];
  setType: (type: PlanningEvent["type"]) => void;
  priority: PlanningEvent["priority"];
  setPriority: (priority: PlanningEvent["priority"]) => void;
  // Date and time
  startDate: Date;
  startTime: Date;
  showDatePicker: boolean;
  showTimePicker: boolean;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: Date) => void;
  setShowDatePicker: (show: boolean) => void;
  setShowTimePicker: (show: boolean) => void;
  // Duration
  estimatedDuration: number;
  setEstimatedDuration: (duration: number) => void;
}

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  fadeAnim: Animated.Value;
  delay: number;
}

const AnimatedSection: React.FC<SectionProps> = ({
  title,
  icon,
  children,
  fadeAnim,
  delay,
}) => {
  const { currentTheme } = useTheme();

  return (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [delay, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionIconContainer,
            { backgroundColor: currentTheme.colors.primary + "15" },
          ]}
        >
          <Ionicons
            name={icon as any}
            size={20}
            color={currentTheme.colors.primary}
          />
        </View>
        <UIText
          size="base"
          weight="semibold"
          color={currentTheme.colors.text}
          style={styles.sectionTitle}
        >
          {title}
        </UIText>
      </View>
      {children}
    </Animated.View>
  );
};

export const ModalContent: React.FC<ModalContentProps> = ({
  fadeAnim,
  title,
  setTitle,
  location,
  setLocation,
  tags,
  setTags,
  type,
  setType,
  priority,
  setPriority,
  startDate,
  startTime,
  showDatePicker,
  showTimePicker,
  onDateChange,
  onTimeChange,
  setShowDatePicker,
  setShowTimePicker,
  estimatedDuration,
  setEstimatedDuration,
}) => {
  const { t } = useTranslation();

  return (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}
    >
      {/* Section Informations générales */}
      <AnimatedSection
        title={t(
          "planning.events.modal.sections.generalInfo",
          "General Information"
        )}
        icon="document-text"
        fadeAnim={fadeAnim}
        delay={20}
      >
        <TextFields
          title={title}
          setTitle={setTitle}
          location={location}
          setLocation={setLocation}
          tags={tags}
          setTags={setTags}
        />
      </AnimatedSection>

      {/* Section Configuration */}
      <AnimatedSection
        title={t(
          "planning.events.modal.sections.configuration",
          "Configuration"
        )}
        icon="options"
        fadeAnim={fadeAnim}
        delay={40}
      >
        <TypeSelector selectedType={type} onTypeChange={setType} />
        <PrioritySelector
          selectedPriority={priority}
          onPriorityChange={setPriority}
        />
      </AnimatedSection>

      {/* Section Planification */}
      <AnimatedSection
        title={t("planning.events.modal.sections.planning", "Planning")}
        icon="time"
        fadeAnim={fadeAnim}
        delay={60}
      >
        <DateTimeSelector
          startDate={startDate}
          startTime={startTime}
          showDatePicker={showDatePicker}
          showTimePicker={showTimePicker}
          onDateChange={onDateChange}
          onTimeChange={onTimeChange}
          setShowDatePicker={setShowDatePicker}
          setShowTimePicker={setShowTimePicker}
        />
        <DurationSelector
          selectedDuration={estimatedDuration}
          onDurationChange={setEstimatedDuration}
        />
      </AnimatedSection>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  sectionTitle: {
    letterSpacing: -0.2,
  },
});
