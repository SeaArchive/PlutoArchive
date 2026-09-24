"use client";
import { useEffect, useState } from "react";
import Player from "./player";
import { parseMusicSource, type MusicSource } from "./source";

type Entry = { id?: string; source: MusicSource; title: string };
type SavedEntry = { id: string; url: string; title: string };
export default function Music({
  notify,
  persistent = false,
}: {
  notify: (message: string) => void;
  persistent?: boolean;
}) {
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [active, setActive] = useState<Entry | null>(null);
  const [error, setError] = useState("");
  const [compact, setCompact] = useState(false);
  const [loading, setLoading] = useState(persistent);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!persistent) return;
    const controller = new AbortController();
    setLoading(true);
    fetch("/api/music/links", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            "저장된 음악 목록을 불러오지 못했습니다. 다시 열어 주세요.",
          );
        return (await response.json()) as { entries: SavedEntry[] };
      })
      .then(({ entries: saved }) => {
        if (controller.signal.aborted) return;
        setEntries(
          saved.flatMap((row) => {
            const source = parseMusicSource(row.url);
            return source ? [{ id: row.id, title: row.title, source }] : [];
          }),
        );
        setError("");
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "저장된 음악 목록을 불러오지 못했습니다. 앱을 다시 열어 주세요.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [persistent]);
  async function add() {
    if (saving || loading) return;
    const source = parseMusicSource(input);
    if (!source) {
      setError(
        "YouTube 또는 YouTube Music의 영상·재생목록 HTTPS 링크를 입력해 주세요.",
      );
      return;
    }
    if (
      entries.length >= 50 &&
      !entries.some((entry) => entry.source.url === source.url)
    ) {
      setError(
        "한 세션에 최대 50개 링크를 보관할 수 있습니다. 사용하지 않는 항목을 삭제해 주세요.",
      );
      return;
    }
    const existing = entries.find((entry) => entry.source.url === source.url);
    const entry = existing || {
      source,
      title:
        title.trim() ||
        (source.playlistId
          ? `재생목록 · ${source.playlistId}`
          : `영상 · ${source.videoId}`),
    };
    if (!existing && persistent) {
      setSaving(true);
      try {
        const response = await fetch("/api/music/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: source.url, title: entry.title }),
        });
        const result = (await response.json()) as {
          entry?: SavedEntry;
          error?: string;
        };
        if (!response.ok || !result.entry) {
          setError(result.error || "저장하지 못했습니다. 다시 시도해 주세요.");
          return;
        }
        entry.id = result.entry.id;
      } catch {
        setError("연결 오류로 저장하지 못했습니다. 다시 시도해 주세요.");
        return;
      } finally {
        setSaving(false);
      }
    }
    if (!existing) setEntries((items) => [...items, entry]);
    setActive(entry);
    setInput("");
    setTitle("");
    setError("");
    notify("음악 링크를 준비했습니다. 재생 버튼을 눌러 주세요.");
  }
  async function remove(entry: Entry) {
    if (saving || loading) return;
    if (persistent) {
      if (!entry.id) return;
      setSaving(true);
      try {
        const response = await fetch(
          `/api/music/links?id=${encodeURIComponent(entry.id)}`,
          { method: "DELETE" },
        );
        if (!response.ok) {
          setError("삭제하지 못했습니다. 다시 시도해 주세요.");
          return;
        }
      } catch {
        setError("연결 오류로 삭제하지 못했습니다. 다시 시도해 주세요.");
        return;
      } finally {
        setSaving(false);
      }
    }
    setEntries((items) => items.filter((item) => item !== entry));
    if (active === entry) setActive(null);
    setError("");
  }
  return (
    <div className="music-app">
      <div className="music-heading">
        <div>
          <span className="meta">MUSIC / YOUTUBE</span>
          <h2>{active?.title || "작업에 음악을 더하세요."}</h2>
        </div>
        <button
          aria-expanded={!compact}
          onClick={() => setCompact((value) => !value)}
        >
          {compact ? "목록 펼치기" : "간단히"}
        </button>
      </div>
      <p className="music-help">
        YouTube·YouTube Music 링크로 재생합니다.{" "}
        {persistent
          ? "링크 목록은 계정에 저장됩니다. YouTube 계정 보관함 연결은 준비 중입니다."
          : "공개 미리보기의 목록은 현재 세션에만 유지됩니다."}
      </p>
      <div className={`music-layout${compact ? " music-compact" : ""}`}>
        <div className="music-playback">
          {active ? (
            <Player key={active.source.url} source={active.source} />
          ) : (
            <div className="music-empty">
              <span aria-hidden="true">♫</span>
              <p>영상 또는 공개 재생목록 링크를 추가해 주세요.</p>
              <p>링크를 추가하면 YouTube에 연결합니다.</p>
            </div>
          )}
        </div>
        <div className="music-library" hidden={compact}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <label htmlFor="music-url">음악 링크</label>
            <input
              id="music-url"
              type="url"
              required
              maxLength={2048}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://music.youtube.com/watch?v=…"
              aria-describedby={error ? "music-input-error" : undefined}
              aria-invalid={Boolean(error)}
            />
            <label htmlFor="music-title">
              이름 <span className="meta">선택</span>
            </label>
            <input
              id="music-title"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="내 작업 플레이리스트"
            />
            <button type="submit" disabled={loading || saving}>
              {saving ? "저장 중…" : "링크 추가 · 선택"}
            </button>
            {error && (
              <p id="music-input-error" role="alert">
                {error}
              </p>
            )}
          </form>
          <div className="music-list-heading">
            <h3>{persistent ? "내 저장 목록" : "내 세션 목록"}</h3>
            <span className="meta">{entries.length} / 50</span>
          </div>
          <p className="music-help">
            {persistent
              ? "새로고침하거나 재로그인해도 목록이 복원됩니다."
              : "새로고침·앱 닫기 시 목록이 초기화됩니다."}{" "}
            재생목록 내 곡은 영상의 목록 버튼에서 선택할 수 있습니다.
          </p>
          {loading && <p role="status">저장 목록을 불러오는 중…</p>}
          <ul className="music-list">
            {entries.map((entry) => (
              <li key={entry.source.url}>
                <button
                  aria-pressed={active === entry}
                  onClick={() => setActive(entry)}
                >
                  {entry.title}
                </button>
                <button
                  aria-label={`${entry.title} 삭제`}
                  disabled={saving || loading}
                  onClick={() => void remove(entry)}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
