import React from 'react';

interface MagicItemSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const MagicItemSearch: React.FC<MagicItemSearchProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="mb-6">
      <form onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          placeholder="Search Magic Items..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input input-bordered input-primary w-full h-9"
        />
      </form>
    </div>
  );
};