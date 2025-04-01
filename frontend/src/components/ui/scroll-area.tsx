import React from 'react';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal';
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, orientation = 'vertical', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative overflow-auto ${orientation === 'vertical' ? 'overflow-y-auto' : 'overflow-x-auto'} ${className}`}
        {...props}
      />
    );
  }
);
