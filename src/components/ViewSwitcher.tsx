'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, User } from 'lucide-react';

export default function ViewSwitcher() {
  const { isAdmin, isMember, viewAs, switchView } = useAuth();
  const router = useRouter();

  if (!isAdmin || !isMember) {
    return null;
  }

  const handleSwitch = (view: 'admin' | 'member') => {
    switchView(view);
    if (view === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2">
      <div className="flex gap-1">
        <button
          onClick={() => handleSwitch('admin')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
            viewAs === 'admin'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Admin
        </button>
        <button
          onClick={() => handleSwitch('member')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
            viewAs === 'member'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Member
        </button>
      </div>
    </div>
  );
}
