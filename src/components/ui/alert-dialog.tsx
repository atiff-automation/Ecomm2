'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  onConfirm?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
}

const variantIcons = {
  default: null,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const variantColors = {
  default: 'text-muted-foreground',
  success: 'text-green-600',
  warning: 'text-orange-600',
  error: 'text-red-600',
  info: 'text-blue-600',
};

const variantBadges = {
  default: null,
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  info: 'Info',
};

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'OK',
  onConfirm,
  variant = 'default',
  loading = false,
}: AlertDialogProps) {
  const IconComponent = variantIcons[variant];
  const iconColor = variantColors[variant];
  const badgeText = variantBadges[variant];

  const handleConfirm = () => {
    if (loading) {
      return;
    }
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {IconComponent && (
              <IconComponent className={`w-5 h-5 ${iconColor}`} />
            )}
            {badgeText && (
              <Badge
                variant={variant === 'error' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {badgeText}
              </Badge>
            )}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-left">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant={variant === 'error' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easier usage
export function useAlertDialog() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm?: () => void;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    confirmText?: string;
  }>({
    open: false,
    title: '',
  });

  const showAlert = React.useCallback(
    (options: Omit<typeof dialogState, 'open'>) => {
      setDialogState({
        ...options,
        open: true,
      });
    },
    []
  );

  const hideAlert = React.useCallback(() => {
    setDialogState(prev => ({ ...prev, open: false }));
  }, []);

  const AlertDialogComponent = React.useCallback(
    () => <AlertDialog {...dialogState} onOpenChange={hideAlert} />,
    [dialogState, hideAlert]
  );

  return {
    showAlert,
    hideAlert,
    AlertDialog: AlertDialogComponent,
  };
}

// Export individual components for compatibility with shadcn/ui style usage
export const AlertDialogTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ children, ...props }, ref) => (
  <Button ref={ref} {...props}>
    {children}
  </Button>
));
AlertDialogTrigger.displayName = "AlertDialogTrigger";

export const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  React.ComponentPropsWithoutRef<typeof DialogContent>
>(({ children, ...props }, ref) => (
  <DialogContent ref={ref} {...props}>
    {children}
  </DialogContent>
));
AlertDialogContent.displayName = "AlertDialogContent";

export const AlertDialogHeader = React.forwardRef<
  React.ElementRef<typeof DialogHeader>,
  React.ComponentPropsWithoutRef<typeof DialogHeader>
>(({ children, ...props }, ref) => (
  <DialogHeader ref={ref} {...props}>
    {children}
  </DialogHeader>
));
AlertDialogHeader.displayName = "AlertDialogHeader";

export const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogTitle>,
  React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ children, ...props }, ref) => (
  <DialogTitle ref={ref} {...props}>
    {children}
  </DialogTitle>
));
AlertDialogTitle.displayName = "AlertDialogTitle";

export const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogDescription>,
  React.ComponentPropsWithoutRef<typeof DialogDescription>
>(({ children, ...props }, ref) => (
  <DialogDescription ref={ref} {...props}>
    {children}
  </DialogDescription>
));
AlertDialogDescription.displayName = "AlertDialogDescription";

export const AlertDialogFooter = React.forwardRef<
  React.ElementRef<typeof DialogFooter>,
  React.ComponentPropsWithoutRef<typeof DialogFooter>
>(({ children, ...props }, ref) => (
  <DialogFooter ref={ref} {...props}>
    {children}
  </DialogFooter>
));
AlertDialogFooter.displayName = "AlertDialogFooter";

export const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ children, ...props }, ref) => (
  <Button ref={ref} {...props}>
    {children}
  </Button>
));
AlertDialogAction.displayName = "AlertDialogAction";

export const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ children, variant = "outline", ...props }, ref) => (
  <Button ref={ref} variant={variant} {...props}>
    {children}
  </Button>
));
AlertDialogCancel.displayName = "AlertDialogCancel";
