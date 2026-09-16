import { supabase } from '@/lib/supabase';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Creates a branch-scoped Supabase query.
 * Always appends `.eq('branch_id', branchId)` to the query.
 *
 * @example
 * const { data } = await branchFrom('profiles', branchId).select('*');
 */
export function branchFrom(table: string, branchId: string) {
  return (supabase.from(table) as any).eq('branch_id', branchId);
}

/**
 * Applies branch_id filter to an existing query builder.
 * Use when you need more complex queries before adding the branch filter.
 *
 * @example
 * const query = supabase.from('matches').select('*, match_members(*)');
 * const { data } = await withBranch(query, branchId).order('created_at', { ascending: false });
 */
export function withBranch<T extends { eq: (col: string, val: string) => any }>(
  query: T,
  branchId: string
): T {
  return (query as any).eq('branch_id', branchId);
}

/**
 * Returns the branch_id for a given branch slug.
 */
export function branchIdFromSlug(slug: string): string {
  const map: Record<string, string> = {
    pusat: 'dlob-pusat',
    cikupa: 'dlob-cikupa',
  };
  return map[slug] ?? 'dlob-pusat';
}

/**
 * Returns the branch slug for a given branch_id.
 */
export function branchSlugFromId(id: string): string {
  const map: Record<string, string> = {
    'dlob-pusat': 'pusat',
    'dlob-cikupa': 'cikupa',
  };
  return map[id] ?? 'pusat';
}
