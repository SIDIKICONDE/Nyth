import { useState, useCallback } from 'react';
import { ScrollState } from '../types';

interface UseScrollHandlersProps {
  onContentSizeChange: () => void;
  onScroll: (event: any) => void;
}

export const useScrollHandlers = ({ onContentSizeChange, onScroll }: UseScrollHandlersProps) => {
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollPosition: 0,
    contentHeight: 0,
    containerHeight: 0
  });

  const handleLayout = useCallback((event: any) => {
    const { height } = event.nativeEvent.layout;
    setScrollState(prev => ({ ...prev, containerHeight: height }));
  }, []);

  const handleContentSizeChange = useCallback((width: number, height: number) => {
    setScrollState(prev => ({ ...prev, contentHeight: height }));
    onContentSizeChange();
  }, [onContentSizeChange]);

  const handleScroll = useCallback((event: any) => {
    setScrollState(prev => ({ ...prev, scrollPosition: event.nativeEvent.contentOffset.y }));
    onScroll(event);
  }, [onScroll]);

  return {
    scrollState,
    handleLayout,
    handleContentSizeChange,
    handleScroll
  };
}; 