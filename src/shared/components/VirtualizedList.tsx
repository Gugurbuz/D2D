import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (props: { index: number; style: React.CSSProperties; data: T[] }) => React.ReactElement;
  className?: string;
}

function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
}: VirtualizedListProps<T>) {
  const memoizedRenderItem = useMemo(() => {
    return ({ index, style }: { index: number; style: React.CSSProperties }) => {
      return renderItem({ index, style, data: items });
    };
  }, [renderItem, items]);

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-500">Hiç öğe bulunamadı</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        itemData={items}
      >
        {memoizedRenderItem}
      </List>
    </div>
  );
}

export default VirtualizedList;