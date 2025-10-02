import React from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchInput: React.FC<SearchInputProps> = React.memo(({
  value,
  onChange,
  placeholder = "Search all notes..."
}) => {
  return (
    <div className="mb-4">
      <label htmlFor="search-input" className="sr-only">Search all notes</label>
      <input
        id="search-input"
        className="input input-bordered w-full"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
});