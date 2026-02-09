import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

interface UseUrlFiltersOptions {
  defaultTab: string;
}

export function useUrlFilters({ defaultTab }: UseUrlFiltersOptions) {
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get('tab') || defaultTab;
  const page = Number(searchParams.get('page')) || 1;

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'tab' && key !== 'page') {
        f[key] = value;
      }
    });
    return f;
  }, [searchParams]);

  const setTab = useCallback((newTab: string, newFilters?: Record<string, string>) => {
    const params: Record<string, string> = { tab: newTab };
    if (newFilters) {
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
    }
    setSearchParams(params);
  }, [setSearchParams]);

  const setPage = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (newPage <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(newPage));
    }
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const setFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const clearFilters = useCallback(() => {
    setSearchParams({ tab });
  }, [tab, setSearchParams]);

  const hasFilters = Object.keys(filters).length > 0;

  return { tab, page, filters, setTab, setPage, setFilter, clearFilters, hasFilters };
}
