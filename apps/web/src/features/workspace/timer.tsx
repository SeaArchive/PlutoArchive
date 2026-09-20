"use client";
import { useEffect, useState } from "react";
export default function Timer({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [seconds, setSeconds] = useState(1500);
  const [deadline, setDeadline] = useState<number | null>(null);
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (!remaining) {
        setDeadline(null);
        notify("집중 시간이 끝났습니다. 잠시 쉬어 가세요.");
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline, notify]);
  return (
    <>
      <p className="meta">POMODORO / FOCUS SESSION</p>
      <div className="timer-face" role="timer">
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </div>
      <div className="controls">
        <button
          onClick={() =>
            setDeadline(deadline ? null : Date.now() + seconds * 1000)
          }
        >
          {deadline ? "일시 정지" : "시작"}
        </button>
        <button
          onClick={() => {
            setDeadline(null);
            setSeconds(1500);
          }}
        >
          초기화
        </button>
        <button
          onClick={() => {
            setDeadline(null);
            setSeconds(300);
          }}
        >
          5분 휴식
        </button>
      </div>
    </>
  );
}
