"use client";
import { useEffect, useRef, useState } from "react";
import { embedUrl, playbackError, type MusicSource } from "./source";
import { loadYouTube, type YouTubePlayer } from "./youtube";

export default function Player({ source }: { source: MusicSource }) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState(-1);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [volume, setVolume] = useState(70);
  const [position, setPosition] = useState("");
  const [currentUrl, setCurrentUrl] = useState(source.url);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let disposed = false;
    let instance: YouTubePlayer | undefined;
    const container = host.current!;
    setReady(false);
    setState(-1);
    setError("");
    setHint("");
    setPosition("");
    setCurrentUrl(source.url);
    const timeout = window.setTimeout(() => {
      if (!disposed)
        setError(
          "플레이어 연결이 지연되고 있습니다. 다시 시도하거나 YouTube에서 열어 주세요.",
        );
    }, 20000);
    loadYouTube()
      .then((api) => {
        if (disposed) return;
        const iframe = document.createElement("iframe");
        iframe.src = embedUrl(source, window.location.origin);
        iframe.title = "YouTube 음악 플레이어";
        iframe.allow =
          "autoplay; encrypted-media; picture-in-picture; fullscreen";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        container.replaceChildren(iframe);
        instance = new api.Player(iframe, {
          events: {
            onReady: (event) => {
              if (disposed) return;
              clearTimeout(timeout);
              player.current = event.target;
              event.target.setVolume(70);
              setVolume(70);
              setReady(true);
              setError("");
            },
            onStateChange: (event) => {
              if (disposed) return;
              setState(event.data);
              if (event.data === 1) {
                setError("");
                setHint("");
              }
              const list = event.target.getPlaylist();
              const index = event.target.getPlaylistIndex();
              setPosition(
                list?.length && index >= 0
                  ? `${index + 1} / ${list.length}곡`
                  : "",
              );
              const url = event.target.getVideoUrl();
              if (url?.startsWith("https://www.youtube.com/"))
                setCurrentUrl(url);
            },
            onError: (event) => {
              if (!disposed) {
                clearTimeout(timeout);
                setError(playbackError(event.data));
                setState(-1);
              }
            },
            onAutoplayBlocked: () => {
              if (!disposed)
                setHint(
                  "브라우저가 자동 재생을 차단했습니다. 영상 안의 재생 버튼을 눌러 주세요.",
                );
            },
          },
        });
      })
      .catch((reason: unknown) => {
        if (!disposed) {
          clearTimeout(timeout);
          setError(
            reason instanceof Error ? reason.message : "YouTube 연결 실패",
          );
        }
      });
    const pauseHidden = () => {
      if (document.hidden) player.current?.pauseVideo();
    };
    document.addEventListener("visibilitychange", pauseHidden);
    // Keep the external volume UI synchronized with the native YouTube controls.
    const poll = window.setInterval(() => {
      const active = player.current;
      if (active)
        setVolume(active.isMuted() ? 0 : Math.round(active.getVolume()));
    }, 1000);
    return () => {
      disposed = true;
      clearTimeout(timeout);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", pauseHidden);
      player.current = null;
      instance?.destroy();
      container.replaceChildren();
    };
  }, [source, retry]);
  return (
    <>
      <div className="music-player" ref={host} />
      <div className="music-status" role="status">
        {error ||
          hint ||
          (!ready
            ? "YouTube 연결 중…"
            : state === 1
              ? "재생 중"
              : state === 2
                ? "일시정지"
                : state === 3
                  ? "버퍼링…"
                  : state === 0
                    ? "재생 완료"
                    : "재생 버튼을 눌러 시작하세요")}
        {position && <span>{position}</span>}
      </div>
      {error && (
        <button onClick={() => setRetry((n) => n + 1)}>연결 다시 시도</button>
      )}
      <div className="music-controls">
        <button
          disabled={!ready || !source.playlistId}
          aria-label="이전 곡"
          onClick={() => player.current?.previousVideo()}
        >
          이전
        </button>
        <button
          disabled={!ready}
          onClick={() =>
            state === 1
              ? player.current?.pauseVideo()
              : player.current?.playVideo()
          }
        >
          {state === 1 ? "일시정지" : "재생"}
        </button>
        <button
          disabled={!ready || !source.playlistId}
          aria-label="다음 곡"
          onClick={() => player.current?.nextVideo()}
        >
          다음
        </button>
        <label className="music-volume">
          볼륨 {volume}%
          <input
            aria-label="음악 볼륨"
            type="range"
            min="0"
            max="100"
            value={volume}
            disabled={!ready}
            onChange={(e) => {
              const value = Number(e.target.value);
              setVolume(value);
              player.current?.unMute();
              player.current?.setVolume(value);
            }}
          />
        </label>
      </div>
      <a
        className="text-link"
        href={currentUrl}
        target="_blank"
        rel="noreferrer"
      >
        YouTube에서 현재 곡 열기 ↗
      </a>
    </>
  );
}
