import { Dimensions } from "react-native";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

// Container constants
export const MIN_CONTAINER_HEIGHT = 60;
export const MAX_CONTAINER_HEIGHT_RATIO = 1.0; // 100% of screen height
export const DRAG_THRESHOLD = 3;
export const RESIZE_SMOOTH_FACTOR = 0.1; // Closer to 1 = smoother but less responsive
export const RESIZE_SENSITIVITY = 1.0; // 1 = suit le doigt, <1 = moins sensible

// Initial position and size
export const DEFAULT_CONTAINER_HEIGHT = screenHeight * 0.6;
export const DEFAULT_CONTAINER_Y = 128;
export const DEFAULT_CONTAINER_LEFT = 0;
export const DEFAULT_CONTAINER_RIGHT = 0;
export const TOP_SAFE_MARGIN = 12;
export const BOTTOM_SAFE_MARGIN = 40;
export const BOTTOM_CONTROLS_HEIGHT = 130;

// Scrolling constants
export const MIN_SCROLL_SPEED = 1; // Vitesse minimale réduite à 1 pixel/seconde
export const MAX_SCROLL_SPEED = 100;
export const ANIMATION_RESTART_DELAY = 100;
export const RESIZE_ANIMATION_DELAY = 200;
export const DEFAULT_START_POSITION = 20;
