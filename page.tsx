"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  chatEdit,
  exportDocument,
  getDocument,
  listVersions,
  updateDocument,
  type DocumentDetail,
  type ExportFormat,
  type Version,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { docTypeLabel } from "@/lib/doc-types";
import { Spinner } from "@/components/spinner";
import { useToast } from "@/lib/toast-context";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const documentId = Number(params.id);
  const router = useRouter();
  const { token, ready } = useAuth();
  const { showToast } = useToast();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [instruction, setInstruction] = useState("");
  const [chatting, setChatting] = useState(false);
  const [chatLog, setChatLog] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [view, setView] = useState<"edit" | "preview">("edit");

  async function refresh(currentToken: string) {
    const [detail, versionList] = await Promise.all([
      getDocument(currentToken, documentId),
      listVersions(currentToken, documentId),
    ]);
    setDoc(detail);
    setContent(detail.latest_content);
    setVersions(versionList);
  }

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      router.push("/login");
      return;
    }
    refresh(token)
      .catch((err) => setError(err instanceof Error ? err.message : "문서를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, documentId, router]);

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updateDocument(token, documentId, content, "수동 편집");
      await refresh(token);
      showToast("새 버전으로 저장했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport(format: ExportFormat) {
    if (!token || !doc) return;
    setExportingFormat(format);
    setError(null);
    try {
      await exportDocument(token, documentId, format, doc.title);
      showToast(`${format.toUpperCase()} 파일을 내려받았습니다.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "내보내기에 실패했습니다.");
    } finally {
      setExportingFormat(null);
    }
  }

  async function handleChat(e: FormEvent) {
    e.preventDefault();
    if (!token || !instruction.trim()) return;
    setChatting(true);
    setError(null);
    const userInstruction = instruction;
    setChatLog((log) => [...log, { role: "user", text: userInstruction }]);
    setInstruction("");
    try {
      const { reply, version } = await chatEdit(token, documentId, userInstruction);
      setChatLog((log) => [...log, { role: "ai", text: reply }]);
      setContent(version.content);
      await refresh(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 편집 요청에 실패했습니다.");
    } finally {
      setChatting(false);
    }
  }

  if (!ready || loading) {
    return (
      <main className="page page-wide">
        <Spinner label="불러오는 중..." />
      </main>
    );
  }
  if (!doc) {
    return (
      <main className="page page-wide">
        <p className="error-text">{error ?? "문서를 찾을 수 없습니다."}</p>
      </main>
    );
  }

  return (
    <main className="page page-wide">
      <Link href="/documents" className="back-link">
        ← 내 문서로
      </Link>

      <div className="doc-header">
        <div>
          <h1>{doc.title}</h1>
          <p className="doc-meta">
            <span className="badge">{docTypeLabel(doc.doc_type)}</span>
            <span className="muted">마지막 수정 {formatDateTime(doc.updated_at)}</span>
            <span className="muted">· v{doc.version_count}</span>
          </p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="layout-columns" style={{ marginTop: 20 }}>
        <section className="col-main card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div className="tabs">
              <button
                className={view === "edit" ? "tab active" : "tab"}
                onClick={() => setView("edit")}
                type="button"
              >
                편집
              </button>
              <button
                className={view === "preview" ? "tab active" : "tab"}
                onClick={() => setView("preview")}
                type="button"
              >
                미리보기
              </button>
            </div>
          </div>

          {view === "edit" ? (
            <textarea className="editor-textarea" value={content} onChange={(e) => setContent(e.target.value)} />
          ) : (
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}

          <div className="top-actions">
            <button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장 (새 버전)"}
            </button>
            <button className="secondary" onClick={() => handleExport("pdf")} disabled={exportingFormat !== null}>
              {exportingFormat === "pdf" ? "PDF 생성 중..." : "PDF로 내보내기"}
            </button>
            <button className="secondary" onClick={() => handleExport("docx")} disabled={exportingFormat !== null}>
              {exportingFormat === "docx" ? "DOCX 생성 중..." : "DOCX로 내보내기"}
            </button>
          </div>

          <h2 style={{ marginTop: 28 }}>AI 채팅으로 수정</h2>
          <div className="chat-log">
            {chatLog.length === 0 && <p className="muted">예: &ldquo;보안 요구사항 섹션 추가해줘&rdquo;</p>}
            {chatLog.map((entry, i) => (
              <div key={i} className={`chat-bubble ${entry.role}`}>
                {entry.text}
              </div>
            ))}
          </div>
          <form onSubmit={handleChat} className="chat-form">
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="AI에게 수정 요청하기"
            />
            <button type="submit" disabled={chatting}>
              {chatting ? "요청 중..." : "보내기"}
            </button>
          </form>
        </section>

        <aside className="col-side card">
          <h2>버전 이력 ({doc.version_count})</h2>
          <ul className="version-list">
            {versions.map((v) => (
              <li key={v.id} className="version-item">
                <div>
                  <strong>v{v.version_no}</strong>
                </div>
                <p className="version-note">{v.note}</p>
                <button className="secondary" onClick={() => setContent(v.content)}>
                  이 버전 불러오기
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
