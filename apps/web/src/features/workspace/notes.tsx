"use client";
import { useState } from "react";
export default function Notes() {
  const [notes, setNotes] = useState([{ id: "first", text: "" }]);
  return (
    <>
      <button
        onClick={() =>
          setNotes([...notes, { id: crypto.randomUUID(), text: "" }])
        }
      >
        + 새 메모
      </button>
      {notes.map((note, index) => (
        <div key={note.id} style={{ marginTop: 20 }}>
          <label className="meta" htmlFor={note.id}>
            NOTE / {String(index + 1).padStart(2, "0")}
          </label>
          <textarea
            id={note.id}
            value={note.text}
            placeholder="생각이 떠오르면, 여기에."
            onChange={(e) =>
              setNotes(
                notes.map((n) =>
                  n.id === note.id ? { ...n, text: e.target.value } : n,
                ),
              )
            }
          />
          <button
            onClick={() => setNotes(notes.filter((n) => n.id !== note.id))}
          >
            메모 삭제
          </button>
        </div>
      ))}
    </>
  );
}
