"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { createDocument, deleteDocument, listDocuments, type DocType, type Document } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { CUSTOM_DOC_TYPE_OPTION as CUSTOM_OPTION, DOC_TYPE_LABELS, docTypeIcon, docTypeLabel } from "@/lib/doc-types";
import { Spinner } from "@/components/spinner";
import { useToast } from "@/lib/toast-context";

export default function DocumentsPage() {
  const router = useRouter();
  const { token, ready, logout } = useAuth();
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [docTypeSelect, setDocTypeSelect] = useState<string>("PRD");
  const [customDocType, setCustomDocType] = useState("");
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.push("/login");
      return;
    }
    listDocuments(token)
      .then(setDocuments)
      .catch((err) => setError(err instanceof Error ? err.message : "목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [ready, token, router]);

  const stats = useMemo(() => {
    const byType = new Map<string, number>();
    for (const doc of documents) {
      byType.set(doc.doc_type, (byType.get(doc.doc_type) ?? 0) + 1);
    }
    const topType = [...byType.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      total: documents.length,
      typeCount: byType.size,
      topType: topType ? docTypeLabel(topType[0]) : "-",
    };
  }, [documents]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    const docType: DocType =
      docTypeSelect === CUSTOM_OPTION ? customDocType.trim() : (docTypeSelect as DocType);
    if (!docType) {
      setError("만들고 싶은 문서 유형을 입력해 주세요.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const created = await createDocument(token, title, docType, prompt);
      showToast("AI 초안이 생성되었습니다.");
      router.push(`/documents/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "문서 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(doc: Document) {
    if (!token) return;
    if (!window.confirm(`"${doc.title}" 문서를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;

    setDeletingId(doc.id);
    try {
      await deleteDocument(token, doc.id);
      setDocuments((list) => list.filter((d) => d.id !== doc.id));
      showToast("문서를 삭제했습니다.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "삭제에 실패했습니다.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  if (!ready || loading) {
    return (
      <main className="page">
        <Spinner label="불러오는 중..." />
      </main>
    );
  }

  return (
    <main className="page">
      <div className="row-between">
        <div>
          <h1>내 문서</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            AI로 초안을 만들고 채팅으로 다듬어 보세요
          </p>
        </div>
        <button className="secondary" onClick={logout}>
          로그아웃
        </button>
      </div>

      {documents.length > 0 && (
        <div className="stats-bar">
          <div className="stat-pill">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">전체 문서</div>
          </div>
          <div className="stat-pill">
            <div className="stat-value">{stats.typeCount}</div>
            <div className="stat-label">사용 중인 유형</div>
          </div>
          <div className="stat-pill">
            <div className="stat-value">{stats.topType}</div>
            <div className="stat-label">가장 많이 쓴 유형</div>
          </div>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <section className="card" style={{ marginBottom: 28 }}>
        <h2>새 문서 생성 (AI 초안)</h2>
        <form onSubmit={handleCreate} className="form">
          <input placeholder="문서 제목" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <select value={docTypeSelect} onChange={(e) => setDocTypeSelect(e.target.value)}>
            {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
            <option value={CUSTOM_OPTION}>기타 (직접 입력)</option>
          </select>
          {docTypeSelect === CUSTOM_OPTION && (
            <input
              placeholder="예: 여행 계획서, 제안서, 회의록 등 원하는 문서 유형을 입력하세요"
              value={customDocType}
              onChange={(e) => setCustomDocType(e.target.value)}
              required
            />
          )}
          <textarea
            placeholder="어떤 문서를 만들고 싶은지 설명해 주세요"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            required
          />
          <button type="submit" disabled={creating}>
            {creating ? "생성 중..." : "AI로 초안 생성"}
          </button>
        </form>
      </section>

      {documents.length === 0 ? (
        <div className="empty-state">아직 생성한 문서가 없습니다. 위에서 첫 문서를 만들어 보세요.</div>
      ) : (
        <ul className="doc-list">
          {documents.map((doc) => (
            <li key={doc.id} className="doc-list-item">
              <div className="doc-card-top">
                <Link href={`/documents/${doc.id}`} style={{ flex: 1 }}>
                  <span>
                    <span className="doc-type-icon">{docTypeIcon(doc.doc_type)}</span>
                    <strong>{doc.title}</strong>
                  </span>
                  <span className="badge">{docTypeLabel(doc.doc_type)}</span>
                </Link>
                <div className="doc-card-actions">
                  <button
                    className="secondary"
                    disabled={deletingId === doc.id}
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(doc);
                    }}
                  >
                    {deletingId === doc.id ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
