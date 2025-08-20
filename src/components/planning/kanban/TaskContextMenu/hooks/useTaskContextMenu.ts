import { useCallback, useState } from "react";
import { Dimensions } from "react-native";
import { Task } from "../../../../../types/planning";

interface MenuPosition {
  x: number;
  y: number;
}

interface UseTaskContextMenuReturn {
  menuVisible: boolean;
  selectedTask: Task | null;
  menuPosition: MenuPosition;
  statusModalVisible: boolean;
  showMenu: (task: Task, position: MenuPosition) => void;
  hideMenu: () => void;
  hideMenuAndClearTask: () => void;
  showStatusModal: () => void;
  hideStatusModal: () => void;
  handleEdit: () => void;
  handleDelete: () => void;
}

interface UseTaskContextMenuProps {
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskStatusChange?: (task: Task, newStatus: string) => void;
}

export const useTaskContextMenu = ({
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
}: UseTaskContextMenuProps = {}): UseTaskContextMenuReturn => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    x: 0,
    y: 0,
  });
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const MENU_WIDTH = 200;
  const MENU_HEIGHT = 150;

  const adjustMenuPosition = useCallback(
    (rawPosition: MenuPosition): MenuPosition => {
      let { x, y } = rawPosition;

      // Ajuster X pour éviter de sortir de l'écran à droite
      if (x + MENU_WIDTH > screenWidth) {
        x = screenWidth - MENU_WIDTH - 16;
      }

      // Ajuster Y pour éviter de sortir de l'écran en bas
      if (y + MENU_HEIGHT > screenHeight) {
        y = y - MENU_HEIGHT - 20;
      }

      // S'assurer que le menu ne sort pas par le haut ou la gauche
      x = Math.max(16, x);
      y = Math.max(50, y);

      return { x, y };
    },
    [screenWidth, screenHeight]
  );

  const showMenu = useCallback((task: Task, position: MenuPosition) => {
    setSelectedTask(task);
    setMenuPosition(position);
    setMenuVisible(true);
  }, []);

  const hideMenu = useCallback(() => {
    setMenuVisible(false);
    setMenuPosition({ x: 0, y: 0 });
    // Ne pas effacer selectedTask ici pour permettre au modal de statut de l'utiliser
  }, []);

  const hideMenuAndClearTask = useCallback(() => {
    setMenuVisible(false);
    setSelectedTask(null);
    setMenuPosition({ x: 0, y: 0 });
  }, []);

  const showStatusModal = useCallback(() => {
    setStatusModalVisible(true);
    hideMenu(); // Cache juste le menu mais garde selectedTask
  }, [hideMenu]);

  const hideStatusModal = useCallback(() => {
    setStatusModalVisible(false);

    // Utiliser un délai pour éviter les problèmes de timing avec React Native
    setTimeout(() => {
      setSelectedTask(null); // Effacer la tâche sélectionnée quand le modal se ferme
      setMenuVisible(false); // S'assurer que le menu est aussi fermé
      setMenuPosition({ x: 0, y: 0 }); // Réinitialiser la position
    }, 100);
  }, []);

  const handleEdit = useCallback(() => {
    if (selectedTask && onTaskEdit) {
      onTaskEdit(selectedTask);
    }
  }, [selectedTask, onTaskEdit]);

  const handleDelete = useCallback(() => {
    if (selectedTask && onTaskDelete) {
      onTaskDelete(selectedTask.id);
    }
  }, [selectedTask, onTaskDelete]);

  return {
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
  };
};
