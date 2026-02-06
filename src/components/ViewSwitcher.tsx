'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, User } from 'lucide-react';

export default function ViewSwitcher() {
  const { isAdmin, viewAs, switchView } = useAuth();
  const router = useRouter();

  console.log('🔀 [ViewSwitcher] Render - isAdmin:', isAdmin, 'viewAs:', viewAs);

  if (!isAdmin) {
    console.log('🔀 [ViewSwitcher] Not rendering - user is not admin');
    return null;
  }

  const handleSwitch = (view: 'admin' | 'member') => {
    console.log('🔀 [ViewSwitcher] Switching view to:', view);
    switchView(view);
    // Navigate to the appropriate dashboard
    if (view === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
      <button
        onClick={() => handleSwitch('admin')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
          viewAs === 'admin'
            ? 'bg-purple-600 text-white'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
        }`}
      >
        <Shield size={16} />
        Admin
      </button>
      <button
        onClick={() => handleSwitch('member')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
          viewAs === 'member'
            ? 'bg-blue-600 text-white'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
        }`}
      >
        <User size={16} />
        Member
      </button>
    </div>
  );
}
