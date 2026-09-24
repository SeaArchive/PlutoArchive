export interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  previousVideo(): void;
  nextVideo(): void;
  setVolume(volume: number): void;
  getVolume(): number;
  isMuted(): boolean;
  unMute(): void;
  getPlaylist(): string[] | undefined;
  getPlaylistIndex(): number;
  getVideoUrl(): string;
  getIframe(): HTMLIFrameElement;
  destroy(): void;
}
interface PlayerEvent {
  target: YouTubePlayer;
  data: number;
}
interface YouTubeAPI {
  Player: new (
    element: HTMLIFrameElement,
    options: {
      events: {
        onReady(event: PlayerEvent): void;
        onStateChange(event: PlayerEvent): void;
        onError(event: PlayerEvent): void;
        onAutoplayBlocked(): void;
      };
    },
  ) => YouTubePlayer;
}
declare global {
  interface Window {
    YT?: YouTubeAPI;
    onYouTubeIframeAPIReady?: () => void;
  }
}
let loading: Promise<YouTubeAPI> | undefined;
export function loadYouTube(): Promise<YouTubeAPI> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (loading) return loading;
  loading = new Promise<YouTubeAPI>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    const script = document.createElement("script");
    let done = false;
    const finish = (error?: Error) => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      window.onYouTubeIframeAPIReady = previous;
      script.onerror = null;
      if (error) {
        script.remove();
        reject(error);
      } else resolve(window.YT!);
    };
    const timeout = window.setTimeout(
      () =>
        finish(
          new Error(
            "YouTube 연결 시간이 초과됐습니다. 네트워크를 확인하고 다시 시도해 주세요.",
          ),
        ),
      15000,
    );
    window.onYouTubeIframeAPIReady = () => {
      if (window.YT?.Player) finish();
      else finish(new Error("YouTube 플레이어를 불러오지 못했습니다."));
      previous?.();
    };
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () =>
      finish(
        new Error(
          "YouTube에 연결할 수 없습니다. 네트워크나 콘텐츠 차단 설정을 확인해 주세요.",
        ),
      );
    document.head.append(script);
  }).catch((error: unknown) => {
    loading = undefined;
    throw error;
  });
  return loading;
}
