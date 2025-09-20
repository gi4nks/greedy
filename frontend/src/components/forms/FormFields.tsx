import React from 'react';

interface FormInputProps {
  label: string;
  type?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

export function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  min,
  max,
  className = ''
}: FormInputProps): JSX.Element {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-semibold">{label}</span>
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        className={`input input-bordered w-full h-9 ${className}`}
      />
    </div>
  );
}

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  className?: string;
}

export function FormSelect({
  label,
  value,
  onChange,
  options,
  required = false,
  className = ''
}: FormSelectProps): JSX.Element {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-semibold">{label}</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`select select-bordered w-full h-9 ${className}`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  className?: string;
}

export function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 3,
  className = ''
}: FormTextareaProps): JSX.Element {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-semibold">{label}</span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={`textarea textarea-bordered w-full ${className}`}
      />
    </div>
  );
}