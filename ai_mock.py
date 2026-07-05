"""AI 연동 목업.

실제 LLM(API 키 필요)으로 교체하려면 이 두 함수(generate_document, chat_edit_document)의
구현부만 실제 API 호출로 바꾸면 된다. 나머지 계층(엔드포인트, DB 저장)은 그대로 재사용 가능.
"""

TEMPLATES = {
    "PRD": [
        "## 개요",
        "## 배경 및 목표",
        "## 사용자 스토리",
        "## 기능 요구사항",
        "## 비기능 요구사항",
        "## 마일스톤",
    ],
    "SRS": [
        "## 시스템 개요",
        "## 범위",
        "## 기능 명세",
        "## 인터페이스 요구사항",
        "## 제약사항",
    ],
    "API_DOC": [
        "## API 개요",
        "## 인증",
        "## 엔드포인트 목록",
        "## 요청/응답 예시",
        "## 에러 코드",
    ],
    "TEST_CASE": [
        "## 테스트 범위",
        "## 테스트 케이스 목록",
        "## 사전 조건",
        "## 기대 결과",
    ],
    "USER_MANUAL": [
        "## 시작하기",
        "## 주요 기능 사용법",
        "## 자주 묻는 질문",
        "## 문의처",
    ],
    "COVER_LETTER": [
        "## 성장 과정",
        "## 성격의 장단점",
        "## 지원 동기",
        "## 입사 후 포부",
    ],
    "RESUME": [
        "## 기본 정보",
        "## 학력 사항",
        "## 경력 사항",
        "## 보유 기술 및 역량",
        "## 자격증 및 수상 내역",
    ],
}

DEFAULT_SECTIONS = ["## 개요", "## 상세 내용", "## 정리"]


def generate_document(doc_type: str, title: str, prompt: str) -> str:
    sections = TEMPLATES.get(doc_type, DEFAULT_SECTIONS)
    body = "\n\n".join(f"{section}\n\n_(AI 목업: '{prompt}' 내용을 바탕으로 자동 작성 예정)_" for section in sections)
    return f"# {title}\n\n> 아래 내용은 입력하신 요구사항을 바탕으로 생성된 초안입니다.\n>\n> 원본 입력: {prompt}\n\n{body}\n"


def chat_edit_document(content: str, instruction: str) -> tuple[str, str]:
    reply = f"'{instruction}' 요청을 반영해 문서에 섹션을 추가했습니다. (AI 목업 응답)"
    addition = (
        f"\n\n## AI 반영 사항: {instruction}\n\n"
        f"_(AI 목업: 실제 LLM 연동 시 이 부분이 '{instruction}' 요청에 맞춰 자동 작성됩니다.)_\n"
    )
    return content + addition, reply
