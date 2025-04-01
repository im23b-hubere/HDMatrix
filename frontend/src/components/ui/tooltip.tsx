import React from 'react';

interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  content: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ className, content, children, open, onOpenChange, ...props }, ref) => {
    return (
      <div ref={ref} className={`relative inline-block ${className}`} {...props}>
        {children}
        {open && (
          <div className="absolute z-50 px-3 py-2 text-sm text-white bg-black rounded shadow-lg">
            {content}
          </div>
        )}
      </div>
    );
  }
);

export const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`inline-block ${className}`}
      {...props}
    />
  );
});

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`z-50 px-3 py-2 text-sm text-white bg-black rounded shadow-lg ${className}`}
      {...props}
    />
  );
});

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
