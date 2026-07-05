from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.document import Document, DocumentVersion
from app.models.user import User
from app.schemas.document import (
    ChatEditRequest,
    ChatEditResponse,
    DocumentCreate,
    DocumentDetail,
    DocumentOut,
    DocumentUpdate,
    VersionOut,
)
from app.services.ai_mock import chat_edit_document, generate_document
from app.services.exporters import markdown_to_docx, markdown_to_pdf

router = APIRouter(prefix="/documents")

EXPORT_MEDIA_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def _get_owned_document(document_id: int, db: Session, user: User) -> Document:
    document = db.get(Document, document_id)
    if document is None or document.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="문서를 찾을 수 없습니다.")
    return document


def _latest_version(document: Document) -> DocumentVersion:
    return document.versions[-1]


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Document).filter(Document.owner_id == user.id).order_by(Document.updated_at.desc()).all()


@router.post("", response_model=DocumentDetail, status_code=status.HTTP_201_CREATED)
def create_document(payload: DocumentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    content = generate_document(payload.doc_type, payload.title, payload.prompt)

    document = Document(owner_id=user.id, doc_type=payload.doc_type, title=payload.title)
    db.add(document)
    db.flush()

    version = DocumentVersion(document_id=document.id, version_no=1, content=content, note="최초 생성")
    db.add(version)
    db.commit()
    db.refresh(document)

    return DocumentDetail(
        **DocumentOut.model_validate(document).model_dump(),
        latest_content=content,
        version_count=1,
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    document = _get_owned_document(document_id, db, user)
    db.delete(document)
    db.commit()


@router.get("/{document_id}", response_model=DocumentDetail)
def get_document(document_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    document = _get_owned_document(document_id, db, user)
    latest = _latest_version(document)
    return DocumentDetail(
        **DocumentOut.model_validate(document).model_dump(),
        latest_content=latest.content,
        version_count=len(document.versions),
    )


@router.get("/{document_id}/versions", response_model=list[VersionOut])
def list_versions(document_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    document = _get_owned_document(document_id, db, user)
    return list(reversed(document.versions))


@router.put("/{document_id}", response_model=VersionOut)
def update_document(
    document_id: int,
    payload: DocumentUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    document = _get_owned_document(document_id, db, user)
    next_no = _latest_version(document).version_no + 1
    version = DocumentVersion(
        document_id=document.id, version_no=next_no, content=payload.content, note=payload.note or "수동 편집"
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


@router.post("/{document_id}/chat", response_model=ChatEditResponse)
def chat_edit(
    document_id: int,
    payload: ChatEditRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    document = _get_owned_document(document_id, db, user)
    latest = _latest_version(document)

    new_content, reply = chat_edit_document(latest.content, payload.instruction)
    version = DocumentVersion(
        document_id=document.id,
        version_no=latest.version_no + 1,
        content=new_content,
        note=f"AI 채팅 편집: {payload.instruction}",
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    return ChatEditResponse(reply=reply, version=version)


@router.get("/{document_id}/export")
def export_document(
    document_id: int,
    format: str = Query(pattern="^(pdf|docx)$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    document = _get_owned_document(document_id, db, user)
    latest = _latest_version(document)

    if format == "pdf":
        file_bytes = markdown_to_pdf(latest.content)
    else:
        file_bytes = markdown_to_docx(latest.content)

    filename = f"{document.title}.{format}"
    encoded_filename = quote(filename)
    return Response(
        content=file_bytes,
        media_type=EXPORT_MEDIA_TYPES[format],
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"},
    )
