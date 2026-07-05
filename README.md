# Backend (FastAPI)

## 로컬 PostgreSQL 기동

이 머신에는 Homebrew 없이 `~/.local/pgsql`에 PostgreSQL 16을, `~/.local/pgdata`에 데이터 디렉터리를 준비해뒀습니다.

```bash
../scripts/db-start.sh   # 기동 + studydb 없으면 생성 (최초 실행 시 initdb도 자동 수행)
../scripts/db-stop.sh    # 정지
```

## 실행

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # 로컬 PostgreSQL 접속 정보로 수정
uvicorn app.main:app --reload --port 8000
```

`python-jose[cryptography]`, `authlib` 설치 시 Rust/OpenSSL/pkg-config가 필요합니다. Homebrew가 있다면 `brew install pkg-config openssl rust`로 준비하세요.

## 엔드포인트

- `GET /api/health` - 헬스체크
- `GET /api/studies` - 스터디 목록 (프론트엔드 "스터디 목록" 화면용)

DB 읽기/쓰기는 이 계층(`app/db`, `app/models`)에서만 수행합니다.
