import { useReducer } from 'react';
import { Animated } from 'react-native';

// Types
export interface ScrollState {
  textHeight: number;
  isTextMeasured: boolean;
  currentAnimation: Animated.CompositeAnimation | null;
  pausedPosition: number | null;
  isResetting: boolean;
  scrollSpeed: number;
}

export type ScrollAction =
  | { type: 'SET_TEXT_HEIGHT'; payload: number }
  | { type: 'SET_TEXT_MEASURED'; payload: boolean }
  | { type: 'SET_ANIMATION'; payload: Animated.CompositeAnimation | null }
  | { type: 'SET_PAUSED_POSITION'; payload: number | null }
  | { type: 'SET_RESETTING'; payload: boolean }
  | { type: 'SET_SCROLL_SPEED'; payload: number }
  | { type: 'RESET' };

// Initial state
const initialState: ScrollState = {
  textHeight: 0,
  isTextMeasured: false,
  currentAnimation: null,
  pausedPosition: null,
  isResetting: false,
  scrollSpeed: 16,
};

// Reducer
function scrollReducer(state: ScrollState, action: ScrollAction): ScrollState {
  switch (action.type) {
    case 'SET_TEXT_HEIGHT':
      return { ...state, textHeight: action.payload };
    case 'SET_TEXT_MEASURED':
      return { ...state, isTextMeasured: action.payload };
    case 'SET_ANIMATION':
      return { ...state, currentAnimation: action.payload };
    case 'SET_PAUSED_POSITION':
      return { ...state, pausedPosition: action.payload };
    case 'SET_RESETTING':
      return { ...state, isResetting: action.payload };
    case 'SET_SCROLL_SPEED':
      return { ...state, scrollSpeed: action.payload };
    case 'RESET':
      return {
        ...state,
        currentAnimation: null,
        pausedPosition: null,
        isResetting: false,
      };
    default:
      return state;
  }
}

// Hook
export const useScrollState = (
  initialSpeed: number,
  externalTextHeight?: number,
  externalIsTextMeasured?: boolean
) => {
  const [state, dispatch] = useReducer(scrollReducer, {
    ...initialState,
    scrollSpeed: initialSpeed,
  });

  // Use external values if provided
  const textHeight = externalTextHeight !== undefined ? externalTextHeight : state.textHeight;
  const isTextMeasured = externalIsTextMeasured !== undefined ? externalIsTextMeasured : state.isTextMeasured;

  return {
    state: {
      ...state,
      textHeight,
      isTextMeasured,
    },
    dispatch,
  };
}; 