/** DB 제약(match_notes.note)과 같은 길이 */
export const MAX_NOTE = 200;

/** 비우면 지우는 것이다(null). */
export const validateNote = (text: string): { ok: true; value: string | null } | { ok: false; error: string } => {
  const note = text.trim();
  if (note === "") return { ok: true, value: null };
  if (note.length > MAX_NOTE) return { ok: false, error: `특이사항은 ${MAX_NOTE}자까지 쓸 수 있어요.` };
  return { ok: true, value: note };
};
