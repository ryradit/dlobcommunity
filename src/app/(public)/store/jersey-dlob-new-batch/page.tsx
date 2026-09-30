'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JerseyDlobNewBatchRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/store/official');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-zinc-950">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-t-[#4382C8] mb-4" />
      <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Mengalihkan ke Jersey DLOB Official...</p>
    </div>
  );
}
