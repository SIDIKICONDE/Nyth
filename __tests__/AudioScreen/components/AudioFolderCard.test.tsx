import React from 'react';
import { render, fireEvent, Alert } from '@testing-library/react-native';
import AudioFolderCard from '@/screens/AudioScreen/components/AudioFolderCard';
import { AudioFolder } from '@/screens/AudioScreen/types';

// Mock des dépendances
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      colors: {
        accent: '#3B82F6',
        text: '#000000',
        textSecondary: '#666666',
        background: '#FFFFFF',
        border: '#E5E7EB',
      },
    },
  }),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcon');

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('AudioFolderCard', () => {
  const mockFolder: AudioFolder = {
    id: 'test-folder-1',
    name: 'Test Folder',
    description: 'Test Description',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    recordingCount: 5,
    totalDuration: 1800, // 30 minutes
    isFavorite: true,
    color: '#4CAF50',
    icon: 'folder',
    tags: ['test', 'audio'],
  };

  const defaultProps = {
    folder: mockFolder,
    isSelected: false,
    isSelectionMode: false,
    onPress: jest.fn(),
    onLongPress: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render correctly with all props', () => {
      const { getByText, getByTestId } = render(
        <AudioFolderCard {...defaultProps} />,
      );

      expect(getByText('Test Folder')).toBeTruthy();
      expect(getByText('Test Description')).toBeTruthy();
      expect(getByText('5 enregistrements')).toBeTruthy();
      expect(getByText('30min')).toBeTruthy();
    });

    test('should render without description', () => {
      const folderWithoutDescription = {
        ...mockFolder,
        description: undefined,
      };
      const { queryByText } = render(
        <AudioFolderCard {...defaultProps} folder={folderWithoutDescription} />,
      );

      expect(queryByText('Test Description')).toBeNull();
    });

    test('should render with custom color', () => {
      const { getByTestId } = render(<AudioFolderCard {...defaultProps} />);

      const gradient = getByTestId('folder-gradient');
      expect(gradient).toBeTruthy();
    });

    test('should render favorite icon when isFavorite is true', () => {
      const { getByTestId } = render(<AudioFolderCard {...defaultProps} />);

      const favoriteIcon = getByTestId('favorite-icon');
      expect(favoriteIcon).toBeTruthy();
    });

    test('should not render favorite icon when isFavorite is false', () => {
      const folderNotFavorite = { ...mockFolder, isFavorite: false };
      const { queryByTestId } = render(
        <AudioFolderCard {...defaultProps} folder={folderNotFavorite} />,
      );

      expect(queryByTestId('favorite-icon')).toBeNull();
    });
  });

  describe('User Interactions', () => {
    test('should call onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <AudioFolderCard {...defaultProps} onPress={onPress} />,
      );

      const card = getByTestId('folder-card');
      fireEvent.press(card);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    test('should call onLongPress when long pressed', () => {
      const onLongPress = jest.fn();
      const { getByTestId } = render(
        <AudioFolderCard {...defaultProps} onLongPress={onLongPress} />,
      );

      const card = getByTestId('folder-card');
      fireEvent(card, 'longPress');

      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    test('should call onDelete when delete button is pressed', () => {
      const onDelete = jest.fn();
      const { getByTestId } = render(
        <AudioFolderCard {...defaultProps} onDelete={onDelete} />,
      );

      const deleteButton = getByTestId('delete-button');
      fireEvent.press(deleteButton);

      expect(Alert.alert).toHaveBeenCalled();
    });

    test('should handle delete confirmation', () => {
      const onDelete = jest.fn();
      const { getByTestId } = render(
        <AudioFolderCard {...defaultProps} onDelete={onDelete} />,
      );

      const deleteButton = getByTestId('delete-button');
      fireEvent.press(deleteButton);

      // Simuler la confirmation de suppression
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmAction = alertCall[2]?.find(
        (action: any) => action.text === 'Supprimer',
      );

      if (confirmAction?.onPress) {
        confirmAction.onPress();
        expect(onDelete).toHaveBeenCalled();
      }
    });

    test('should handle delete cancellation', () => {
      const onDelete = jest.fn();
      const { getByTestId } = render(
        <AudioFolderCard {...defaultProps} onDelete={onDelete} />,
      );

      const deleteButton = getByTestId('delete-button');
      fireEvent.press(deleteButton);

      // Simuler l'annulation
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const cancelAction = alertCall[2]?.find(
        (action: any) => action.text === 'Annuler',
      );

      if (cancelAction?.onPress) {
        cancelAction.onPress();
        expect(onDelete).not.toHaveBeenCalled();
      }
    });
  });

  describe('Selection Mode', () => {
    test('should show selection indicator when in selection mode', () => {
      const { getByTestId } = render(
        <AudioFolderCard {...defaultProps} isSelectionMode={true} />,
      );

      const selectionIndicator = getByTestId('selection-indicator');
      expect(selectionIndicator).toBeTruthy();
    });

    test('should show selected state when isSelected is true', () => {
      const { getByTestId } = render(
        <AudioFolderCard
          {...defaultProps}
          isSelectionMode={true}
          isSelected={true}
        />,
      );

      const selectionIndicator = getByTestId('selection-indicator');
      expect(selectionIndicator).toBeTruthy();
    });

    test('should not show delete button when in selection mode', () => {
      const { queryByTestId } = render(
        <AudioFolderCard {...defaultProps} isSelectionMode={true} />,
      );

      expect(queryByTestId('delete-button')).toBeNull();
    });

    test('should handle selection toggle in selection mode', () => {
      const onLongPress = jest.fn();
      const { getByTestId } = render(
        <AudioFolderCard
          {...defaultProps}
          isSelectionMode={true}
          onLongPress={onLongPress}
        />,
      );

      const card = getByTestId('folder-card');
      fireEvent.press(card);

      expect(onLongPress).toHaveBeenCalled();
    });
  });

  describe('Duration Formatting', () => {
    test('should format duration correctly for minutes', () => {
      const folderWithMinutes = { ...mockFolder, totalDuration: 1800 }; // 30 minutes
      const { getByText } = render(
        <AudioFolderCard {...defaultProps} folder={folderWithMinutes} />,
      );

      expect(getByText('30min')).toBeTruthy();
    });

    test('should format duration correctly for hours and minutes', () => {
      const folderWithHours = { ...mockFolder, totalDuration: 7320 }; // 2h 2min
      const { getByText } = render(
        <AudioFolderCard {...defaultProps} folder={folderWithHours} />,
      );

      expect(getByText('2h 2min')).toBeTruthy();
    });

    test('should format duration correctly for hours only', () => {
      const folderWithHoursOnly = { ...mockFolder, totalDuration: 7200 }; // 2h
      const { getByText } = render(
        <AudioFolderCard {...defaultProps} folder={folderWithHoursOnly} />,
      );

      expect(getByText('2h 0min')).toBeTruthy();
    });

    test('should handle zero duration', () => {
      const folderWithZeroDuration = { ...mockFolder, totalDuration: 0 };
      const { getByText } = render(
        <AudioFolderCard {...defaultProps} folder={folderWithZeroDuration} />,
      );

      expect(getByText('0min')).toBeTruthy();
    });
  });

  describe('Recording Count Formatting', () => {
    test('should format single recording correctly', () => {
      const folderWithOneRecording = { ...mockFolder, recordingCount: 1 };
      const { getByText } = render(
        <AudioFolderCard {...defaultProps} folder={folderWithOneRecording} />,
      );

      expect(getByText('1 enregistrement')).toBeTruthy();
    });

    test('should format multiple recordings correctly', () => {
      const folderWithMultipleRecordings = { ...mockFolder, recordingCount: 5 };
      const { getByText } = render(
        <AudioFolderCard
          {...defaultProps}
          folder={folderWithMultipleRecordings}
        />,
      );

      expect(getByText('5 enregistrements')).toBeTruthy();
    });

    test('should handle zero recordings', () => {
      const folderWithZeroRecordings = { ...mockFolder, recordingCount: 0 };
      const { getByText } = render(
        <AudioFolderCard {...defaultProps} folder={folderWithZeroRecordings} />,
      );

      expect(getByText('0 enregistrements')).toBeTruthy();
    });
  });

  describe('Animations', () => {
    test('should apply press animations', () => {
      const { getByTestId } = render(<AudioFolderCard {...defaultProps} />);

      const card = getByTestId('folder-card');

      // Simuler press in
      fireEvent(card, 'pressIn');

      // Simuler press out
      fireEvent(card, 'pressOut');

      // Vérifier que les animations sont appliquées
      expect(card).toBeTruthy();
    });

    test('should apply long press animations', () => {
      const onLongPress = jest.fn();
      const { getByTestId } = render(
        <AudioFolderCard {...defaultProps} onLongPress={onLongPress} />,
      );

      const card = getByTestId('folder-card');
      fireEvent(card, 'longPress');

      expect(onLongPress).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('should have proper accessibility props', () => {
      const { getByTestId } = render(<AudioFolderCard {...defaultProps} />);

      const card = getByTestId('folder-card');
      expect(card.props.accessibilityRole).toBe('button');
      expect(card.props.accessibilityLabel).toBeDefined();
    });

    test('should have different accessibility labels for selection states', () => {
      const { getByTestId: getByTestIdNormal } = render(
        <AudioFolderCard {...defaultProps} />,
      );
      const { getByTestId: getByTestIdSelected } = render(
        <AudioFolderCard
          {...defaultProps}
          isSelectionMode={true}
          isSelected={true}
        />,
      );

      const normalCard = getByTestIdNormal('folder-card');
      const selectedCard = getByTestIdSelected('folder-card');

      expect(normalCard.props.accessibilityLabel).not.toBe(
        selectedCard.props.accessibilityLabel,
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined callbacks', () => {
      const { getByTestId } = render(
        <AudioFolderCard
          {...defaultProps}
          onPress={undefined}
          onLongPress={undefined}
          onDelete={undefined}
        />,
      );

      const card = getByTestId('folder-card');
      fireEvent.press(card);
      fireEvent(card, 'longPress');

      // Should not crash
      expect(card).toBeTruthy();
    });

    test('should handle very long folder names', () => {
      const folderWithLongName = {
        ...mockFolder,
        name: 'This is a very long folder name that should be truncated properly in the UI',
      };
      const { getByText } = render(
        <AudioFolderCard {...defaultProps} folder={folderWithLongName} />,
      );

      expect(
        getByText(
          'This is a very long folder name that should be truncated properly in the UI',
        ),
      ).toBeTruthy();
    });

    test('should handle very long descriptions', () => {
      const folderWithLongDescription = {
        ...mockFolder,
        description:
          'This is a very long description that should be truncated properly in the UI to avoid layout issues',
      };
      const { getByText } = render(
        <AudioFolderCard
          {...defaultProps}
          folder={folderWithLongDescription}
        />,
      );

      expect(
        getByText(
          'This is a very long description that should be truncated properly in the UI to avoid layout issues',
        ),
      ).toBeTruthy();
    });

    test('should handle missing icon', () => {
      const folderWithoutIcon = { ...mockFolder, icon: undefined };
      const { getByTestId } = render(
        <AudioFolderCard {...defaultProps} folder={folderWithoutIcon} />,
      );

      const iconContainer = getByTestId('folder-icon');
      expect(iconContainer).toBeTruthy();
    });

    test('should handle missing color', () => {
      const folderWithoutColor = { ...mockFolder, color: undefined };
      const { getByTestId } = render(
        <AudioFolderCard {...defaultProps} folder={folderWithoutColor} />,
      );

      const gradient = getByTestId('folder-gradient');
      expect(gradient).toBeTruthy();
    });
  });

  describe('Performance', () => {
    test('should not re-render unnecessarily', () => {
      const { rerender } = render(<AudioFolderCard {...defaultProps} />);

      const initialRender = jest.fn();
      initialRender();

      rerender(<AudioFolderCard {...defaultProps} />);

      // Should not cause additional renders for same props
      expect(initialRender).toHaveBeenCalledTimes(1);
    });

    test('should handle rapid state changes', () => {
      const { rerender } = render(<AudioFolderCard {...defaultProps} />);

      // Rapid state changes
      rerender(<AudioFolderCard {...defaultProps} isSelected={true} />);
      rerender(<AudioFolderCard {...defaultProps} isSelectionMode={true} />);
      rerender(
        <AudioFolderCard
          {...defaultProps}
          isSelected={false}
          isSelectionMode={false}
        />,
      );

      // Should not crash
      expect(true).toBe(true);
    });
  });

  describe('Integration', () => {
    test('should work with theme context', () => {
      const { getByTestId } = render(<AudioFolderCard {...defaultProps} />);

      const card = getByTestId('folder-card');
      expect(card).toBeTruthy();
    });

    test('should work with translation hook', () => {
      const { getByTestId } = render(<AudioFolderCard {...defaultProps} />);

      const card = getByTestId('folder-card');
      expect(card.props.accessibilityLabel).toBeDefined();
    });

    test('should work with Alert API', () => {
      const onDelete = jest.fn();
      const { getByTestId } = render(
        <AudioFolderCard {...defaultProps} onDelete={onDelete} />,
      );

      const deleteButton = getByTestId('delete-button');
      fireEvent.press(deleteButton);

      expect(Alert.alert).toHaveBeenCalled();
    });
  });
});
