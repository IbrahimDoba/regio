import React from "react";

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function MobileContainer({ children, className = "" }: MobileContainerProps) {
  return (
    <div className={`w-full max-w-[480px] bg-[var(--white)] min-h-screen relative shadow-[0_0_20px_rgba(0,0,0,0.1)] mx-auto ${className}`}>
      {children}
    </div>
  );
}
