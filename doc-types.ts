import type { PresetDocType } from "@/lib/api";

export const DOC_TYPE_LABELS: Record<PresetDocType, string> = {
  PRD: "PRD",
  SRS: "SRS",
  API_DOC: "API 문서",
  TEST_CASE: "테스트 케이스",
  USER_MANUAL: "사용자 매뉴얼",
  COVER_LETTER: "자기소개서",
  RESUME: "이력서",
};

export const CUSTOM_DOC_TYPE_OPTION = "__custom__";

export function docTypeLabel(docType: string): string {
  return DOC_TYPE_LABELS[docType as PresetDocType] ?? docType;
}

const DOC_TYPE_ICONS: Record<PresetDocType, string> = {
  PRD: "🧭",
  SRS: "📐",
  API_DOC: "🔌",
  TEST_CASE: "✅",
  USER_MANUAL: "📘",
  COVER_LETTER: "✉️",
  RESUME: "📄",
};

export function docTypeIcon(docType: string): string {
  return DOC_TYPE_ICONS[docType as PresetDocType] ?? "📝";
}
