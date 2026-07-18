import React from 'react';

type BadgeVariant = 'pending' | 'verified' | 'conflict' | 'active' | 'sold';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
}

const variantStyles = {
  pending: 'bg-[#fff3e0] text-[#f57c00]',
  verified: 'bg-[#e8f5e9] text-[#8cb348]',
  conflict: 'bg-[#ffebee] text-[#d32f2f]',
  active: 'bg-[#e8f5e9] text-[#8cb348]',
  sold: 'bg-[#e3f2fd] text-[#1976d2]',
};

export default function StatusBadge({ variant, label }: StatusBadgeProps) {
  return (
    <span
      className={`py-1 px-2 rounded text-[11px] font-bold uppercase ${variantStyles[variant]}`}
    >
      {label}
    </span>
  );
}
