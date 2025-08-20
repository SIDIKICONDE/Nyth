/**
 * Mock pour react-native-vision-camera
 */

module.exports = {
  Camera: jest.fn().mockImplementation(() => ({
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    pauseRecording: jest.fn(),
    resumeRecording: jest.fn(),
    takePhoto: jest.fn(),
  })),
  useCameraDevice: jest.fn(),
  useCameraPermission: jest.fn(),
  useMicrophonePermission: jest.fn(),
};
