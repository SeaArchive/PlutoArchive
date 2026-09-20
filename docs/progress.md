# Pluto Archive 진행 상태

최종 갱신: 2026-09-20 (Asia/Seoul)
브랜치: `codex/platform-foundation`

## 현재 진행 상태

Master Prompt 분석과 Foundation 구현·로컬 빌드 검증 완료. 공개 화면 및 기존 작품 연결, 보호된 Workspace/Admin 진입과 Google OAuth 코드, Workspace 미리보기를 구현했다. 전체 플랫폼 완성이 아니라 Phase 01 중심의 첫 구현이다. GitHub 동기화 검증은 아래 완료 기록을 기준으로 확인한다.

## 완료된 작업

- 기존 저장소·Supabase 테이블·관리자 확인 RPC 분석.
- README.md 원본 유지: Git blob `cb2b0c1cb64a61362a3536fb91657d297a60974c` 일치.
- 기존 HTML/CSS/JS 파일을 새 브랜치에서 제거하고 Next.js 16.3.5 + React + TypeScript + pnpm 구조로 재편. 기존 파일은 이전 Git 커밋에서 복구 가능.
- Public 홈/작품 목록·상세/Projects/Process/About/Contact 경로와 디자인 시스템. 작품 1건을 기존 Supabase에서 실제 조회.
- 버건디·실버 Public, 차콜·그린 Workspace, 아이보리·골드 Admin 스타일.
- Google PKCE 로그인 시작·콜백·로그아웃 서버 처리, HttpOnly 쿠키, Origin 검사, getUser 및 is_admin 서버 가드.
- 기존 갤러리를 읽는 보호된 관리자 대시보드.
- Notes/Tasks/Timer 앱 미리보기, 동적 import, 앱 런처, 검색 팔레트, 공통 알림, 모바일 레이아웃.
- 공통 도메인 타입, 블록 버전/검증 규격, App Manifest/SDK 계약.
- 원본 개발 프롬프트, architecture/auth/design-system/HANDOFF 문서, AGENTS.md, Codespaces devcontainer, GitHub CI 설정.
- 웹·데스크톱 공통 실행 명령과 환경변수 예시. 비밀값은 저장소에 포함하지 않음.

## 검증 결과

- Next production build 통과; TypeScript 통과.
- 브라우저에서 실제 갤러리 1건 표시 확인.
- 비로그인 `/admin`, `/workspace` → `/login` 리다이렉트 확인.
- 메모 생성·입력, 작업 추가·완료, 타이머 감소, Ctrl+K 앱 검색 확인.
- 390px 폭에서 홈/작품/Projects/Process/About/Contact/Login/Workspace Preview 가로 넘침 없음.
- 브라우저 JavaScript 오류 0건. 데스크톱·모바일 스크린샷 확인.
- Google OAuth 실제 로그인, 관리자 로그인 상태, 신규 RLS는 검증하지 않음. 새로운 DB 구조는 아직 없음.

## 미완료 작업

- Phase 02: 신규 도메인 DB 마이그레이션·RLS, user/editor/admin 역할 확장, Google 공급자·콜백 실제 설정 확인.
- Phase 03: CMS 기반 작품 Featured/카테고리 필터, 실제 프로젝트·프로세스 데이터, 운영 소개·연락처.
- Phase 04–05: CMS CRUD, Draft/Preview/Publish, Blocks Renderer/Editor, 미디어 업로드, 카테고리/태그/네비게이션/사이트 설정 관리.
- Phase 06–07: 창 이동/크기조절/디바이스별 저장, Notes/Tasks 서버 동기화, Code/Files/Reference/Music 및 설정 앱.
- Phase 08: Drive/YouTube incremental OAuth 및 서버 측 토큰 저장.
- Phase 09–10: 이미지 파생본, 폰트 최적화, 성능 실측, 접근성 심화 검증, 모바일 네이티브 클라이언트.
- Node 지원 운영 호스팅 선택·배포·기존 GitHub Pages 전환. main 병합 안 됨.

## 다음 권장 작업

1. 웹 환경에서 GitHub 작업 브랜치를 선택하고 `docs/HANDOFF.md`의 명령으로 설치·실행한다.
2. 기존 DB를 다시 읽고 새 CMS 스키마·RLS 마이그레이션을 설계한다. gallery_items와 원본 Storage 파일은 보존한다.
3. 기존 작품을 새 contents/media 구조로 복사한 뒤 행 수·권한·이미지 경로를 검증한다.
4. 콘텐츠 Draft → Preview → Publish를 가장 먼저 연결하고 블록 편집기를 추가한다.
5. 영속 Workspace 데이터를 연결하고 나머지 앱/Google 연동을 순서대로 진행한다.

## 운영 규칙

작업 종료 또는 사용량 제한 전에 반드시 이 문서의 진행 상태·완료·미완료·다음 작업·검증 결과를 갱신하고 GitHub에 동기화한다. 실제 동기화/배포 성공을 확인하기 전에는 완료로 기록하지 않는다. 화면 미리보기 앱은 저장 기능으로 설명하지 않는다.

## GitHub 동기화 완료 기록

- Foundation 커밋: `8ee5a481b39ef33c51486baa69e026a814896a97`.
- 원격 `codex/platform-foundation` 브랜치 생성 및 로컬 추적 연결 확인.
- GitHub Actions Linux/Node 22 환경에서 frozen-lockfile 설치, TypeScript, production build 모두 성공: https://github.com/SeaArchive/PlutoArchive/actions/runs/35516498866
- 코드·전체 프롬프트·진행 문서가 원격 브랜치에 있으며 웹 환경에서 이어받을 수 있다.
- 운영 사이트 배포 및 main 병합은 하지 않았다. README의 기존 GitHub Pages 링크는 기존 사이트를 가리킨다.
