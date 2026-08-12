import { useState } from 'react';

interface TagInputProps {
  tags: string[];
  onAdd: (value: string) => void;
}

export function TagInput({ tags, onAdd }: TagInputProps) {
  const [value, setValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onAdd(value);
      setValue('');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <span key={tag} className="px-2 py-1 text-sm text-foreground bg-muted border border-border">
          {tag}
        </span>
      ))}
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="태그 추가"
        className="text-sm text-foreground bg-transparent border-b border-muted focus:border-foreground outline-none placeholder:text-muted-foreground/50 transition-colors"
      />
    </div>
  );
}
