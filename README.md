# 문서 질의응답과 스터디 관리 서비스

3-tier 구조: `frontend`(화면) → `backend`(로직/API) → PostgreSQL(저장소).
화면은 백엔드 API로만 데이터를 가져오며, DB 접근은 backend 계층에서만 이뤄집니다.

## 전체 실행 순서

```bash
# 0) PATH (이 머신은 Homebrew 없이 홈 디렉터리에 Node/PostgreSQL을 설치함)
export PATH="$HOME/.local/node/bin:$PATH"

# 1) DB
./scripts/db-start.sh

# 2) 백엔드
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000 &
cd ..

# 3) 프론트엔드
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

`http://localhost:3000/studies`에서 "스터디 목록" 화면을 확인할 수 있습니다.

## 종료

```bash
./scripts/db-stop.sh
```

세부 사항은 [backend/README.md](backend/README.md), [frontend/README.md](frontend/README.md) 참고.
