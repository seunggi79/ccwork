import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, within } from '@testing-library/react';
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

// 태그 칩(텍스트 + 삭제 버튼)이 한 컨테이너 안에 함께 렌더링된다는 구조만 가정하고, 삭제
// 버튼의 접근성 이름(aria-label 등) 같은 구현 세부사항은 가정하지 않는다.
async function clickRemoveButtonFor(tag: string) {
  const chip = screen.getByText(tag).closest('span') as HTMLElement;
  await userEvent.click(within(chip).getByRole('button'));
}

describe('NoteEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('should keep the newly added tag chip visible in the UI after Save succeeds', async () => {
    await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');

    const tagInput = screen.getAllByRole('textbox')[2];
    await userEvent.type(tagInput, 'todo{enter}');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(api.updateNote).toHaveBeenCalled();
    });
    expect(screen.getByText('todo')).toBeInTheDocument();
  });

  it('should not call updateNote or createNote while a tag has been added locally but Save has not been clicked yet', async () => {
    await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');

    const tagInput = screen.getAllByRole('textbox')[2];
    await userEvent.type(tagInput, 'todo{enter}');

    expect(api.updateNote).not.toHaveBeenCalled();
    expect(api.createNote).not.toHaveBeenCalled();
  });

  it('should not call updateNote when Cancel is clicked after a tag has been added locally', async () => {
    await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');

    const tagInput = screen.getAllByRole('textbox')[2];
    await userEvent.type(tagInput, 'urgent{enter}');
    await userEvent.click(screen.getByRole('button', { name: '취소' }));

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

  it('should render 20 tag chips when 20 distinct tags are added one by one via the tag input', async () => {
    await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');

    for (let i = 0; i < 20; i++) {
      const tagInput = screen.getAllByRole('textbox')[2];
      await userEvent.type(tagInput, `tag-${i}{enter}`);
    }

    expect(screen.getAllByText(/^tag-\d+$/)).toHaveLength(20);
  });

  it('should remove the tag chip from the screen immediately when its delete button is clicked, before Save is clicked', async () => {
    await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');
    await screen.findByText('study');

    await clickRemoveButtonFor('study');

    expect(screen.queryByText('study')).not.toBeInTheDocument();
  });

  it('should remove only the clicked tag chip and keep the other tag chip visible when two tags exist', async () => {
    const noteWithTwoTags = { ...existingNote, tags: ['react', 'todo'] };
    vi.mocked(api.fetchNotes).mockResolvedValue([noteWithTwoTags]);

    await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');
    await screen.findByText('react');
    await screen.findByText('todo');

    await clickRemoveButtonFor('react');

    expect(screen.queryByText('react')).not.toBeInTheDocument();
    expect(screen.getByText('todo')).toBeInTheDocument();
  });

  it('should call updateNote with the tags array excluding the removed tag when Save is clicked after removing a tag', async () => {
    const noteWithTwoTags = { ...existingNote, tags: ['react', 'todo'] };
    vi.mocked(api.fetchNotes).mockResolvedValue([noteWithTwoTags]);

    await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');
    await screen.findByText('react');

    await clickRemoveButtonFor('react');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(api.updateNote).toHaveBeenCalledWith('1', {
        title: '기존 노트',
        content: '내용',
        tags: ['todo'],
      });
    });
  });

  it('should not display the removed tag after Save succeeds while the other remaining tag stays visible', async () => {
    const noteWithTwoTags = { ...existingNote, tags: ['react', 'todo'] };
    vi.mocked(api.fetchNotes).mockResolvedValue([noteWithTwoTags]);
    vi.mocked(api.updateNote).mockResolvedValue({ ...noteWithTwoTags, tags: ['todo'] });

    await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');
    await screen.findByText('react');

    await clickRemoveButtonFor('react');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(api.updateNote).toHaveBeenCalled();
    });
    expect(screen.queryByText('react')).not.toBeInTheDocument();
    expect(screen.getByText('todo')).toBeInTheDocument();
  });

  it('should not call updateNote or createNote while a tag has been removed locally but Save has not been clicked yet', async () => {
    await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');
    await screen.findByText('study');

    await clickRemoveButtonFor('study');

    expect(api.updateNote).not.toHaveBeenCalled();
    expect(api.createNote).not.toHaveBeenCalled();
  });

  it('should restore the removed tag when the note is reselected after the actual Cancel button is clicked without saving', async () => {
    const utils = await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');
    await screen.findByText('study');

    await clickRemoveButtonFor('study');
    expect(screen.queryByText('study')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(api.updateNote).not.toHaveBeenCalled();

    // 실제 App.tsx는 onDone에서 selectedNoteId를 null로 바꾼 뒤 같은 노트를 다시 선택할 수
    // 있게 한다 — 이 테스트의 onDone은 no-op이므로 그 흐름을 rerender로 재현한다.
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
    expect(await screen.findByText('study')).toBeInTheDocument();
  });

  it('should restore both the removed tag and the remaining tag when the note is reselected after the actual Cancel button is clicked, given a note with two tags', async () => {
    const noteWithTwoTags = { ...existingNote, tags: ['study', 'urgent'] };
    vi.mocked(api.fetchNotes).mockResolvedValue([noteWithTwoTags]);

    const utils = await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');
    await screen.findByText('urgent');

    await clickRemoveButtonFor('urgent');
    expect(screen.queryByText('urgent')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(api.updateNote).not.toHaveBeenCalled();

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
    expect(await screen.findByText('study')).toBeInTheDocument();
    expect(await screen.findByText('urgent')).toBeInTheDocument();
  });

  it('should call updateNote with an empty tags array when the only tag is removed and Save is clicked', async () => {
    await renderEditor({ selectedNoteId: '1', isCreating: false, onDone: () => {} });
    await screen.findByDisplayValue('기존 노트');
    await screen.findByText('study');

    await clickRemoveButtonFor('study');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(api.updateNote).toHaveBeenCalledWith('1', {
        title: '기존 노트',
        content: '내용',
        tags: [],
      });
    });
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
