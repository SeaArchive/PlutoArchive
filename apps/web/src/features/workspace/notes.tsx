"use client";
import { useEffect, useState } from "react";
import { workspaceRequest } from "./data";

type Note = {
  id: string;
  body: string;
  color: "slate" | "green" | "blue" | "amber";
  pinned: boolean;
};
const colors: Note["color"][] = ["slate", "green", "blue", "amber"];

export default function Notes({
  persistent = false,
  notify,
}: {
  persistent?: boolean;
  notify: (message: string) => void;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(persistent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [dirty, setDirty] = useState<string[]>([]);
  useEffect(() => {
    if (!persistent) return;
    const controller = new AbortController();
    workspaceRequest<{ items: Note[] }>(
      "notes",
      "GET",
      undefined,
      undefined,
      controller.signal,
    )
      .then(({ items }) => {
        if (!controller.signal.aborted) setNotes(items);
      })
      .catch((e: Error) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [persistent]);
  async function add() {
    setBusy(true);
    try {
      const note = persistent
        ? (
            await workspaceRequest<{ item: Note }>("notes", "POST", undefined, {
              body: "",
            })
          ).item
        : {
            id: crypto.randomUUID(),
            body: "",
            color: "slate" as const,
            pinned: false,
          };
      setNotes((items) => [note, ...items]);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function update(
    note: Note,
    patch: Partial<Pick<Note, "body" | "color" | "pinned">>,
  ) {
    setBusy(true);
    try {
      const saved = persistent
        ? (
            await workspaceRequest<{ item: Note }>(
              "notes",
              "PATCH",
              note.id,
              patch,
            )
          ).item
        : { ...note, ...patch };
      setNotes((items) =>
        items.map((item) =>
          item.id === note.id
            ? {
                ...item,
                ...saved,
                body: "body" in patch ? saved.body : item.body,
              }
            : item,
        ),
      );
      if ("body" in patch)
        setDirty((items) => items.filter((id) => id !== note.id));
      setError("");
      notify("메모를 저장했습니다.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(note: Note) {
    setBusy(true);
    try {
      if (persistent) await workspaceRequest("notes", "DELETE", note.id);
      setNotes((items) => items.filter((item) => item.id !== note.id));
      setDirty((items) => items.filter((id) => id !== note.id));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="notes-app">
      <div className="notes-toolbar">
        <button onClick={() => void add()} disabled={loading || busy}>
          + 새 메모
        </button>
        <input
          aria-label="메모 검색"
          placeholder="메모 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <p className="meta">
        {persistent
          ? "본문 수정 후 저장을 눌러 주세요. 메모 본문과 화면 배치는 분리됩니다."
          : "공개 미리보기 · 화면을 닫으면 초기화"}
      </p>
      {loading && <p role="status">메모를 불러오는 중…</p>}
      {error && <p role="alert">{error}</p>}
      {notes
        .filter((note) => note.body.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned))
        .map((note, index) => (
          <div className={`sticky-note note-${note.color}`} key={note.id}>
            <label className="meta" htmlFor={`note-${note.id}`}>
              NOTE / {String(index + 1).padStart(2, "0")}
              {note.pinned ? " · PIN" : ""}
              {dirty.includes(note.id) ? " · 미저장" : ""}
            </label>
            <textarea
              id={`note-${note.id}`}
              value={note.body}
              maxLength={20000}
              placeholder="생각이 떠오르면, 여기에."
              disabled={busy || loading}
              onChange={(e) => {
                setNotes((items) =>
                  items.map((item) =>
                    item.id === note.id
                      ? { ...item, body: e.target.value }
                      : item,
                  ),
                );
                setDirty((items) =>
                  items.includes(note.id) ? items : [...items, note.id],
                );
              }}
            />
            <div className="note-actions">
              <button
                disabled={busy}
                onClick={() => void update(note, { body: note.body })}
              >
                저장
              </button>
              <select
                aria-label="메모 색상"
                value={note.color}
                disabled={busy}
                onChange={(e) =>
                  void update(note, { color: e.target.value as Note["color"] })
                }
              >
                {colors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
              <button
                disabled={busy}
                aria-pressed={note.pinned}
                onClick={() => void update(note, { pinned: !note.pinned })}
              >
                {note.pinned ? "고정 해제" : "고정"}
              </button>
              <button disabled={busy} onClick={() => void remove(note)}>
                삭제
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
