import React from 'react';

interface ContentCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  borderColor?: string;
}

export default function ContentCard({
  title,
  children,
  className = '',
  borderColor,
}: ContentCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-[0_2px_5px_rgba(0,0,0,0.05)] p-[25px] mb-5 animate-in fade-in duration-300 ${className}`}
      style={borderColor ? { borderLeft: `4px solid ${borderColor}` } : undefined}
    >
      {title && (
        <h2 className="text-[18px] font-bold mb-5 text-[#444] border-b-2 border-[#eee] pb-[10px]">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
