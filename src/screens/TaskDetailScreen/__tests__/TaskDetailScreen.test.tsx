import React from "react";
import { render, screen } from "@testing-library/react-native";
import { TaskDetailScreen } from "../TaskDetailScreen";

// Mock des dépendances
jest.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({
    currentTheme: {
      colors: {
        background: "#ffffff",
        surface: "#f5f5f5",
        text: "#000000",
        textSecondary: "#666666",
        primary: "#3B82F6",
        error: "#EF4444",
        warning: "#F59E0B",
        success: "#10B981",
        border: "#E5E7EB",
      },
    },
  }),
}));

jest.mock("../../../hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

jest.mock("../hooks/useTaskDetail", () => ({
  useTaskDetail: () => ({
    task: {
      id: "test-task-id",
      title: "Test Task",
      description: "Test Description",
      status: "todo",
      priority: "medium",
      startDate: new Date("2024-01-01"),
      dueDate: new Date("2024-01-31"),
      estimatedHours: 8,
      category: "Development",
      tags: ["test", "example"],
      attachments: [],
      images: [],
      dependencies: [],
      blockedBy: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      userId: "test-user-id",
    },
    showEditModal: false,
    showStatusSection: true,
    showMenu: false,
    handleGoBack: jest.fn(),
    handleEdit: jest.fn(),
    handleDelete: jest.fn(),
    handleStatusChange: jest.fn(),
    handleTaskSave: jest.fn(),
    handleMenuPress: jest.fn(),
    handleCloseMenu: jest.fn(),
    handleToggleStatusSection: jest.fn(),
    setShowEditModal: jest.fn(),
  }),
}));

jest.mock("../../../components/planning/TaskModal", () => ({
  TaskModal: () => null,
}));

describe("TaskDetailScreen", () => {
  const mockRoute = {
    key: "TaskDetailScreen",
    name: "TaskDetail" as const,
    params: {
      taskId: "test-task-id",
    },
  };

  it("renders task details correctly", () => {
    render(<TaskDetailScreen route={mockRoute} navigation={{} as any} />);

    // Vérifier que le titre de la tâche est affiché
    expect(screen.getByText("Test Task")).toBeTruthy();

    // Vérifier que la description est affichée
    expect(screen.getByText("Test Description")).toBeTruthy();

    // Vérifier que la catégorie est affichée
    expect(screen.getByText("Development")).toBeTruthy();
  });

  it("shows error view when task is not found", () => {
    // Mock useTaskDetail pour retourner null
    jest.doMock("../hooks/useTaskDetail", () => ({
      useTaskDetail: () => ({
        task: null,
        showEditModal: false,
        showStatusSection: true,
        showMenu: false,
        handleGoBack: jest.fn(),
        handleEdit: jest.fn(),
        handleDelete: jest.fn(),
        handleStatusChange: jest.fn(),
        handleTaskSave: jest.fn(),
        handleMenuPress: jest.fn(),
        handleCloseMenu: jest.fn(),
        handleToggleStatusSection: jest.fn(),
        setShowEditModal: jest.fn(),
      }),
    }));

    render(<TaskDetailScreen route={mockRoute} navigation={{} as any} />);

    // Vérifier que le message d'erreur est affiché
    expect(screen.getByText("Tâche introuvable")).toBeTruthy();
  });
});
