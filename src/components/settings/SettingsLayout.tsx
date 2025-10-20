'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AdminPageLayout } from '@/components/admin/layout';

interface SettingsLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Standardized Settings Layout using AdminPageLayout
 * Following @CLAUDE.md principles: DRY, single source of truth, consistent UI patterns
 */
export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  title,
  subtitle,
  children,
  actions,
}) => {
  return (
    <AdminPageLayout
      title={title}
      subtitle={subtitle}
      actions={actions}
      className="space-y-6"
    >
      {children}
    </AdminPageLayout>
  );
};

interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
};

interface SettingsSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  subtitle,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};
