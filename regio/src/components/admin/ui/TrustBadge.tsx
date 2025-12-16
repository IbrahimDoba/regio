import React from 'react';

type TrustLevel = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';

interface TrustBadgeProps {
  level: TrustLevel;
  label?: string;
}

const trustLevelConfig = {
  T1: {
    bg: '#bdbdbd',
    label: 'Beginner',
  },
  T2: {
    bg: '#81c784',
    label: 'Active',
  },
  T3: {
    bg: '#4caf50',
    label: 'Trusted',
  },
  T4: {
    bg: '#2e7d32',
    label: 'Professional',
  },
  T5: {
    bg: '#1565c0',
    label: 'Ambassador',
  },
  T6: {
    bg: 'linear-gradient(135deg, #4527a0 0%, #7b1fa2 100%)',
    label: 'Legend',
  },
};

export default function TrustBadge({ level, label }: TrustBadgeProps) {
  const config = trustLevelConfig[level];
  const displayLabel = label || config.label;

  return (
    <span
      className="inline-flex items-center gap-[5px] py-[3px] px-2 rounded-xl text-[11px] font-bold text-white min-w-[85px]"
      style={{ background: config.bg }}
    >
      {level} {displayLabel}
    </span>
  );
}
