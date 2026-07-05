"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DEMO_CREDENTIALS, login } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const FEATURES = [
  { icon: "✨", title: "AI 문서 초안 생성", desc: "PRD, SRS, API 문서, 이력서, 자기소개서까지 몇 초 만에 초안 작성" },
  { icon: "💬", title: "채팅으로 다듬기", desc: "\"보안 요구사항 추가해줘\" 처럼 대화하듯 문서를 수정" },
  { icon: "🕘", title: "버전 이력 관리", desc: "모든 수정 사항이 버전으로 저장되어 언제든 되돌리기 가능" },
  { icon: "📤", title: "PDF / DOCX 내보내기", desc: "완성된 문서를 바로 파일로 내려받아 공유" },
];

export default function LandingPage() {
  const router = useRouter();
  const { token, setToken } = useAuth();
  const [tryingDemo, setTryingDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTryDemo() {
    setTryingDemo(true);
    setError(null);
    try {
      const { access_token } = await login(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password);
      setToken(access_token);
      router.push("/documents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "데모 로그인에 실패했습니다.");
    } finally {
      setTryingDemo(false);
    }
  }

  return (
    <main className="page page-wide landing">
      <section className="hero">
        <span className="badge">AI 문서 스튜디오</span>
        <h1 className="hero-title">문서 작성, AI에게 맡기고 채팅으로 다듬으세요</h1>
        <p className="hero-subtitle">
          PRD·SRS·API 문서부터 이력서·자기소개서까지 — 몇 문장만 입력하면 AI가 초안을 만들고,
          채팅으로 요청하면 바로 반영됩니다.
        </p>
        <div className="hero-actions">
          <button onClick={handleTryDemo} disabled={tryingDemo}>
            {tryingDemo ? "접속 중..." : "데모 계정으로 바로 체험하기"}
          </button>
          {token ? (
            <Link href="/documents" className="secondary-link">
              내 문서로 이동 →
            </Link>
          ) : (
            <>
              <Link href="/login" className="secondary-link">
                로그인
              </Link>
              <Link href="/register" className="secondary-link">
                회원가입
              </Link>
            </>
          )}
        </div>
        {error && <p className="error-text">{error}</p>}
      </section>

      <section className="feature-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h2>{f.title}</h2>
            <p className="muted">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
