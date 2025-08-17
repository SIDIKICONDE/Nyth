import { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Dimensions,
  PanResponderInstance,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ContainerState } from "./types";
import {
  MIN_CONTAINER_HEIGHT,
  MAX_CONTAINER_HEIGHT_RATIO,
  DRAG_THRESHOLD,
  RESIZE_SMOOTH_FACTOR,
  DEFAULT_CONTAINER_HEIGHT,
  DEFAULT_CONTAINER_Y,
  TOP_SAFE_MARGIN,
  RESIZE_SENSITIVITY,
  BOTTOM_CONTROLS_HEIGHT,
  BOTTOM_SAFE_MARGIN,
} from "./constants";

const { height: screenHeight } = Dimensions.get("window");

export function useContainerGestures(
  onResize: (newHeight: number) => void,
  onResizeEnd: () => void
): [ContainerState, PanResponderInstance, PanResponderInstance, () => void] {
  // Utiliser les safe areas d'iOS
  const insets = useSafeAreaInsets();

  // Container state
  const containerY = useRef(new Animated.Value(DEFAULT_CONTAINER_Y)).current;
  const [containerHeight, setContainerHeight] = useState(
    DEFAULT_CONTAINER_HEIGHT
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Starting points to avoid jumps
  const startDragY = useRef(0);
  const startResizeHeight = useRef(0);
  const currentTopRef = useRef(DEFAULT_CONTAINER_Y);
  const startTopRef = useRef(DEFAULT_CONTAINER_Y);
  const resizeInitialDyRef = useRef(0);
  const resizeHasStartedRef = useRef(false);

  // Fonction pour réinitialiser la position et la taille du conteneur
  const resetContainerPosition = () => {
    // Position initiale qui respecte les safe areas
    const safeInitialY = Math.max(
      DEFAULT_CONTAINER_Y,
      insets.top + TOP_SAFE_MARGIN
    );

    // Animation fluide pour revenir à la position initiale
    Animated.timing(containerY, {
      toValue: safeInitialY,
      duration: 300,
      useNativeDriver: false, // Utiliser false car top n'est pas supporté en mode natif
    }).start();

    // Réinitialiser la hauteur
    setContainerHeight(DEFAULT_CONTAINER_HEIGHT);
    currentTopRef.current = safeInitialY;
  };

  // Handler for container movement
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        return Math.abs(gestureState.dy) > DRAG_THRESHOLD;
      },

      onPanResponderGrant: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        setIsDragging(true);
        startDragY.current = gestureState.y0;
        startTopRef.current = currentTopRef.current;
        containerY.setOffset(startTopRef.current);
        containerY.setValue(0);
      },

      onPanResponderMove: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        // Limits to avoid going off screen with iOS safe areas
        const minY = insets.top + TOP_SAFE_MARGIN;
        const reservedBottom =
          insets.bottom + BOTTOM_SAFE_MARGIN + BOTTOM_CONTROLS_HEIGHT;
        const maxY = screenHeight - containerHeight - reservedBottom;

        const newY = Math.max(
          minY,
          Math.min(maxY, startTopRef.current + gestureState.dy)
        );
        containerY.setValue(newY - startTopRef.current);
        currentTopRef.current = newY;
      },

      onPanResponderRelease: () => {
        setIsDragging(false);
        containerY.flattenOffset();
      },
    })
  ).current;

  // Handler for container resizing
  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        return Math.abs(gestureState.dy) > DRAG_THRESHOLD;
      },

      onPanResponderGrant: () => {
        setIsResizing(true);
        // Record initial height to avoid jumps
        startResizeHeight.current = containerHeight;
        resizeHasStartedRef.current = false;
        resizeInitialDyRef.current = 0;
      },

      onPanResponderMove: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (!resizeHasStartedRef.current) {
          resizeInitialDyRef.current = gestureState.dy;
          resizeHasStartedRef.current = true;
        }
        const delta =
          (gestureState.dy - resizeInitialDyRef.current) * RESIZE_SENSITIVITY;
        const absoluteTop = currentTopRef.current;
        const reservedBottom =
          insets.bottom + BOTTOM_SAFE_MARGIN + BOTTOM_CONTROLS_HEIGHT;
        const maxAvailableHeight = screenHeight - absoluteTop - reservedBottom;
        const maxByRatio = screenHeight * MAX_CONTAINER_HEIGHT_RATIO;
        const unclamped = startResizeHeight.current + delta;
        const upperBound = Math.min(maxByRatio, maxAvailableHeight);
        const newHeight = Math.max(
          MIN_CONTAINER_HEIGHT,
          Math.min(upperBound, unclamped)
        );
        const rounded = Math.round(newHeight);
        setContainerHeight(rounded);
        onResize(rounded);
      },

      onPanResponderRelease: () => {
        setIsResizing(false);
        // Notify parent about resize end
        onResizeEnd();
      },
    })
  ).current;

  const containerState: ContainerState = {
    containerY,
    containerHeight,
    isDragging,
    isResizing,
    startDragY,
    startResizeHeight,
  };

  useEffect(() => {
    const minY = insets.top + TOP_SAFE_MARGIN;
    const reservedBottom =
      insets.bottom + BOTTOM_SAFE_MARGIN + BOTTOM_CONTROLS_HEIGHT;
    const maxY = screenHeight - containerHeight - reservedBottom;
    let clampedTop = currentTopRef.current;
    if (clampedTop < minY) clampedTop = minY;
    if (clampedTop > maxY) clampedTop = maxY;
    if (clampedTop !== currentTopRef.current) {
      const delta = clampedTop - currentTopRef.current;
      containerY.setValue(delta);
      currentTopRef.current = clampedTop;
    }

    const maxAvailableHeight = Math.min(
      screenHeight * MAX_CONTAINER_HEIGHT_RATIO,
      screenHeight - currentTopRef.current - reservedBottom
    );
    if (containerHeight > maxAvailableHeight) {
      const adjusted = Math.round(maxAvailableHeight);
      setContainerHeight(adjusted);
      onResize(adjusted);
    }
  }, [insets.top, insets.bottom, containerHeight]);

  return [
    containerState,
    panResponder,
    resizePanResponder,
    resetContainerPosition,
  ];
}
