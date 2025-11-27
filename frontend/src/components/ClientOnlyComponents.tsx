'use client';

import dynamic from 'next/dynamic';

// Import client-only components with no SSR to prevent hydration mismatches
const EnhancedDlobChatbot = dynamic(() => import('@/components/EnhancedDlobChatbot'), {
  ssr: false
});

const URLCleaner = dynamic(() => import('@/components/URLCleaner'), {
  ssr: false
});

export default function ClientOnlyComponents() {
  return (
    <>
      <URLCleaner />
      <EnhancedDlobChatbot />
    </>
  );
}