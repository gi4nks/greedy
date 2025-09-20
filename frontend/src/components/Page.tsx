import React from 'react';

export default function Page({ title, children, toolbar }: { title?: string; toolbar?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-6">
      {title && <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold">{title}</h2>{toolbar}</div>}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
