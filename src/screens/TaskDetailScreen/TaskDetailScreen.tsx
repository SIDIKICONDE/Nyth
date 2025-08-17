import React from "react";
import { SafeAreaView, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTheme } from "../../contexts/ThemeContext";
import { TaskModal } from "../../components/planning/TaskModal";
import {
  TaskDetailHeader,
  TaskStatusSlider,
  TaskDetailsCard,
  TaskAttachmentsCard,
  TaskMenuOverlay,
  TaskErrorView,
  SubtasksSection,
} from "./components";
import { useTaskDetail } from "./hooks/useTaskDetail";
import { styles } from "./styles";

type RootStackParamList = {
  TaskDetail: { taskId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "TaskDetail">;

export const TaskDetailScreen: React.FC<Props> = ({ route }) => {
  const { taskId } = route.params;
  const { currentTheme } = useTheme();

  const {
    task,
    showEditModal,
    showStatusSection,
    showMenu,
    handleGoBack,
    handleEdit,
    handleDelete,
    handleStatusChange,
    handleTaskSave,
    handleMenuPress,
    handleCloseMenu,
    handleToggleStatusSection,
    handleToggleSubtask,
    setShowEditModal,
  } = useTaskDetail(taskId);

  if (!task) {
    return <TaskErrorView />;
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: currentTheme.colors.background },
      ]}
    >
      {/* Header */}
      <TaskDetailHeader
        task={task}
        onGoBack={handleGoBack}
        onMenuPress={handleMenuPress}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Slider */}
        {showStatusSection && (
          <TaskStatusSlider task={task} onStatusChange={handleStatusChange} />
        )}

        {/* Details Card */}
        <TaskDetailsCard task={task} />

        {/* Subtasks Section */}
        <SubtasksSection
          subtasks={task.subtasks || []}
          onToggleSubtask={handleToggleSubtask}
        />
      </ScrollView>

      {/* Footer avec Attachments Card */}
      <TaskAttachmentsCard task={task} />

      {/* Menu Overlay */}
      <TaskMenuOverlay
        visible={showMenu}
        showStatusSection={showStatusSection}
        onClose={handleCloseMenu}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatusSection={handleToggleStatusSection}
      />

      {/* Edit Modal */}
      <TaskModal
        visible={showEditModal}
        task={task}
        onClose={() => setShowEditModal(false)}
        onSave={handleTaskSave}
      />
    </SafeAreaView>
  );
};
