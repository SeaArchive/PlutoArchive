"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { apps } from "./registry";
const Notes = dynamic(() => import("./notes"));
const Tasks = dynamic(() => import("./tasks"));
const Timer = dynamic(() => import("./timer"));
const renderers: Record<
  string,
  React.ComponentType<{ notify: (message: string) => void }>
> = { notes: () => <Notes />, tasks: () => <Tasks />, timer: Timer };
export function WorkspaceShell({ preview = false }: { preview?: boolean }) {
  const [opened, setOpened] = useState(["notes", "timer"]);
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const notify = useCallback((message: string) => setNotice(message), []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
      if (e.key === "Escape") {
        setPalette(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (palette) searchRef.current?.focus();
  }, [palette]);
  function open(id: string) {
    setOpened((values) => (values.includes(id) ? values : [...values, id]));
    setPalette(false);
    setQuery("");
  }
  return (
    <div className="private-space">
      <header className="workspace-header">
        <Link className="brand" href="/">
          P↗ PLUTO / WORKSPACE
        </Link>
        <span className="meta">PERSONAL WORKING ORBIT</span>
        {!preview && (
          <form method="post" action="/auth/sign-out">
            <button>로그아웃</button>
          </form>
        )}
      </header>
      <main id="main" className="workspace-main">
        <div className="workspace-heading">
          <div>
            <span className="meta">WORKSPACE / FOUNDATION</span>
            <h1>A space to focus.</h1>
          </div>
          <button ref={triggerRef} onClick={() => setPalette(true)}>
            검색 <kbd>⌘ K</kbd>
          </button>
        </div>
        <p className="preview-banner">
          {preview ? "공개 미리보기" : "초기 Workspace"} · 메모와 작업은 현재
          화면에서만 유지됩니다. 새로고침·앱 닫기 시 초기화됩니다. 서버 동기화는
          다음 단계에서 연결합니다.
        </p>
        <div className="launcher" aria-label="앱 런처">
          {apps.map((app, i) => (
            <button
              key={app.id}
              aria-pressed={opened.includes(app.id)}
              onClick={() => open(app.id)}
            >
              <span className="meta">0{i + 1} / APP</span>
              {app.name}
            </button>
          ))}
          <Link className="text-link" href="/admin">
            Admin ↗
          </Link>
        </div>
        <div className="window-grid">
          {opened.map((id) => {
            const App = renderers[id];
            return (
              <section className="app-window" key={id} aria-label={id}>
                <header className="window-title">
                  <span>{apps.find((app) => app.id === id)?.name}</span>
                  <button
                    aria-label={id + " 닫기"}
                    onClick={() =>
                      setOpened(opened.filter((value) => value !== id))
                    }
                  >
                    ×
                  </button>
                </header>
                <div className="app-body">
                  <App notify={notify} />
                </div>
              </section>
            );
          })}
        </div>
        <div role="status" className="notice">
          {notice}
        </div>
        {palette && (
          <div className="palette" onClick={() => setPalette(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label="앱 검색"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  const focusables = Array.from(
                    e.currentTarget.querySelectorAll<HTMLElement>(
                      "input,button",
                    ),
                  );
                  const first = focusables[0],
                    last = focusables.at(-1);
                  if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                  } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                  }
                }
              }}
            >
              <span className="meta">COMMAND / OPEN APP</span>
              <input
                ref={searchRef}
                aria-label="앱 이름 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="앱 검색…"
              />
              {apps
                .filter((a) =>
                  a.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      open(app.id);
                      triggerRef.current?.focus();
                    }}
                  >
                    {app.name} 열기 →
                  </button>
                ))}
              <button
                onClick={() => {
                  setPalette(false);
                  triggerRef.current?.focus();
                }}
              >
                닫기 · Esc
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
