import React, { ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
        {icon || <PackageOpen className="w-7 h-7" />}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-slate-800">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-sm mt-1 mb-5">{description}</p>}
      {actionText && onAction && (
        <Button onClick={onAction} leftIcon={actionIcon} variant="primary" size="md">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ count?: number; type?: 'card' | 'table' }> = ({
  count = 3,
  type = 'card',
}) => {
  if (type === 'table') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-md w-1/4 mb-4" />
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-lg w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 animate-pulse"
        >
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-7 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
};
