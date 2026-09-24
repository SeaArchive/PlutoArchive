"use client";
import { useEffect, useState } from "react";
import { workspaceRequest } from "./data";

type Task = {
  id: string;
  title: string;
  status: "todo" | "done";
  priority: "low" | "normal" | "high";
  due_date: string | null;
};
export default function Tasks({
  persistent = false,
  notify,
}: {
  persistent?: boolean;
  notify: (message: string) => void;
}) {
  const [items, setItems] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(persistent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "today" | "done">("all");
  useEffect(() => {
    if (!persistent) return;
    const controller = new AbortController();
    workspaceRequest<{ items: Task[] }>(
      "tasks",
      "GET",
      undefined,
      undefined,
      controller.signal,
    )
      .then(({ items }) => {
        if (!controller.signal.aborted) setItems(items);
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
    if (!title.trim()) return;
    setBusy(true);
    try {
      const item = persistent
        ? (
            await workspaceRequest<{ item: Task }>("tasks", "POST", undefined, {
              title,
            })
          ).item
        : {
            id: crypto.randomUUID(),
            title: title.trim(),
            status: "todo" as const,
            priority: "normal" as const,
            due_date: null,
          };
      setItems((values) => [item, ...values]);
      setTitle("");
      setError("");
      notify("작업을 추가했습니다.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function update(
    task: Task,
    patch: Partial<Pick<Task, "status" | "priority" | "due_date">>,
  ) {
    setBusy(true);
    try {
      const saved = persistent
        ? (
            await workspaceRequest<{ item: Task }>(
              "tasks",
              "PATCH",
              task.id,
              patch,
            )
          ).item
        : { ...task, ...patch };
      setItems((values) =>
        values.map((item) => (item.id === task.id ? saved : item)),
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(task: Task) {
    setBusy(true);
    try {
      if (persistent) await workspaceRequest("tasks", "DELETE", task.id);
      setItems((values) => values.filter((item) => item.id !== task.id));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const today = new Date();
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const visible = items.filter(
    (task) =>
      filter === "all" ||
      (filter === "today"
        ? task.due_date === localToday && task.status === "todo"
        : task.status === "done"),
  );
  return (
    <>
      <form
        className="task-form"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <input
          aria-label="새 작업"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="다음으로 할 일"
        />
        <button disabled={loading || busy}>추가</button>
      </form>
      <div className="task-filters" aria-label="작업 필터">
        {(["all", "today", "done"] as const).map((value) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {value === "all" ? "전체" : value === "today" ? "오늘" : "완료"}
          </button>
        ))}
      </div>
      {loading && <p role="status">작업을 불러오는 중…</p>}
      {error && <p role="alert">{error}</p>}
      <ul className="task-list">
        {visible.map((item) => (
          <li key={item.id}>
            <input
              type="checkbox"
              aria-label={item.title + " 완료"}
              checked={item.status === "done"}
              disabled={busy}
              onChange={() =>
                void update(item, {
                  status: item.status === "done" ? "todo" : "done",
                })
              }
            />
            <span
              style={{
                textDecoration:
                  item.status === "done" ? "line-through" : "none",
              }}
            >
              {item.title}
            </span>
            <select
              aria-label={`${item.title} 우선순위`}
              value={item.priority}
              disabled={busy}
              onChange={(e) =>
                void update(item, {
                  priority: e.target.value as Task["priority"],
                })
              }
            >
              <option value="low">낮음</option>
              <option value="normal">보통</option>
              <option value="high">높음</option>
            </select>
            <input
              type="date"
              aria-label={`${item.title} 마감일`}
              value={item.due_date || ""}
              disabled={busy}
              onChange={(e) =>
                void update(item, { due_date: e.target.value || null })
              }
            />
            <button
              aria-label={item.title + " 삭제"}
              disabled={busy}
              onClick={() => void remove(item)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <p>
        {items.filter((t) => t.status === "done").length} / {items.length} 완료
        · {persistent ? "계정에 저장" : "공개 미리보기"}
      </p>
    </>
  );
}
