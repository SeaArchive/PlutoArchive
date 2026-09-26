"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apps, renderers } from "./registry";
import { WindowManager } from "./window-manager";
import { useWindowState } from "./window-state";
import { fitWindow, type WindowPlacement } from "./layout";
import { searchCommands, workspaceCommands } from "./commands";
export function WorkspaceShell({ preview = false }: { preview?: boolean }) {
  const {
    device,
    windows,
    loaded,
    error: layoutError,
    change,
    save,
    reset,
    retry,
  } = useWindowState(preview);
  const [mobileTab, setMobileTab] = useState<
    "home" | "apps" | "search" | "notifications" | "settings"
  >("home");
  const [mobileApp, setMobileApp] = useState<string | null>(null);
  const [palette, setPalette] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [notifications, setNotifications] = useState<
    { id: number; message: string; time: string }[]
  >([]);
  const [desktopPanel, setDesktopPanel] = useState<
    "notifications" | "settings" | null
  >(null);
  const notificationId = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const notify = useCallback((message: string) => {
    setNotice(message);
    const entry = {
      id: ++notificationId.current,
      message,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setNotifications((previous) => [entry, ...previous].slice(0, 30));
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (device === "mobile") setMobileTab("search");
        else setPalette((p) => !p);
      }
      if (e.key === "Escape" && palette) {
        setPalette(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [device, palette]);
  useEffect(() => {
    if (palette) searchRef.current?.focus();
  }, [palette]);
  function open(id: string) {
    if (!device || !loaded) return;
    change((items) => {
      const ordered =
        Math.max(0, ...items.map((item) => item.z)) >= 9990
          ? [...items]
              .sort((a, b) => a.z - b.z)
              .map((item, index) => ({ ...item, z: index + 1 }))
          : items;
      const top = Math.max(0, ...ordered.map((item) => item.z));
      if (ordered.some((item) => item.id === id))
        return ordered.map((item) =>
          item.id === id ? { ...item, minimized: false, z: top + 1 } : item,
        );
      const app = apps.find((entry) => entry.id === id);
      if (!app) return items;
      const created: WindowPlacement = {
        id,
        x: 24 + ((items.length * 72) % 280),
        y: 24 + ((items.length * 52) % 180),
        width: app.window.defaultWidth,
        height: app.window.defaultHeight,
        z: top + 1,
        minimized: false,
      };
      return [
        ...ordered,
        device === "mobile"
          ? created
          : fitWindow(
              created,
              document.querySelector(".workspace-canvas")?.clientWidth || 900,
              700,
            ),
      ];
    });
    save();
    if (device === "mobile") {
      setMobileApp(id);
      setMobileTab("home");
    }
    setPalette(false);
    setQuery("");
  }
  function restore(id: string) {
    open(id);
  }
  const commands = workspaceCommands({
    open,
    notifications: () => {
      if (device === "mobile") setMobileTab("notifications");
      else setDesktopPanel("notifications");
    },
    settings: () => {
      if (device === "mobile") setMobileTab("settings");
      else setDesktopPanel("settings");
    },
  });
  const matches = searchCommands(commands, query);
  function runCommand(command: (typeof commands)[number]) {
    command.execute();
    setPalette(false);
    setQuery("");
    if (device !== "mobile") triggerRef.current?.focus();
  }
  const notificationList = (
    <>
      {notifications.length === 0 ? (
        <p>새 알림이 없습니다.</p>
      ) : (
        <>
          <button onClick={() => setNotifications([])}>알림 모두 지우기</button>
          <ul className="workspace-notification-list">
            {notifications.map((entry) => (
              <li key={entry.id}>
                <span>{entry.message}</span>
                <time>{entry.time}</time>
                <button
                  aria-label={`${entry.message} 알림 지우기`}
                  onClick={() =>
                    setNotifications((items) =>
                      items.filter((item) => item.id !== entry.id),
                    )
                  }
                >
                  지우기
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
  const mobileVisible = windows.find(
    (item) => item.id === mobileApp && !item.minimized,
  );
  const MobileApp = mobileVisible ? renderers[mobileVisible.id] : null;
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
            <span className="meta">WORKSPACE / MUSIC FIRST</span>
            <h1>A space to focus.</h1>
          </div>
          {device !== "mobile" && (
            <button ref={triggerRef} onClick={() => setPalette(true)}>
              검색 <kbd>⌘ K</kbd>
            </button>
          )}
        </div>
        <p className="preview-banner">
          {preview
            ? "공개 미리보기 · 음악 목록·메모·작업은 현재 화면에서만 유지됩니다."
            : "개인 Workspace · 음악 링크, 저장한 메모 및 작업은 계정에 보관됩니다."}
        </p>
        {device !== "mobile" && (
          <div className="workspace-tools">
            <button
              onClick={() =>
                setDesktopPanel(
                  desktopPanel === "notifications" ? null : "notifications",
                )
              }
            >
              알림 {notifications.length > 0 ? `(${notifications.length})` : ""}
            </button>
            <button
              onClick={() =>
                setDesktopPanel(desktopPanel === "settings" ? null : "settings")
              }
            >
              설정
            </button>
          </div>
        )}
        {device !== "mobile" && desktopPanel && (
          <section
            className="workspace-panel"
            aria-label={desktopPanel === "notifications" ? "알림 센터" : "설정"}
          >
            <h2>{desktopPanel === "notifications" ? "알림 센터" : "설정"}</h2>
            {desktopPanel === "notifications" ? (
              notificationList
            ) : (
              <>
                <p>현재 기기의 창 배치를 초기화합니다.</p>
                <button onClick={reset}>창 배치 초기화</button>
              </>
            )}
            <button onClick={() => setDesktopPanel(null)}>닫기</button>
          </section>
        )}
        {!loaded && (
          <div role="status" className="preview-banner">
            {layoutError ? (
              <>
                {layoutError} <button onClick={retry}>다시 시도</button>
              </>
            ) : (
              "작업 공간을 불러오는 중…"
            )}
          </div>
        )}
        {loaded && device !== "mobile" && (
          <>
            <div className="launcher" aria-label="앱 런처">
              {apps.map((app, i) => (
                <button
                  key={app.id}
                  aria-pressed={windows.some((w) => w.id === app.id)}
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
            <WindowManager
              windows={windows}
              change={change}
              save={save}
              notify={notify}
              preview={preview}
            />
            <nav className="workspace-dock" aria-label="실행 중인 앱">
              {windows.map((w) => (
                <button
                  key={w.id}
                  aria-label={`${apps.find((app) => app.id === w.id)?.name} ${w.minimized ? "복원" : "앞으로"}`}
                  aria-pressed={!w.minimized}
                  onClick={() => restore(w.id)}
                >
                  {apps.find((app) => app.id === w.id)?.name}
                  {w.minimized ? " · 최소화" : ""}
                </button>
              ))}
            </nav>
          </>
        )}
        {loaded && device === "mobile" && (
          <>
            <div className="mobile-workspace">
              {mobileTab === "home" &&
                (MobileApp ? (
                  <section
                    className="app-window mobile-app"
                    aria-label={`${mobileVisible?.id} 앱`}
                  >
                    <header className="window-title">
                      <span>
                        {apps.find((app) => app.id === mobileVisible?.id)?.name}
                      </span>
                      <button
                        onClick={() => {
                          change((items) =>
                            items.filter((item) => item.id !== mobileApp),
                          );
                          save();
                          setMobileApp(null);
                        }}
                        aria-label="앱 닫기"
                      >
                        ×
                      </button>
                    </header>
                    <div className="app-body">
                      <MobileApp notify={notify} persistent={!preview} />
                    </div>
                  </section>
                ) : (
                  <div className="mobile-home">
                    <h2>Workspace</h2>
                    <p>앱을 선택해 작업을 이어가세요.</p>
                    {windows.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => {
                          setMobileApp(w.id);
                          if (w.minimized) restore(w.id);
                        }}
                      >
                        {apps.find((app) => app.id === w.id)?.name} 열기
                      </button>
                    ))}
                    <button onClick={() => setMobileTab("apps")}>
                      전체 앱 보기
                    </button>
                  </div>
                ))}
              {mobileTab === "apps" && (
                <div className="mobile-home">
                  <h2>Apps</h2>
                  {apps.map((app) => (
                    <button key={app.id} onClick={() => open(app.id)}>
                      {app.name} 열기
                    </button>
                  ))}
                  <Link href="/admin">Admin ↗</Link>
                </div>
              )}
              {mobileTab === "search" && (
                <div className="mobile-home">
                  <h2>Search</h2>
                  <input
                    aria-label="명령 검색"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="앱 또는 명령 검색…"
                  />
                  {matches.length === 0 && <p>검색 결과가 없습니다.</p>}
                  {matches.map((command) => (
                    <button
                      key={command.id}
                      onClick={() => runCommand(command)}
                    >
                      {command.label}
                    </button>
                  ))}
                </div>
              )}
              {mobileTab === "notifications" && (
                <div className="mobile-home">
                  <h2>Notifications</h2>
                  {notificationList}
                </div>
              )}
              {mobileTab === "settings" && (
                <div className="mobile-home">
                  <h2>Settings</h2>
                  <p>이 기기의 앱 배치를 초기화합니다.</p>
                  <button
                    onClick={() => {
                      reset();
                      setMobileApp(null);
                    }}
                  >
                    배치 초기화
                  </button>
                </div>
              )}
            </div>
            <nav
              className="mobile-workspace-nav"
              aria-label="모바일 Workspace 메뉴"
            >
              {(
                ["home", "apps", "search", "notifications", "settings"] as const
              ).map((tab) => (
                <button
                  key={tab}
                  aria-current={mobileTab === tab ? "page" : undefined}
                  onClick={() => setMobileTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </>
        )}
        {layoutError && loaded && <p role="alert">{layoutError}</p>}
        <div role="status" className="notice">
          {notice}
        </div>
        {palette && (
          <div className="palette" onClick={() => setPalette(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label="명령 팔레트"
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
              <span className="meta">COMMAND / WORKSPACE</span>
              <input
                ref={searchRef}
                aria-label="명령 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="앱 또는 명령 검색…"
              />
              {matches.length === 0 && <p>검색 결과가 없습니다.</p>}
              {matches.map((command) => (
                <button key={command.id} onClick={() => runCommand(command)}>
                  {command.label} →
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
