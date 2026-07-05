const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type PresetDocType = "PRD" | "SRS" | "API_DOC" | "TEST_CASE" | "USER_MANUAL" | "COVER_LETTER" | "RESUME";

// doc_type은 프리셋 코드이거나, 사용자가 직접 입력한 임의의 문서 유형 문자열이다.
export type DocType = PresetDocType | (string & {});

export type Document = {
  id: number;
  title: string;
  doc_type: DocType;
  created_at: string;
  updated_at: string;
};

export type DocumentDetail = Document & {
  latest_content: string;
  version_count: number;
};

export type Version = {
  id: number;
  version_no: number;
  content: string;
  note: string | null;
  created_at: string;
};

function baseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL 환경 변수가 설정되지 않았습니다.");
  }
  return API_BASE_URL;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl()}${path}`, { ...options, headers, cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `요청 실패: ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

export function register(email: string, password: string) {
  return request<{ id: number; email: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export const DEMO_CREDENTIALS = { email: "demo@example.com", password: "demopass1234" };

export function login(email: string, password: string) {
  return request<{ access_token: string; token_type: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function listDocuments(token: string) {
  return request<Document[]>("/api/documents", {}, token);
}

export function createDocument(token: string, title: string, docType: DocType, prompt: string) {
  return request<DocumentDetail>(
    "/api/documents",
    { method: "POST", body: JSON.stringify({ title, doc_type: docType, prompt }) },
    token,
  );
}

export function getDocument(token: string, id: number) {
  return request<DocumentDetail>(`/api/documents/${id}`, {}, token);
}

export function listVersions(token: string, id: number) {
  return request<Version[]>(`/api/documents/${id}/versions`, {}, token);
}

export function deleteDocument(token: string, id: number) {
  return request<void>(`/api/documents/${id}`, { method: "DELETE" }, token);
}

export function updateDocument(token: string, id: number, content: string, note?: string) {
  return request<Version>(
    `/api/documents/${id}`,
    { method: "PUT", body: JSON.stringify({ content, note }) },
    token,
  );
}

export function chatEdit(token: string, id: number, instruction: string) {
  return request<{ reply: string; version: Version }>(
    `/api/documents/${id}/chat`,
    { method: "POST", body: JSON.stringify({ instruction }) },
    token,
  );
}

export type ExportFormat = "pdf" | "docx";

export async function exportDocument(token: string, id: number, format: ExportFormat, title: string) {
  const res = await fetch(`${baseUrl()}/api/documents/${id}/export?format=${format}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `내보내기 실패: ${res.status}`);
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${title}.${format}`;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
