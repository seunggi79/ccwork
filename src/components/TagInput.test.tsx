import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  it('should render one chip per tag in the tags prop', () => {
    render(<TagInput tags={['react', 'study']} onAdd={() => {}} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('study')).toBeInTheDocument();
  });

  it('should call onAdd with the current input value and clear the input field when Enter is pressed', async () => {
    const handleAdd = vi.fn();
    render(<TagInput tags={[]} onAdd={handleAdd} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'urgent{enter}');
    expect(handleAdd).toHaveBeenCalledWith('urgent');
    expect(input).toHaveValue('');
  });
});
