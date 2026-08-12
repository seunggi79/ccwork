export function addTag(tags: string[], input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return tags;

  const isDuplicate = tags.some((tag) => tag.toLowerCase() === trimmed.toLowerCase());
  if (isDuplicate) return tags;

  return [...tags, trimmed];
}

export function removeTag(tags: string[], tagToRemove: string): string[] {
  return tags.filter((tag) => tag !== tagToRemove);
}
