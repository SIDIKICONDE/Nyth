import { useState, useCallback } from "react";

interface UseContextMenuReturn {
  isVisible: boolean;
  contextMenuDate: Date | null;
  showContextMenu: (date: Date) => void;
  hideContextMenu: () => void;
  toggleContextMenu: (date: Date) => void;
}

export const useContextMenu = (): UseContextMenuReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [contextMenuDate, setContextMenuDate] = useState<Date | null>(null);

  const showContextMenu = useCallback((date: Date) => {
    setContextMenuDate(date);
    setIsVisible(true);
  }, []);

  const hideContextMenu = useCallback(() => {
    setIsVisible(false);
    setContextMenuDate(null);
  }, []);

  const toggleContextMenu = useCallback(
    (date: Date) => {
      const isSameDate =
        contextMenuDate &&
        date.getDate() === contextMenuDate.getDate() &&
        date.getMonth() === contextMenuDate.getMonth() &&
        date.getFullYear() === contextMenuDate.getFullYear();

      if (isSameDate && isVisible) {
        hideContextMenu();
      } else {
        showContextMenu(date);
      }
    },
    [contextMenuDate, isVisible, showContextMenu, hideContextMenu]
  );

  return {
    isVisible,
    contextMenuDate,
    showContextMenu,
    hideContextMenu,
    toggleContextMenu,
  };
};
