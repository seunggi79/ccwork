import { describe, it, expect } from 'vitest';
import { addTag } from './tags';

describe('addTag', () => {
  it('should append the trimmed input as a new tag when input is a new, non-duplicate value', () => {
    expect(addTag(['react'], 'vue')).toEqual(['react', 'vue']);
  });

  it('should keep existing tags unchanged and append the new tag when adding a second distinct tag', () => {
    const tags = ['react', 'study'];
    expect(addTag(tags, 'urgent')).toEqual(['react', 'study', 'urgent']);
  });

  it('should silently return the tags array unchanged (no error) when input is an empty string', () => {
    const tags = ['react'];
    expect(addTag(tags, '')).toBe(tags);
  });

  it('should silently return the tags array unchanged (no error) when input is only whitespace', () => {
    const tags = ['react'];
    expect(addTag(tags, '   ')).toBe(tags);
  });

  it('should return the tags array unchanged when input matches an existing tag ignoring case and surrounding whitespace', () => {
    const tags = ['React'];
    expect(addTag(tags, '  react  ')).toBe(tags);
  });

  it('should preserve the original casing of the previously-added tag when a case-different duplicate input is rejected', () => {
    const result = addTag(['React'], 'react');
    expect(result).toEqual(['React']);
  });

  it('should support accumulating at least 20 distinct tags without any artificial limit', () => {
    let tags: string[] = [];
    for (let i = 0; i < 20; i++) {
      tags = addTag(tags, `tag-${i}`);
    }
    expect(tags).toHaveLength(20);
  });
});
