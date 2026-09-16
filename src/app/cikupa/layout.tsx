'use client';

import { BranchProvider } from '@/contexts/BranchContext';

/**
 * /cikupa/* layout
 * Forces BranchContext to 'dlob-cikupa' for all child routes.
 * The public site (Navbar, Footer) is shared — this tree only covers
 * /cikupa/dashboard/* and /cikupa/admin/*
 */
export default function CikupaLayout({ children }: { children: React.ReactNode }) {
  return (
    <BranchProvider forceBranchId="dlob-cikupa">
      {children}
    </BranchProvider>
  );
}
