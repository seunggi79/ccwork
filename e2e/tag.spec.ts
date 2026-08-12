import { Page } from '@playwright/test';
import { test, expect } from './support/fixtures';

// 태그 칩(<span>)은 `{tag}<button>×</button>`을 공백 없이 이어붙여 렌더링하므로
// textContent가 "react×"처럼 태그명과 × 글리프가 합쳐진 문자열이 된다. exact 텍스트 매칭은
// 절대 통과할 수 없어, span을 hasText(부분 문자열)로 좁혀 칩 단위로 가시성을 확인한다.
// 이 앱에서 <span>은 TagInput의 칩에서만 쓰이므로 다른 텍스트와 혼동될 위험이 없다.
function tagChip(page: Page, tag: string) {
  return page.locator('span').filter({ hasText: tag });
}

test.describe('태그', () => {
  test('should keep the newly added tag chip visible after saving and reloading the page', async ({
    page,
    notesApi,
  }) => {
    const note = await notesApi.create({ tags: ['study'] });

    await page.goto('/');
    await page.getByRole('heading', { name: note.title, exact: true }).click();

    await page.getByPlaceholder('태그 추가').fill('urgent');
    await page.getByPlaceholder('태그 추가').press('Enter');
    await expect(tagChip(page, 'urgent')).toBeVisible();

    await page.getByRole('button', { name: '저장' }).click();
    await page.reload();

    await page.getByRole('heading', { name: note.title, exact: true }).click();
    await expect(tagChip(page, 'study')).toBeVisible();
    await expect(tagChip(page, 'urgent')).toBeVisible();
  });

  test('should not display the removed tag after saving and reloading the page', async ({
    page,
    notesApi,
  }) => {
    const note = await notesApi.create({ tags: ['react', 'todo'] });

    await page.goto('/');
    await page.getByRole('heading', { name: note.title, exact: true }).click();

    await tagChip(page, 'react').getByRole('button', { name: '×' }).click();
    await expect(tagChip(page, 'react')).not.toBeVisible();

    await page.getByRole('button', { name: '저장' }).click();
    await page.reload();

    await page.getByRole('heading', { name: note.title, exact: true }).click();
    await expect(tagChip(page, 'todo')).toBeVisible();
    await expect(tagChip(page, 'react')).not.toBeVisible();
  });

  test('should display an existing note tags when opening it from the sidebar', async ({
    page,
    notesApi,
  }) => {
    const note = await notesApi.create({ tags: ['react', 'study'] });

    await page.goto('/');
    await page.getByRole('heading', { name: note.title, exact: true }).click();

    await expect(tagChip(page, 'react')).toBeVisible();
    await expect(tagChip(page, 'study')).toBeVisible();
  });

  test('should show the correct tags after switching from one note to another', async ({
    page,
    notesApi,
  }) => {
    const noteA = await notesApi.create({ tags: ['react'] });
    const noteB = await notesApi.create({ tags: [] });

    await page.goto('/');
    await page.getByRole('heading', { name: noteA.title, exact: true }).click();
    await expect(tagChip(page, 'react')).toBeVisible();

    await page.getByRole('heading', { name: noteB.title, exact: true }).click();
    await expect(tagChip(page, 'react')).not.toBeVisible();
  });

  test('should discard the unsaved tag change when Cancel is clicked and the note is reopened after navigating away', async ({
    page,
    notesApi,
  }) => {
    const noteA = await notesApi.create({ tags: ['study'] });
    const noteB = await notesApi.create({ tags: [] });

    await page.goto('/');
    await page.getByRole('heading', { name: noteA.title, exact: true }).click();

    await page.getByPlaceholder('태그 추가').fill('urgent');
    await page.getByPlaceholder('태그 추가').press('Enter');
    await expect(tagChip(page, 'urgent')).toBeVisible();

    await page.getByRole('button', { name: '취소' }).click();

    // 다른 노트로 이동했다가 다시 돌아와 실제 App 상태 전환을 거친다.
    await page.getByRole('heading', { name: noteB.title, exact: true }).click();
    await page.getByRole('heading', { name: noteA.title, exact: true }).click();

    await expect(tagChip(page, 'study')).toBeVisible();
    await expect(tagChip(page, 'urgent')).not.toBeVisible();
  });
});
