from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.document import Document, DocumentVersion
from app.models.user import User
from app.services.ai_mock import generate_document

DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "demopass1234"

DEMO_DOCS = [
    ("해커톤 발표용 서비스 PRD", "PRD", "AI로 기술 문서를 자동 생성하고 관리하는 서비스를 만들고 싶어"),
    ("회원 API 명세", "API_DOC", "로그인/회원가입/문서 CRUD를 제공하는 REST API"),
    ("프론트엔드 개발자 이력서", "RESUME", "3년차 프론트엔드 개발자 경력을 정리하고 싶어"),
]


def seed_demo_account(db: Session) -> None:
    user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if user is not None:
        return

    user = User(email=DEMO_EMAIL, hashed_password=hash_password(DEMO_PASSWORD))
    db.add(user)
    db.flush()

    for title, doc_type, prompt in DEMO_DOCS:
        content = generate_document(doc_type, title, prompt)
        document = Document(owner_id=user.id, doc_type=doc_type, title=title)
        db.add(document)
        db.flush()
        db.add(DocumentVersion(document_id=document.id, version_no=1, content=content, note="데모 데이터"))

    db.commit()
