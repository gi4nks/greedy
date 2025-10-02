import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormInput } from './FormFields';

describe('FormInput', () => {
  it('renders with label and input', () => {
    render(
      <FormInput
        label="Test Label"
        value="test value"
        onChange={() => {}}
        placeholder="Test placeholder"
      />
    );

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Test placeholder')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    const mockOnChange = vi.fn();
    render(
      <FormInput
        label="Test Label"
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(mockOnChange).toHaveBeenCalledWith('new value');
  });

  it('handles number type correctly', () => {
    const mockOnChange = vi.fn();
    render(
      <FormInput
        label="Number Input"
        type="number"
        value={42}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByDisplayValue('42');
    fireEvent.change(input, { target: { value: '123' } });

    expect(mockOnChange).toHaveBeenCalledWith(123);
  });
});