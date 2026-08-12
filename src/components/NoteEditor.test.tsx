import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteEditor } from './NoteEditor';
import { NotesProvider } from '../context/NotesContext';
import * as api from '../api/notes';

vi.mock('../api/notes');

const existingNote = {
  id: '1',
  title: '기존 노트',
  content: '내용',
  tags: ['study'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// notes 로드가 끝난 뒤에 실제 선택이 일어나는 App.tsx의 순서를 그대로 재현한다 —
// selectedNoteId를 처음부터 채워서 마운트하면 폼 동기화 useEffect가 notes 로딩 전에 한 번만
// 실행되고 다시 돌지 않아 항상 빈 폼으로 남는, 실제 사용 흐름에서는 벌어지지 않는 타이밍 문제가 생긴다.
async function renderEditor(props: {
  selectedNoteId: string | null;
  isCreating: boolean;
  onDone: () => void;
}) {
  const utils = render(
    <NotesProvider>
      <NoteEditor selectedNoteId={null} isCreating={false} onDone={props.onDone} />
    </NotesProvider>,
  );
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  utils.rerender(
    <NotesProvider>
      <NoteEditor {...props} />
    </NotesProvider>,
  );
  return utils;
}

describe('NoteEditor', () => {
  beforeEach(() => {
    vi.mocked(api.fetchNotes).mockResolvedValue([existingNote]);
    vi.mocked(api.updateNote).mockResolvedValue(existingNote);
    vi.mocked(api.createNote).mockResolvedValue(existingNote);
  });

  it('should call updateNote with the previous tags plus the newly added tag when Save is clicked', async () => {
    await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');

    const tagInput = screen.getAllByRole('textbox')[2];
    await userEvent.type(tagInput, 'todo{enter}');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(api.updateNote).toHaveBeenCalledWith('1', {
        title: '기존 노트',
        content: '내용',
        tags: ['study', 'todo'],
      });
    });
  });

  it('should not call updateNote or createNote while a tag has been added locally but Save has not been clicked yet', async () => {
    await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');

    const tagInput = screen.getAllByRole('textbox')[2];
    await userEvent.type(tagInput, 'todo{enter}');

    expect(api.updateNote).not.toHaveBeenCalled();
    expect(api.createNote).not.toHaveBeenCalled();
  });

  it("should populate the tags state from the selected note's existing tags when opening an existing note for editing", async () => {
    await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');

    expect(await screen.findByText('study')).toBeInTheDocument();
  });

  it('should restore the tags state from the server-persisted note (discarding any unsaved addition) when the note is reselected after Cancel was clicked without saving', async () => {
    const utils = await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');

    const tagInput = screen.getAllByRole('textbox')[2];
    await userEvent.type(tagInput, 'urgent{enter}');

    // 취소 → 선택 해제 → 같은 노트 재선택 (App.tsx의 handleDone/handleSelectNote 흐름 재현)
    utils.rerender(
      <NotesProvider>
        <NoteEditor selectedNoteId={null} isCreating={false} onDone={() => {}} />
      </NotesProvider>,
    );
    utils.rerender(
      <NotesProvider>
        <NoteEditor selectedNoteId="1" isCreating={false} onDone={() => {}} />
      </NotesProvider>,
    );

    await screen.findByDisplayValue('기존 노트');
    expect(screen.queryByText('urgent')).not.toBeInTheDocument();
    expect(await screen.findByText('study')).toBeInTheDocument();
  });

  it('should not render TagInput when isCreating is true', async () => {
    // TagInput 존재 자체를 아직 가정할 수 없으므로, 단순히 "생성 모드에 태그 입력창이 없다"만
    // 확인하면 편집 모드에도 TagInput이 없는 지금 시점엔 항상 참이 되어 버린다(거짓 통과).
    // 편집 모드 대비 textbox 개수가 더 적어야 한다는 차이로 검증해 지금 실제로 실패하게 만든다.
    const utils = await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');
    const textboxCountWhenEditing = screen.getAllByRole('textbox').length;

    utils.rerender(
      <NotesProvider>
        <NoteEditor selectedNoteId={null} isCreating={true} onDone={() => {}} />
      </NotesProvider>,
    );
    const textboxCountWhenCreating = screen.getAllByRole('textbox').length;

    expect(textboxCountWhenCreating).toBeLessThan(textboxCountWhenEditing);
  });
});
