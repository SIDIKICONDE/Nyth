import { PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { GestureContext } from "../types";

interface UseDragGestureProps {
  taskId: string;
  onDragStart: (taskId: string) => void;
  onDragEnd: (taskId: string, dropZone?: string) => void;
}

export const useDragGesture = ({
  taskId,
  onDragStart,
  onDragEnd,
}: UseDragGestureProps) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    GestureContext
  >({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;

      isDragging.value = true;
      scale.value = withSpring(1.05);
      opacity.value = withSpring(0.9);

      runOnJS(onDragStart)(taskId);
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
    onEnd: () => {
      isDragging.value = false;

      // Animation de retour
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      opacity.value = withSpring(1);

      runOnJS(onDragEnd)(taskId);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
      zIndex: isDragging.value ? 1000 : 1,
    };
  });

  return {
    gestureHandler,
    animatedStyle,
  };
};
