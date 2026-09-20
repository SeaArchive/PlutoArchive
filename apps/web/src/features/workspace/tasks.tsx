"use client";
import { useState } from "react";
export default function Tasks() {
  const [items, setItems] = useState<
    { id: string; title: string; done: boolean }[]
  >([]);
  const [title, setTitle] = useState("");
  return (
    <>
      <form
        className="task-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setItems([
            ...items,
            { id: crypto.randomUUID(), title: title.trim(), done: false },
          ]);
          setTitle("");
        }}
      >
        <input
          aria-label="새 작업"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="다음으로 할 일"
        />
        <button>추가</button>
      </form>
      <ul className="task-list">
        {items.map((item) => (
          <li key={item.id}>
            <input
              type="checkbox"
              aria-label={item.title + " 완료"}
              checked={item.done}
              onChange={() =>
                setItems(
                  items.map((t) =>
                    t.id === item.id ? { ...t, done: !t.done } : t,
                  ),
                )
              }
            />
            <span
              style={{ textDecoration: item.done ? "line-through" : "none" }}
            >
              {item.title}
            </span>
            <button
              aria-label={item.title + " 삭제"}
              onClick={() => setItems(items.filter((t) => t.id !== item.id))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <p>
        {items.filter((t) => t.done).length} / {items.length} 완료
      </p>
    </>
  );
}
