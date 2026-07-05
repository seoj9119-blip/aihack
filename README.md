# Frontend (Next.js)

## Node.js

이 머신에는 Homebrew 없이 `~/.local/node`에 Node.js 20을 설치해뒀습니다. 셸에 PATH가 없다면:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
```

## 실행

```bash
cd frontend
npm install
cp .env.local.example .env.local   # 백엔드 API 주소 설정
npm run dev
```

`/studies` 화면("스터디 목록")은 `src/lib/api.ts`를 통해서만 백엔드 API를 호출합니다.
데이터베이스에 직접 접근하는 코드는 이 계층에 두지 않습니다.
