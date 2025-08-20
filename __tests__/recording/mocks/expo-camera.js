/**
 * Mock pour expo-camera
 */

module.exports = {
  Camera: jest.fn(),
  CameraType: {
    back: 'back',
    front: 'front',
  },
  FlashMode: {
    off: 'off',
    on: 'on',
    auto: 'auto',
  },
};
