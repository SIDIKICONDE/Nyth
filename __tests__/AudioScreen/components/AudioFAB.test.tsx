import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import AudioFAB from '@/screens/AudioScreen/components/AudioFAB';

// Mock des hooks personnalisés avec des valeurs par défaut
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
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 34,
    left: 0,
    right: 0,
  }),
}));

describe('AudioFAB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render with default props', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<AudioFAB onPress={onPress} />);

    expect(getByTestId('audio-fab-container')).toBeTruthy();
    expect(getByTestId('audio-fab-button')).toBeTruthy();
    expect(getByTestId('add-icon')).toBeTruthy();
  });

  test('should render with recording state', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AudioFAB onPress={onPress} isRecording={true} recordingDuration={65} />,
    );

    expect(getByTestId('audio-fab-container')).toBeTruthy();
    expect(getByTestId('audio-fab-button')).toBeTruthy();
    expect(getByTestId('recording-icon')).toBeTruthy();
  });

  test('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<AudioFAB onPress={onPress} />);

    const button = getByTestId('audio-fab-button');
    fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('should handle press in and press out animations', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<AudioFAB onPress={onPress} />);

    const button = getByTestId('audio-fab-button');

    fireEvent(button, 'pressIn');
    fireEvent(button, 'pressOut');

    expect(onPress).not.toHaveBeenCalled();
  });

  test('should display recording duration correctly', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AudioFAB onPress={onPress} isRecording={true} recordingDuration={125} />,
    );

    expect(getByText('2:05')).toBeTruthy();
  });

  test('should have correct accessibility props', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<AudioFAB onPress={onPress} />);

    const button = getByTestId('audio-fab-button');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe('Nouveau dossier');
  });

  test('should have correct accessibility props when recording', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AudioFAB onPress={onPress} isRecording={true} />,
    );

    const button = getByTestId('audio-fab-button');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBe("Arrêter l'enregistrement");
  });

  test('should render pulse animation when not recording', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AudioFAB onPress={onPress} isRecording={false} />,
    );

    expect(getByTestId('normal-pulse')).toBeTruthy();
  });

  test('should render recording pulse animation when recording', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AudioFAB onPress={onPress} isRecording={true} />,
    );

    expect(getByTestId('recording-pulse')).toBeTruthy();
  });

  test('should have correct test IDs for all elements', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<AudioFAB onPress={onPress} />);

    expect(getByTestId('audio-fab-container')).toBeTruthy();
    expect(getByTestId('audio-fab-button')).toBeTruthy();
    expect(getByTestId('add-icon')).toBeTruthy();
  });

  test('should have correct gradient colors when not recording', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AudioFAB onPress={onPress} isRecording={false} />,
    );

    const gradient = getByTestId('normal-gradient');
    expect(gradient.props.colors).toEqual(['#3B82F6', '#3B82F6E6']);
  });

  test('should have correct gradient colors when recording', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <AudioFAB onPress={onPress} isRecording={true} />,
    );

    const gradient = getByTestId('recording-gradient');
    expect(gradient.props.colors).toEqual(['#EF4444', '#DC2626']);
  });

  test('should format duration correctly for different values', () => {
    const testCases = [
      { duration: 0, expected: '0:00' },
      { duration: 30, expected: '0:30' },
      { duration: 60, expected: '1:00' },
      { duration: 125, expected: '2:05' },
      { duration: 3661, expected: '61:01' },
    ];

    testCases.forEach(({ duration, expected }) => {
      const onPress = jest.fn();
      const { getByText, rerender } = render(
        <AudioFAB
          onPress={onPress}
          isRecording={true}
          recordingDuration={duration}
        />,
      );

      expect(getByText(expected)).toBeTruthy();
    });
  });

  test('should handle edge cases for duration formatting', () => {
    const onPress = jest.fn();

    // Test avec durée négative
    const { getByText, rerender } = render(
      <AudioFAB onPress={onPress} isRecording={true} recordingDuration={-1} />,
    );
    expect(getByText('0:00')).toBeTruthy();

    // Test avec durée très grande
    rerender(
      <AudioFAB
        onPress={onPress}
        isRecording={true}
        recordingDuration={99999}
      />,
    );
    expect(getByText('1666:39')).toBeTruthy();
  });

  test('should render with custom theme colors', () => {
    const customTheme = {
      currentTheme: {
        colors: {
          accent: '#FF6B6B',
          text: '#000000',
          textSecondary: '#666666',
          background: '#FFFFFF',
          border: '#E5E7EB',
        },
      },
    };

    (useTheme as jest.Mock).mockReturnValue(customTheme);

    const onPress = jest.fn();
    const { getByTestId } = render(
      <AudioFAB onPress={onPress} isRecording={false} />,
    );

    const gradient = getByTestId('normal-gradient');
    expect(gradient.props.colors).toEqual(['#FF6B6B', '#FF6B6BE6']);
  });

  test('should handle multiple rapid presses', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<AudioFAB onPress={onPress} />);

    const button = getByTestId('audio-fab-button');

    // Simuler plusieurs pressions rapides
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(3);
  });

  test('should maintain state consistency during recording', () => {
    const onPress = jest.fn();
    const { getByTestId, rerender } = render(
      <AudioFAB onPress={onPress} isRecording={true} recordingDuration={30} />,
    );

    // Vérifier que l'état d'enregistrement est cohérent
    expect(getByTestId('recording-pulse')).toBeTruthy();
    expect(getByTestId('recording-icon')).toBeTruthy();
    expect(getByTestId('recording-gradient')).toBeTruthy();

    // Changer l'état d'enregistrement
    rerender(<AudioFAB onPress={onPress} isRecording={false} />);

    expect(getByTestId('normal-pulse')).toBeTruthy();
    expect(getByTestId('add-icon')).toBeTruthy();
    expect(getByTestId('normal-gradient')).toBeTruthy();
  });

  test('should handle accessibility for screen readers', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<AudioFAB onPress={onPress} />);

    const button = getByTestId('audio-fab-button');

    // Vérifier les propriétés d'accessibilité
    expect(button.props.accessible).toBe(true);
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toBeDefined();
  });

  test('should render correctly with zero duration', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AudioFAB onPress={onPress} isRecording={true} recordingDuration={0} />,
    );

    expect(getByText('0:00')).toBeTruthy();
  });

  test('should render correctly with very long duration', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AudioFAB
        onPress={onPress}
        isRecording={true}
        recordingDuration={3600}
      />,
    );

    expect(getByText('60:00')).toBeTruthy();
  });
});
