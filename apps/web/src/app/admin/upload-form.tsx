"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";

export function ArtworkUploadForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    setBusy(true);
    setMessage("");
    setCreatedId(null);
    try {
      const response = await fetch("/api/admin/artworks", {
        method: "POST",
        body: new FormData(form),
      });
      const result: { id?: string; error?: string } = await response.json();
      if (!response.ok || !result.id) {
        setMessage(result.error || "작품을 올리지 못했습니다.");
        return;
      }
      form.reset();
      setCreatedId(result.id);
      setMessage("작품을 게시했습니다. 목록과 서버 공개 페이지에 반영됩니다.");
      router.refresh();
    } catch {
      setMessage("연결에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-upload" aria-labelledby="upload-heading">
      <h2 id="upload-heading">작품 올리기</h2>
      <p>
        이미지와 작품 정보는 저장 즉시 공개됩니다. 비공개 초안은 CMS 게시
        기능에서 제공할 예정입니다.
      </p>
      <form onSubmit={submit} encType="multipart/form-data">
        <label htmlFor="art-title">작품 제목</label>
        <input
          id="art-title"
          name="title"
          required
          maxLength={200}
          disabled={busy}
        />
        <label htmlFor="art-description">설명</label>
        <textarea
          id="art-description"
          name="description"
          maxLength={5000}
          rows={4}
          disabled={busy}
        />
        <label htmlFor="art-image">작품 이미지</label>
        <input
          id="art-image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          required
          disabled={busy}
        />
        <p className="fine">JPG · PNG · GIF · WebP / 최대 6MB</p>
        <button type="submit" disabled={busy}>
          {busy ? "올리는 중…" : "작품 공개하기"}
        </button>
      </form>
      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}
      {createdId && (
        <Link className="text-link" href={`/works/${createdId}`}>
          게시한 작품 보기 ↗
        </Link>
      )}
    </section>
  );
}
