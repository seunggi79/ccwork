import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  it('should render one chip per tag in the tags prop', () => {
    render(<TagInput tags={['react', 'study']} onAdd={() => {}} onRemove={() => {}} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('study')).toBeInTheDocument();
  });

  it('should call onAdd with the current input value and clear the input field when Enter is pressed', async () => {
    const handleAdd = vi.fn();
    render(<TagInput tags={[]} onAdd={handleAdd} onRemove={() => {}} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'urgent{enter}');
    expect(handleAdd).toHaveBeenCalledWith('urgent');
    expect(input).toHaveValue('');
  });

  it('should render a delete (×) button for each tag chip', () => {
    render(<TagInput tags={['react', 'study']} onAdd={() => {}} onRemove={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it("should call onRemove with the clicked tag's value when its delete button is clicked", async () => {
    const handleRemove = vi.fn();
    render(<TagInput tags={['react']} onAdd={() => {}} onRemove={handleRemove} />);
    await userEvent.click(screen.getByRole('button'));
    expect(handleRemove).toHaveBeenCalledWith('react');
  });

  it("should call onRemove only with the tag whose delete button was clicked, leaving other tags' handlers uncalled, when multiple tags are rendered", async () => {
    const handleRemove = vi.fn();
    render(<TagInput tags={['react', 'todo']} onAdd={() => {}} onRemove={handleRemove} />);
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[0]);
    expect(handleRemove).toHaveBeenCalledWith('react');
    expect(handleRemove).not.toHaveBeenCalledWith('todo');
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });
});
