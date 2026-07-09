# AGENTS.md

## Project Overview

Dama는 가족의 추억, 인터뷰, 미디어 기록을 저장하고 Gemini 기반 AI 기능으로 가족 페르소나 대화와 다큐멘터리 생성을 지원하는 React 웹 애플리케이션이다.

## Tech Stack

- React
- TypeScript
- Vite
- React Router DOM
- Firebase Auth
- Firebase Firestore
- Tailwind CSS
- Lucide React
- Gemini API

## Used NPM Libraries

### dependencies

- `firebase`
- `lucide-react`
- `react`
- `react-dom`
- `react-router-dom`

### devDependencies

- `@tailwindcss/vite`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `@vitejs/plugin-react`
- `autoprefixer`
- `oxlint`
- `postcss`
- `tailwindcss`
- `typescript`
- `vite`

## Architecture

```txt
src/
  App.tsx                   # 라우팅 및 보호 라우트
  main.tsx                  # React 앱 진입점
  components/               # 공통 UI 컴포넌트
  pages/                    # 주요 화면
  hooks/useMemoryStorage.ts # 앱 상태 및 저장소 연결
  services/firebase.ts      # Firebase 초기화
  services/storage.ts       # localStorage 기반 저장소
  services/gemini.ts        # Gemini API 호출
  utils/file.ts             # 파일 변환, 이미지 압축, IndexedDB
  types/                    # 도메인 타입
```

본 프로젝트는 React, TypeScript, Vite 기반 SPA 구조이며, React Router로 화면을 분리한다. 데이터는 Firebase Auth/Firestore와 localStorage/IndexedDB를 함께 사용해 로그인 사용자와 게스트 사용자를 모두 지원한다. AI 기능은 Gemini API를 REST 방식으로 호출한다.

## Harness Engineering

현재 프로젝트에는 별도의 Unit/E2E 테스트 프레임워크는 없다. 대신 아래 명령과 체크리스트를 기준으로 빌드 가능성, 정적 오류, 배포 장애 원인을 확인한다.

### Validation Commands

```bash
npm run lint
npm run build
```

### Harness Checklist

- `npm run lint`로 정적 검사 통과 여부 확인
- `npm run build`로 TypeScript 컴파일 및 Vite production build 확인
- `VITE_GEMINI_API_KEY` 설정 여부 확인
- `VITE_FIREBASE_API_KEY` 설정 여부 확인
- `VITE_FIREBASE_PROJECT_ID` 설정 여부 확인
- `VITE_FIREBASE_AUTH_DOMAIN` 설정 여부 확인
- Firebase Console Authorized domains에 배포 도메인 등록 여부 확인
- `BrowserRouter` 사용 시 배포 서버의 SPA rewrite 설정 여부 확인
- GitHub Pages 배포 시 `vite.config.ts`의 `base` 설정 여부 확인
- 음성 녹음 기능 사용 시 HTTPS 배포 여부 확인
- IndexedDB/localStorage 저장 용량 문제 여부 확인

## Troubleshooting

### 흰 화면

- `npm run build`가 성공하는지 확인한다.
- GitHub Pages 배포라면 `vite.config.ts`에 `base: '/dama/'` 같은 설정이 필요한지 확인한다.
- 브라우저 개발자 도구 Console/Network에서 `/assets/...` 파일이 404인지 확인한다.

### 직접 URL 접속 또는 새로고침 시 404

- 현재 라우팅은 `BrowserRouter` 기반이다.
- Vercel, Netlify, Firebase Hosting 배포 시 모든 경로를 `index.html`로 보내는 rewrite 설정이 필요하다.
- GitHub Pages에서는 fallback 전략 또는 `HashRouter` 전환을 고려한다.

### 로그인 실패

- Firebase 환경변수가 `VITE_`로 시작하는지 확인한다.
- 배포 플랫폼에 환경변수를 넣은 뒤 재배포했는지 확인한다.
- Firebase Console의 Authorized domains에 배포 도메인이 등록되어 있는지 확인한다.

### AI 기능 실패

- `VITE_GEMINI_API_KEY`가 배포 환경에 등록되어 있는지 확인한다.
- 설정 화면에 직접 넣은 API 키는 해당 브라우저의 localStorage에만 저장된다는 점을 확인한다.
- 환경변수 변경 후에는 반드시 재빌드/재배포해야 한다.
- Gemini API 키는 Google Cloud에서 HTTP referrer 제한을 거는 것이 안전하다.

### 음성 녹음 실패

- `MediaRecorder`와 `getUserMedia`는 HTTPS 또는 localhost에서 동작한다.
- 브라우저 마이크 권한을 허용했는지 확인한다.
- Safari/iOS 등 일부 브라우저의 MediaRecorder 지원 상태를 확인한다.

### 저장소 문제

- 작은 설정/텍스트 데이터는 localStorage를 사용한다.
- 큰 미디어 Blob은 IndexedDB의 `mediaDb`를 사용한다.
- localStorage 용량 초과가 의심되면 미디어 저장 경로와 Base64 저장 여부를 확인한다.

## Documentation Phrase

본 프로젝트는 별도의 Unit/E2E 테스트 하네스는 도입하지 않았지만, `npm run lint`와 `npm run build`를 기반으로 정적 검사와 프로덕션 빌드를 검증하며, `AGENTS.md`에 정의된 하네스 체크리스트를 통해 환경변수, SPA 라우팅, 배포 경로, 브라우저 API 조건을 점검한다.
