import React from "react";
import { KanbanColumn } from "../../KanbanColumn";
import { ColumnListProps } from "../types";

export const ColumnList: React.FC<ColumnListProps> = ({
  columns,
  getTasksForColumn,
  handleTaskMove,
  onTaskPress,
  onTaskCreate,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onColumnEdit,
  onColumnDelete,
  canDeleteColumn,
  kanbanStyles,
  onCycleColumnColor,
  onSelectColumnColor,
  availableColors,
}) => {
  return (
    <>
      {columns.map((column) => {
        const columnTasks = getTasksForColumn(column.id);

        return (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            tasks={columnTasks as any}
            onTaskMove={(taskId, newStatus) =>
              handleTaskMove(taskId, newStatus)
            }
            onTaskPress={onTaskPress as any}
            onTaskCreate={() => onTaskCreate?.(column.id)}
            onTaskEdit={onTaskEdit as any}
            onTaskDelete={onTaskDelete || (() => {})}
            onTaskStatusChange={onTaskStatusChange as any}
            customStyles={{
              ...kanbanStyles,
              tasksList: {
                ...kanbanStyles?.tasksList,
                zIndex: -100,
              },
            }}
            onColumnEdit={() => onColumnEdit(column)}
            onColumnDelete={() => onColumnDelete(column.id)}
            onCycleColor={() => onCycleColumnColor(column)}
            availableColors={availableColors}
            onSelectColor={(c) => onSelectColumnColor(column, c)}
            canDelete={canDeleteColumn(column.id)}
            description={column.description}
            maxTasks={column.maxTasks}
            icon={column.icon}
            borderStyle={column.borderStyle as any}
          />
        );
      })}
    </>
  );
};
