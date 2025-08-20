import React, { useCallback, useMemo, memo } from "react";
import {
  FlatList,
  FlatListProps,
  ViewToken,
  Platform,
  ListRenderItem,
} from "react-native";

interface OptimizedFlatListProps<T>
  extends Omit<FlatListProps<T>, "renderItem"> {
  renderItem: ListRenderItem<T>;
  estimatedItemSize?: number;
  enableOptimizations?: boolean;
}

/**
 * FlatList optimisée avec les meilleures pratiques de performance
 */
function OptimizedFlatListComponent<T = any>({
  renderItem,
  estimatedItemSize = 100,
  enableOptimizations = true,
  keyExtractor,
  onViewableItemsChanged,
  ...props
}: OptimizedFlatListProps<T>) {
  // Mémoisation du keyExtractor par défaut
  const memoizedKeyExtractor = useMemo(
    () =>
      keyExtractor ||
      ((item: any, index: number) => {
        if (item?.id) return String(item.id);
        if (item?.key) return String(item.key);
        return String(index);
      }),
    [keyExtractor]
  );

  // Configuration optimisée pour la visibilité des items
  const viewabilityConfig = useMemo(
    () => ({
      minimumViewTime: 250,
      viewAreaCoveragePercentThreshold: 50,
      itemVisiblePercentThreshold: 50,
      waitForInteraction: true,
    }),
    []
  );

  // Callback optimisé pour les changements de visibilité
  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      if (onViewableItemsChanged) {
        onViewableItemsChanged(info);
      }
    },
    [onViewableItemsChanged]
  );

  // Props d'optimisation par défaut
  const optimizationProps = enableOptimizations
    ? {
        removeClippedSubviews: Platform.OS === "android",
        maxToRenderPerBatch: 10,
        updateCellsBatchingPeriod: 50,
        initialNumToRender: 10,
        windowSize: 21,
        getItemLayout:
          props.getItemLayout ||
          (estimatedItemSize > 0
            ? (_: any, index: number) => ({
                length: estimatedItemSize,
                offset: estimatedItemSize * index,
                index,
              })
            : undefined),
        maintainVisibleContentPosition: {
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        },
      }
    : {};

  return (
    <FlatList
      {...props}
      {...optimizationProps}
      renderItem={renderItem}
      keyExtractor={memoizedKeyExtractor}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={handleViewableItemsChanged}
      // Optimisations supplémentaires
      scrollEventThrottle={16}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      bounces={Platform.OS === "ios"}
      // Éviter les re-renders inutiles
      extraData={props.extraData}
    />
  );
}

// Export générique conservant la signature de types
export function OptimizedFlatList<T>(props: OptimizedFlatListProps<T>) {
  return <OptimizedFlatListComponent {...props} />;
}

/**
 * Hook pour créer un renderItem optimisé
 */
export function useOptimizedRenderItem<T>(
  Component: React.ComponentType<{ item: T; index: number }>,
  dependencies: any[] = []
): ListRenderItem<T> {
  return useCallback(
    ({ item, index }: { item: T; index: number }) => (
      <Component item={item} index={index} />
    ),
    dependencies
  );
}

/**
 * HOC pour créer un item de liste optimisé
 */
export function createOptimizedListItem<P extends { item: unknown }>(
  Component: React.ComponentType<P>
): React.MemoExoticComponent<React.ComponentType<P>> {
  return memo(Component, (prevProps, nextProps) => {
    const prevItem = (prevProps as { item: unknown }).item;
    const nextItem = (nextProps as { item: unknown }).item;

    if (prevItem === nextItem) return true;

    const prevHasId = !!(prevItem as { id?: unknown } | undefined)?.id;
    const nextHasId = !!(nextItem as { id?: unknown } | undefined)?.id;
    if (prevHasId && nextHasId) {
      return (
        (prevItem as { id?: unknown }).id === (nextItem as { id?: unknown }).id
      );
    }

    return JSON.stringify(prevItem) === JSON.stringify(nextItem);
  });
}
