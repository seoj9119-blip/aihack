from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class DocumentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    doc_type: str = Field(min_length=1, max_length=50)
    prompt: str = Field(min_length=1)


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    doc_type: str
    created_at: datetime
    updated_at: datetime


class VersionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    version_no: int
    content: str
    note: Optional[str] = None
    created_at: datetime


class DocumentDetail(DocumentOut):
    latest_content: str
    version_count: int


class DocumentUpdate(BaseModel):
    content: str
    note: Optional[str] = None


class ChatEditRequest(BaseModel):
    instruction: str


class ChatEditResponse(BaseModel):
    reply: str
    version: VersionOut
