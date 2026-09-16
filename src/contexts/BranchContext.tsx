'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────
export interface Branch {
  id: string;
  name: string;
  slug: string;
  accentColor: string;
  description: string;
}

interface BranchContextType {
  branch: Branch;
  isLoadingBranch: boolean;
  setActiveBranch: (branch: Branch) => void;
}

// ─── Defaults ────────────────────────────────────────────────
export const BRANCHES: Record<string, Branch> = {
  'dlob-pusat': {
    id: 'dlob-pusat',
    name: 'DLOB Community',
    slug: 'pusat',
    accentColor: '#4382C8',
    description: 'Cabang utama DLOB Community',
  },
  'dlob-cikupa': {
    id: 'dlob-cikupa',
    name: 'DLOB Cikupa',
    slug: 'cikupa',
    accentColor: '#10B981',
    description: 'Cabang Cikupa dari DLOB Community',
  },
};

export const DEFAULT_BRANCH = BRANCHES['dlob-pusat'];
export const CIKUPA_BRANCH = BRANCHES['dlob-cikupa'];

// ─── Context ─────────────────────────────────────────────────
const BranchContext = createContext<BranchContextType>({
  branch: DEFAULT_BRANCH,
  isLoadingBranch: false,
  setActiveBranch: () => {},
});

// ─── Provider ─────────────────────────────────────────────────
export function BranchProvider({
  children,
  forceBranchId,
}: {
  children: ReactNode;
  forceBranchId?: string;
}) {
  const pathname = usePathname();
  const [branch, setBranch] = useState<Branch>(DEFAULT_BRANCH);
  const [isLoadingBranch, setIsLoadingBranch] = useState(false);

  useEffect(() => {
    // If a branch is forced (e.g. /cikupa/* layout), use it directly
    if (forceBranchId && BRANCHES[forceBranchId]) {
      setBranch(BRANCHES[forceBranchId]);
      return;
    }

    // Auto-detect branch from URL path
    if (pathname.startsWith('/cikupa')) {
      setBranch(BRANCHES['dlob-cikupa']);
    } else {
      setBranch(BRANCHES['dlob-pusat']);
    }
  }, [pathname, forceBranchId]);

  const setActiveBranch = (newBranch: Branch) => {
    setBranch(newBranch);
  };

  return (
    <BranchContext.Provider value={{ branch, isLoadingBranch, setActiveBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────
export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
