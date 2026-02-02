import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationState } from '@/types/dashboard.types';

interface PaginationControlsProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  const { t } = useTranslation('common');

  if (pagination.total === 0) return null;

  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);
  const hasMultiplePages = pagination.totalPages > 1;

  return (
    <div className="flex items-center justify-between px-4 py-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t('pagination.showing', { start, end, total: pagination.total })}
      </p>
      {hasMultiplePages && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.hasPrevPage}
            className="h-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-zinc-600 dark:text-zinc-400 min-w-[100px] text-center">
            {t('pagination.page', { page: pagination.page, totalPages: pagination.totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
            className="h-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
