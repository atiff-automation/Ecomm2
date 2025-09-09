/**
 * Metric Card Component
 * Reusable card component for displaying sales metrics
 * Using shadcn/ui with Malaysian currency formatting
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  description?: string;
  formatAsCurrency?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  description,
  formatAsCurrency = false,
  icon,
  className
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (formatAsCurrency && typeof val === 'number') {
      return new Intl.NumberFormat('ms-MY', {
        style: 'currency',
        currency: 'MYR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val);
    }
    
    if (typeof val === 'number') {
      return new Intl.NumberFormat('ms-MY').format(val);
    }
    
    return val;
  };

  const getChangeColor = (changeValue: number) => {
    if (changeValue > 0) return 'text-green-600 bg-green-50';
    if (changeValue < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <Card className={cn('transition-all hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </div>
        {change !== undefined && (
          <Badge 
            variant="secondary" 
            className={cn("text-xs", getChangeColor(change))}
          >
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">
          {formatValue(value)}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}