// Modules natifs/non typés utilisés côté app (shims minimalistes)
declare module "@react-native-picker/picker";

declare module "@expo/vector-icons";
declare module "date-fns";
declare module "date-fns/locale";
declare module "@react-native-camera-roll/camera-roll";
declare module "@testing-library/react-native";


// Globales utiles en environnement RN/JSI
declare var window: any;
declare var navigator: any;
declare var global: any;
declare var process: any;

// Namespace NodeJS minimal pour Timeout dans RN
declare namespace NodeJS {
	// En environnement RN, setTimeout retourne un number
	type Timeout = number;
}


