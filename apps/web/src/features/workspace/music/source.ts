export type MusicSource = {
  videoId?: string;
  playlistId?: string;
  url: string;
};
const videoPattern = /^[A-Za-z0-9_-]{11}$/;
const playlistPattern = /^[A-Za-z0-9_-]{10,150}$/;

/** Accept only supported YouTube URLs; never embed user-supplied HTML or origins. */
export function parseMusicSource(input: string): MusicSource | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return null;
    const host = url.hostname;
    if (
      ![
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "music.youtube.com",
        "youtu.be",
      ].includes(host)
    )
      return null;
    const parts = url.pathname.split("/").filter(Boolean);
    let videoId: string | undefined;
    if (host === "youtu.be" && parts.length === 1) videoId = parts[0];
    else if (url.pathname === "/watch")
      videoId = url.searchParams.get("v") || undefined;
    else if (
      ["shorts", "live", "embed"].includes(parts[0]) &&
      parts.length === 2
    )
      videoId = parts[1];
    else if (url.pathname !== "/playlist") return null;
    const playlistId = url.searchParams.get("list") || undefined;
    if (
      (videoId && !videoPattern.test(videoId)) ||
      (playlistId && !playlistPattern.test(playlistId))
    )
      return null;
    if (!videoId && !playlistId) return null;
    const canonical = new URL(
      videoId
        ? "https://www.youtube.com/watch"
        : "https://www.youtube.com/playlist",
    );
    if (videoId) canonical.searchParams.set("v", videoId);
    if (playlistId) canonical.searchParams.set("list", playlistId);
    return { videoId, playlistId, url: canonical.toString() };
  } catch {
    return null;
  }
}

export function embedUrl(source: MusicSource, origin: string): string {
  const url = new URL(
    `https://www.youtube.com/embed/${source.videoId || "videoseries"}`,
  );
  url.searchParams.set("enablejsapi", "1");
  url.searchParams.set("origin", origin);
  url.searchParams.set("playsinline", "1");
  url.searchParams.set("autoplay", "0");
  if (source.playlistId) url.searchParams.set("list", source.playlistId);
  return url.toString();
}

export function playbackError(code: number): string {
  if (code === 100)
    return "삭제되었거나 비공개인 콘텐츠입니다. 다른 링크를 입력해 주세요.";
  if (code === 101 || code === 150)
    return "이 콘텐츠는 외부 재생이 제한되어 있습니다. YouTube에서 열어 주세요.";
  if (code === 153)
    return "YouTube가 재생 환경을 확인하지 못했습니다. 브라우저의 리퍼러 설정을 확인하거나 YouTube에서 열어 주세요.";
  if (code === 2) return "유효하지 않은 영상입니다. 링크를 다시 확인해 주세요.";
  return "재생할 수 없습니다. 다시 시도하거나 YouTube에서 열어 주세요.";
}
