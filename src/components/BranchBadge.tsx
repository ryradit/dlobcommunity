'use client';

import { useBranch } from '@/contexts/BranchContext';

interface BranchBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
  /** Override branch id to display (e.g. for super admin cross-branch views) */
  branchId?: string;
  branchName?: string;
  accentColor?: string;
}

const SIZE_CLASSES = {
  sm: 'text-[9px] px-1.5 py-0.5 gap-1',
  md: 'text-[10px] px-2 py-0.5 gap-1',
  lg: 'text-xs px-2.5 py-1 gap-1.5',
};

export default function BranchBadge({
  size = 'sm',
  showDot = true,
  className = '',
  branchId,
  branchName,
  accentColor,
}: BranchBadgeProps) {
  const { branch } = useBranch();

  const id = branchId ?? branch.id;
  const name = branchName ?? branch.name;
  const color = accentColor ?? branch.accentColor;

  // Short labels
  const label =
    id === 'dlob-cikupa' ? 'DLBC' :
    id === 'dlob-pusat'  ? 'DLOB' :
    name.split(' ')[0];

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full uppercase tracking-wider border ${SIZE_CLASSES[size]} ${className}`}
      style={{
        color,
        backgroundColor: `${color}18`,
        borderColor: `${color}40`,
      }}
    >
      {showDot && (
        <span
          className="rounded-full flex-shrink-0"
          style={{
            width: size === 'lg' ? '6px' : '5px',
            height: size === 'lg' ? '6px' : '5px',
            backgroundColor: color,
          }}
        />
      )}
      {label}
    </span>
  );
}
