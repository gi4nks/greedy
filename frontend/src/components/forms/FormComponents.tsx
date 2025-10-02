import React from 'react';
import { useForm, UseFormReturn, FieldPath, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export interface FormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function Form<T extends FieldValues>({
  form,
  onSubmit,
  children,
  className = '',
}: FormProps<T>) {
  const { handleSubmit } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      {children}
    </form>
  );
}

export interface FormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  className?: string;
  helpText?: string;
}

export function FormField<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  type = 'text',
  options,
  required = false,
  className = '',
  helpText,
}: FormFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = form;

  const error = errors[name]?.message as string;

  return (
    <div className={`form-control ${className}`}>
      {label && (
        <label className="label">
          <span className="label-text font-semibold">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          {...register(name)}
          placeholder={placeholder}
          className={`textarea textarea-bordered h-24 ${error ? 'textarea-error' : ''}`}
        />
      ) : type === 'select' ? (
        <select
          {...register(name)}
          className={`select select-bordered w-full ${error ? 'select-error' : ''}`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...register(name)}
          type={type}
          placeholder={placeholder}
          className={`input input-bordered w-full ${error ? 'input-error' : ''}`}
        />
      )}

      <div className="label">
        {error && <span className="label-text-alt text-error">{error}</span>}
        {helpText && !error && (
          <span className="label-text-alt text-base-content/60">{helpText}</span>
        )}
      </div>
    </div>
  );
}

export interface FormActionsProps {
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

export function FormActions({
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  className = '',
}: FormActionsProps) {
  return (
    <div className={`card-actions justify-end ${className}`}>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost"
          disabled={isSubmitting}
        >
          {cancelLabel}
        </button>
      )}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={isSubmitting}
      >
        {isSubmitting && <span className="loading loading-spinner loading-sm"></span>}
        {submitLabel}
      </button>
    </div>
  );
}

