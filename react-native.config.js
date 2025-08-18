module.exports = {
  dependencies: {
    "react-native-push-notification": {
      platforms: {
        android: null,
      },
    },
    "react-native-vision-camera": {
      platforms: {
        android: null,
      },
    },
    "react-native-vector-icons": {
      platforms: {
        android: {
          sourceDir: "../node_modules/react-native-vector-icons/android",
          packageImportPath: "import io.github.oblador.vectoricons.VectorIconsPackage;",
        },
      },
    },
  },
  assets: ["./node_modules/react-native-vector-icons/Fonts/"],
};


