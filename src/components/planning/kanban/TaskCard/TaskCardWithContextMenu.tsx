import React, { useRef } from "react";
import { View } from "react-native";
import {
  TaskContextMenu,
  TaskStatusModal,
  useTaskContextMenu,
} from "../TaskContextMenu";
import { TaskCard } from "./TaskCardComponent";
import { TaskCardProps } from "./types";

interface TaskCardWithContextMenuProps extends TaskCardProps {
  enableContextMenu?: boolean;
}

export const TaskCardWithContextMenu: React.FC<
  TaskCardWithContextMenuProps
> = ({ enableContextMenu = true, onStatusChange, ...taskCardProps }) => {
  const cardRef = useRef<View>(null);

  const {
    menuVisible,
    selectedTask,
    menuPosition,
    statusModalVisible,
    showMenu,
    hideMenu,
    hideMenuAndClearTask,
    showStatusModal,
    hideStatusModal,
    handleEdit,
    handleDelete,
  } = useTaskContextMenu({
    onTaskEdit: taskCardProps.onEdit,
    onTaskDelete: (taskId) => taskCardProps.onDelete(),
    onTaskStatusChange: onStatusChange,
  });

  const handleLongPress = () => {
    if (!enableContextMenu) return;

    // Mesurer la position de la carte
    if (cardRef.current) {
      cardRef.current.measure((x, y, width, height, pageX, pageY) => {
        const position = {
          x: pageX + width / 2, // Centrer horizontalement
          y: pageY, // Position Y de la carte
        };

        showMenu(taskCardProps.task, position);
      });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange && selectedTask) {
      onStatusChange(selectedTask, newStatus);
    }
    hideStatusModal();
  };

  return (
    <>
      <View ref={cardRef} collapsable={false}>
        <TaskCard
          {...taskCardProps}
          onLongPress={enableContextMenu ? handleLongPress : undefined}
        />
      </View>

      {/* Menu contextuel */}
      <TaskContextMenu
        task={selectedTask}
        visible={menuVisible}
        position={menuPosition}
        onClose={hideMenuAndClearTask}
        onEdit={handleEdit}
        onChangeStatus={showStatusModal}
        onDelete={handleDelete}
        onCancelReminders={undefined}
      />

      {/* Modal de changement de statut */}
      <TaskStatusModal
        task={selectedTask}
        visible={statusModalVisible}
        onClose={hideStatusModal}
        onStatusChange={handleStatusChange}
      />
    </>
  );
};
