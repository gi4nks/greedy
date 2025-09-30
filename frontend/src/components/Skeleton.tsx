import React from 'react';

export const Skeleton: React.FC<{ rows?: number; className?: string }> = ({ rows = 1, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-base-200 rounded animate-pulse w-full" />
      ))}
    </div>
  );
};

export default Skeleton;
