'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParentSection } from './AdminPageLayout';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost';
  loading?: boolean;
  icon?: ReactNode;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode | ActionButton[];
  showBackButton?: boolean;
  backButtonLabel?: string;
  backButtonHref?: string;
  parentSection?: ParentSection;
  loading?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  showBackButton = false,
  backButtonLabel,
  backButtonHref,
  parentSection,
  loading = false,
  className = '',
}: PageHeaderProps) {
  const router = useRouter();

  const renderActions = () => {
    if (!actions) return null;
    
    if (Array.isArray(actions)) {
      return (
        <div className="flex items-center space-x-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              onClick={action.onClick}
              disabled={loading || action.loading}
              className="h-9"
            >
              {action.loading && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              )}
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      );
    }
    
    return <div className="flex items-center space-x-3">{actions}</div>;
  };

  return (
    <header className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="px-6 py-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          {showBackButton && (
            <div className="flex items-center space-x-3">
              {backButtonHref ? (
                <Link href={backButtonHref}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                    className="flex items-center space-x-2 h-8"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {backButtonLabel && (
                      <span className="text-sm">{backButtonLabel}</span>
                    )}
                  </Button>
                </Link>
              ) : parentSection ? (
                <Link href={parentSection.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                    className="flex items-center space-x-2 h-8"
                    title={`Back to ${parentSection.label}`}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm">Back to {parentSection.label}</span>
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="p-2 h-8 w-8"
                  title="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-gray-900 truncate">
                {title}
              </h1>
              {loading && (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center ml-4">
            {renderActions()}
          </div>
        )}
      </div>
    </header>
  );
}