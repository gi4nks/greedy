import React from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';

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

// React Hook Form versions
export interface HookFormInputProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  className?: string;
  helpText?: string;
}

export function HookFormInput({
  form,
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  min,
  max,
  className = '',
  helpText,
}: HookFormInputProps): JSX.Element {
  const {
    register,
    formState: { errors },
  } = form;

  const error = errors[name]?.message as string;

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-semibold">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
      </label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        min={min}
        max={max}
        className={`input input-bordered w-full h-9 ${error ? 'input-error' : ''} ${className}`}
      />
      <div className="label">
        {error && <span className="label-text-alt text-error">{error}</span>}
        {helpText && !error && (
          <span className="label-text-alt text-base-content/60">{helpText}</span>
        )}
      </div>
    </div>
  );
}

export interface HookFormTextareaProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  className?: string;
  helpText?: string;
}

export function HookFormTextarea({
  form,
  name,
  label,
  placeholder,
  required = false,
  rows = 3,
  className = '',
  helpText,
}: HookFormTextareaProps): JSX.Element {
  const {
    register,
    formState: { errors },
  } = form;

  const error = errors[name]?.message as string;

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-semibold">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
      </label>
      <textarea
        {...register(name)}
        placeholder={placeholder}
        rows={rows}
        className={`textarea textarea-bordered w-full ${error ? 'textarea-error' : ''} ${className}`}
      />
      <div className="label">
        {error && <span className="label-text-alt text-error">{error}</span>}
        {helpText && !error && (
          <span className="label-text-alt text-base-content/60">{helpText}</span>
        )}
      </div>
    </div>
  );
}

export interface HookFormSelectProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  className?: string;
  helpText?: string;
}

export function HookFormSelect({
  form,
  name,
  label,
  options,
  placeholder,
  required = false,
  className = '',
  helpText,
}: HookFormSelectProps): JSX.Element {
  const {
    register,
    formState: { errors },
  } = form;

  const error = errors[name]?.message as string;

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-semibold">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
      </label>
      <select
        {...register(name)}
        className={`select select-bordered w-full h-9 ${error ? 'select-error' : ''} ${className}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="label">
        {error && <span className="label-text-alt text-error">{error}</span>}
        {helpText && !error && (
          <span className="label-text-alt text-base-content/60">{helpText}</span>
        )}
      </div>
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