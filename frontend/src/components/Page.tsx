import React from 'react';

export default function Page({ title, children, toolbar }: { title?: string; toolbar?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      {title && <div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-bold">{title}</h2>{toolbar}</div>}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
