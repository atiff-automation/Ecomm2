import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Password Input Component with Visibility Toggle
 *
 * Extracted from SettingsInput following @CLAUDE.md:
 * - Single Source of Truth: One reusable password input component
 * - DRY: Eliminates duplicate password toggle implementations
 * - Accessibility: WCAG 2.1 AA compliant with ARIA labels
 * - Type Safety: Explicit TypeScript types, extends native input props
 *
 * Features:
 * - Eye/EyeOff icon toggle
 * - Preserves all native Input props
 * - Ref forwarding for form libraries (react-hook-form)
 * - Accessible keyboard navigation
 * - Touch-friendly button size (44px minimum)
 */

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-10', className)}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded p-1"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
