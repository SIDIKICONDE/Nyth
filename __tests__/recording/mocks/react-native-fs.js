/**
 * Mock pour react-native-fs
 */

module.exports = {
  exists: jest.fn(),
  stat: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  moveFile: jest.fn(),
  copyFile: jest.fn(),
  unlink: jest.fn(),
  downloadFile: jest.fn(),
  uploadFiles: jest.fn(),
  stopDownload: jest.fn(),
  stopUpload: jest.fn(),
};
