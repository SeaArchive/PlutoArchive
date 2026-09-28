"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Artwork = { id: string; title: string; description: string; created_at: string };
type Category = { id: string; name: string; slug: string };
type Assignment = { content_id: string; category_id: string };
export function ArtworkManager({ works, featuredId, categories, assignments }: {
  works: Artwork[]; featuredId: string | null;
  categories: Category[]; assignments: Assignment[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function send(url: string, method: string, body?: object) {
    const response = await fetch(url, {
      method, headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const result: { error?: string; imageCleanupFailed?: boolean } = await response.json();
    if (!response.ok) throw new Error(result.error || "변경하지 못했습니다.");
    router.refresh();
    return result;
  }

  async function save(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setBusy(id); setMessage("");
    try {
      await send(`/api/admin/artworks/${id}`, "PATCH", {
        title: fields.get("title"), description: fields.get("description"),
      });
      setEditing(null); setMessage("작품 정보를 수정했습니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "수정에 실패했습니다."); }
    finally { setBusy(null); }
  }

  async function feature(id: string) {
    setBusy(id); setMessage("");
    try { await send("/api/admin/featured", "PUT", { id }); setMessage("메인 작품을 변경했습니다."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "변경에 실패했습니다."); }
    finally { setBusy(null); }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = new FormData(form).get("name");
    setBusy("category"); setMessage("");
    try { await send("/api/admin/categories", "POST", { name }); form.reset(); setMessage("분류를 만들었습니다."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "분류를 만들지 못했습니다."); }
    finally { setBusy(null); }
  }

  async function assignCategory(id: string, categoryId: string) {
    setBusy(id); setMessage("");
    try {
      await send(`/api/admin/artworks/${id}/category`, "PUT", { categoryId: categoryId || null });
      setMessage("작품 분류를 변경했습니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "분류를 변경하지 못했습니다."); }
    finally { setBusy(null); }
  }

  async function remove(artwork: Artwork) {
    if (!window.confirm(`‘${artwork.title}’ 작품을 삭제할까요? 공개 목록에서 제거됩니다.`)) return;
    setBusy(artwork.id); setMessage("");
    try {
      const result = await send(`/api/admin/artworks/${artwork.id}`, "DELETE");
      setEditing(null);
      setMessage(result.imageCleanupFailed
        ? "목록에서 삭제했지만 이미지 파일은 남았습니다. Storage에서 확인해 주세요."
        : "작품을 삭제했습니다.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "삭제에 실패했습니다."); }
    finally { setBusy(null); }
  }

  return (
    <section aria-label="작품 관리">
      <p role="status" aria-live="polite">{message}</p>
      <form className="admin-category-form" onSubmit={createCategory}>
        <label htmlFor="new-category">새 작품 분류</label>
        <input id="new-category" name="name" maxLength={120} required disabled={busy !== null}
          placeholder="예: 캐릭터 디자인" />
        <button type="submit" disabled={busy !== null}>분류 만들기</button>
      </form>
      <div className="admin-artworks">
        {works.map((work) => {
          const assignedId = assignments.find((item) => item.content_id === work.id)?.category_id || "";
          return (
          <article className="admin-artwork" key={work.id}>
            <div className="admin-artwork-heading">
              <div><h3>{work.title}</h3><span className="meta">{work.created_at.slice(0, 10)}</span>
                {work.id === featuredId && <strong className="admin-featured">메인 노출 중</strong>}
              </div>
              <Link href={`/works/${work.id}`}>공개 화면 ↗</Link>
            </div>
            {editing === work.id ? (
              <form className="admin-edit-form" onSubmit={(event) => save(event, work.id)}>
                <label htmlFor={`title-${work.id}`}>작품 제목</label>
                <input id={`title-${work.id}`} name="title" defaultValue={work.title}
                  maxLength={200} required disabled={busy !== null} />
                <label htmlFor={`description-${work.id}`}>설명</label>
                <textarea id={`description-${work.id}`} name="description"
                  defaultValue={work.description} maxLength={5000} rows={4} disabled={busy !== null} />
                <div className="admin-artwork-actions">
                  <button type="submit" disabled={busy !== null}>저장</button>
                  <button type="button" disabled={busy !== null} onClick={() => setEditing(null)}>취소</button>
                </div>
              </form>
            ) : <p>{work.description || "설명 없음"}</p>}
            <label className="admin-category-select" htmlFor={`category-${work.id}`}>작품 분류
              <select id={`category-${work.id}`} key={assignedId} defaultValue={assignedId}
                disabled={busy !== null} onChange={(event) => assignCategory(work.id, event.target.value)}>
                <option value="">미분류</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <div className="admin-artwork-actions">
              <button type="button" onClick={() => setEditing(work.id)} disabled={busy !== null || editing === work.id}>수정</button>
              <button type="button" onClick={() => feature(work.id)} disabled={busy !== null || work.id === featuredId}>메인에 지정</button>
              <button type="button" onClick={() => remove(work)} disabled={busy !== null}>삭제</button>
            </div>
          </article>
        ); })}
      </div>
      {!works.length && <p>등록된 작품이 없습니다.</p>}
    </section>
  );
}
