import { test as base, expect, type APIRequestContext } from '@playwright/test';

// src/api/notes.ts의 API_URL과 동일하게 유지한다. E2E는 실제 json-server(db.json)를
// 상대로 돈다 — 별도 테스트 DB를 두지 않는 대신, 이 fixture로 생성한 노트는 테스트가
// 끝나면(성공/실패 무관) 항상 삭제해 개발자의 로컬 db.json을 원상 복구한다.
const API_URL = 'http://localhost:3001';

interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface CreateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface NotesApi {
  /** API로 노트를 즉시 생성한다. 생성 자체가 검증 대상이 아닐 때 UI 폼 입력을 대신한다. */
  create(input?: CreateNoteInput): Promise<Note>;
  /** title로 노트를 조회한다 (UI를 통해 만든 노트를 정리 대상으로 등록할 때 사용). */
  findByTitle(title: string): Promise<Note | undefined>;
  /** id를 정리 목록에 등록한다. UI로 생성한 노트를 자동 삭제 대상에 포함시킬 때 사용. */
  track(id: string): void;
}

async function deleteNote(request: APIRequestContext, id: string) {
  await request.delete(`${API_URL}/notes/${id}`).catch(() => {});
}

export const test = base.extend<{ notesApi: NotesApi }>({
  notesApi: async ({ request }, use, testInfo) => {
    const createdIds: string[] = [];

    const api: NotesApi = {
      async create(input = {}) {
        const now = new Date().toISOString();
        const res = await request.post(`${API_URL}/notes`, {
          data: {
            title: input.title ?? `[e2e] ${testInfo.title} ${Date.now()}`,
            content: input.content ?? '',
            tags: input.tags ?? [],
            createdAt: now,
            updatedAt: now,
          },
        });
        const note: Note = await res.json();
        createdIds.push(note.id);
        return note;
      },

      async findByTitle(title) {
        const res = await request.get(`${API_URL}/notes`, { params: { title } });
        const notes: Note[] = await res.json();
        return notes[0];
      },

      track(id) {
        createdIds.push(id);
      },
    };

    await use(api);

    await Promise.all(createdIds.map((id) => deleteNote(request, id)));
  },
});

export { expect };
