# Pluto Archive Progress

**최신 우선순위 (2026-09-24): Workspace 완성이 주 목표이며 Music(YouTube 음악 재생 앱)을 최우선으로 개발한다.**

## Current Phase

**최신 사용자 우선순위 변경 (2026-09-23): 다음 작업의 주 목표는 워크스페이스 완성.** 기존 CMS 게시 흐름 우선 계획을 변경한다. Workspace에 필요한 인증·DB/RLS 선행 작업부터 진행하며, CMS 기능 요구사항은 후순위로 유지한다. 상세 실행 순서·완료 기준: `docs/workspace-roadmap.md`.

메인페이지(`/`) 배경색을 `#000817`로 변경했다. Home 전용 표식을 사용해 페이지 이동 시 배경이 해당 경로에 맞게 적용되도록 했다.

**Phase 02 — Database / Auth / Security 진행 중.** 2026-09-23 CMS DB 기반 작업을 완료하고 실제 Supabase에 적용·검증했다. Foundation과 GitHub Pages 공개 배포는 유지된다. 관리자 편집 UI와 게시 흐름은 아직 미구현이며, 전체 플랫폼 완료가 아니다.

작업 브랜치: `codex/platform-foundation`.
사용자가 이번 세션에 첨부한 최신 마스터 프롬프트(0–90절)를 `docs/master-development-prompt.md`에 반영했다.

## Completed

### 기존 Foundation

- Next.js 16.3.5 / React / TypeScript / pnpm 모노레포, 공통 타입·Block·App 계약.
- Public 홈/작품/상세/Projects/Process/About/Contact 및 3공간 디자인 시스템.
- 기존 gallery_items 읽기 어댑터와 작품 1건의 공개 스냅샷.
- Google PKCE 서버 핸들러, HttpOnly 세션, Origin 검사, getUser/is_admin 가드.
- Notes/Tasks/Timer 세션 미리보기, 앱 런처·검색·알림·모바일 레이아웃.
- GitHub Pages 브랜치 루트 정적 배포 구성. 2026-09-23 공개 URL HTTP 200 확인.

### 이번 CMS DB 기반 작업

- 기존 DB·RLS·관리자 RPC·마이그레이션 이력을 다시 확인.
- `profiles`, `contents`, `content_blocks`, `media`, `content_media`, `categories`, `tags`, `content_categories`, `content_tags` 9개 테이블 추가.
- user/editor/admin 역할 조회, 본인 프로필 접근, 클라이언트 역할 변경 차단.
- 공개 조회를 published + public + 게시 시각 도달 조건으로 제한. 초안/비공개/unlisted/예약/보관 콘텐츠와 관련 블록·미디어·관계 데이터 차단.
- 편집자·관리자의 CMS CRUD RLS와 명시적 테이블/함수 권한. TRUNCATE 등 불필요한 기본 권한 제거.
- 버전/순서/JSON 형태 제약, 외래키 조회 인덱스, updated_at 트리거.
- 기존 작품 ID·slug·제목·설명·작성자·시각·이미지 경로를 보존한 메타데이터 복사. 원본 gallery_items/site_admins/Storage는 수정하지 않음.
- 실제 확인: 원본 작품 1건, 관리자 1건 유지; 동일한 CMS 작품·미디어 각 1건; profiles 2건.
- `20260923131902_cms_foundation` 및 `20260923132138_consolidate_cms_read_policies` 원격 적용 확인. 저장소 파일명도 원격 이력과 일치.
- 독립 PostgreSQL 기반 `pnpm test:database`와 CI 검증 단계 추가.
- `docs/database.md`에 권한, 마이그레이션 이력, 레거시 전환 제약 및 다음 작업 기록.

## Validation

- frozen-lockfile 설치, TypeScript, Next production build 통과.
- 로컬 PostgreSQL(PGlite) DB 검사 **173개 통과**: 역할별 CRUD, 자기 권한 상승 차단, 비공개 데이터 차단, 게시 취소, 권한 회수, 원본 보존.
- 실제 Supabase에서도 관리자 인식, 임시 초안·블록 생성, 익명/일반 사용자 조회 차단 및 권한 상승 차단 통과. 모든 시험 쓰기는 트랜잭션 rollback으로 제거.
- Supabase 보안 점검에서 새 스키마 관련 지적 없음. 중복 SELECT 정책 성능 경고는 후속 마이그레이션으로 해결.
- 기존 Pages 산출물: HTML 14개, 로컬 링크·자산 248개 검사 통과. 이번 작업은 UI/정적 산출물을 변경하지 않았다.
- README Git blob `cb2b0c1cb64a61362a3536fb91657d297a60974c` 일치.
- Google 실제 로그인, Supabase Auth/Storage 서비스 전체 연동은 이번 검증 범위에 포함하지 않음.

## In Progress

### Phase 02 나머지

- DB 역할은 구현됐지만 기존 서버 `/admin` 가드는 아직 `is_admin()` 사용. editor 진입/작업 가드와 신규 로그인 프로필 초기화를 CMS UI와 함께 연결해야 함.
- Workspace·설정·Navigation 테이블은 각 기능 구현 단계에 맞춰 추가할 예정.
- Google 공급자·허용 callback·Node 서버 호스팅의 실제 설정 및 로그인 검증 필요.

## Next

주 목표: **Workspace 완성**. 이번 요청은 배경색 변경과 다음 작업 목표 설정이며, Workspace 구현 완료를 의미하지 않는다.

1. 기존 Workspace Shell/App Registry/SDK 및 Notes/Tasks/Timer의 현재 상태를 확인한다.
2. 로그인 가능한 서버 환경, 프로필 초기화, 사용자별 DB·RLS와 서버 권한 검증을 먼저 연결한다.
3. Notes/Tasks 영속 CRUD를 구현하고 새로고침·재로그인 후 복원을 검증한다.
4. Window Manager의 이동·크기조절·최소화·복원·포커스와 디바이스별 레이아웃 저장을 완성한다.
5. Command Palette·알림·설정·모바일 App Launcher 및 마스터 프롬프트의 기본 앱을 순차 완성한다.
6. 외부 앱 권한 연결과 오류·접근성·반응형·개인 데이터 격리를 검증한 뒤 CMS 게시 흐름으로 돌아간다.

세부 범위 및 완료 기준은 `docs/workspace-roadmap.md`를 따른다.

## Pending

- Phase 03: CMS 기반 Featured/필터, 프로젝트·프로세스 실제 콘텐츠, 운영 소개·연락처.
- Phase 04–05: CMS 편집·게시 UI, 블록 편집/미리보기, 미디어 파생본/업로드, 분류·태그·Navigation·Site Settings 관리.
- Phase 06–07: 창 이동·크기조절·디바이스별 저장, Notes/Tasks 서버 동기화, Code/Files/Reference/Music/Settings.
- Phase 08: Drive/YouTube 별도 incremental OAuth 및 서버 토큰 보관.
- Phase 09–10: 성능 실측·최적화, 접근성 심화, 모바일 네이티브 클라이언트.

## Known Issues

- GitHub Pages는 정적 공개 사이트/Workspace 미리보기만 제공. 로그인·CMS에는 Node 호스팅 필요.
- 기존 gallery_items와 gallery 버킷은 공개 상태. 새 CMS 행을 private/draft로 바꿔도 기존 어댑터·정적 스냅샷·직접 이미지 URL은 자동 비공개가 되지 않는다. 게시 UI 전환의 필수 선행 과제다.
- 원격의 이전 마이그레이션 3개는 저장소에 아직 없음. 새 SQL은 기존 Pluto DB를 전제로 한다. CLI db push/reset/repair 전에 이력 조정 필요. 테스트 fixture를 운영 baseline으로 사용하지 않는다.
- 기존 Auth의 유출 비밀번호 차단 기능 미설정: [조치 안내](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Auth 설정은 변경하지 않음.
- 기존 gallery_items.created_by 외래키 인덱스 없음. 신규 인덱스는 트래픽 전까지 unused 안내가 나타날 수 있음.
- Unlisted 공개 상세 진입은 아직 미구현이며 현재는 안전하게 공개 조회를 차단한다.

## Decisions

- 2026-09-23 최신 사용자 지정: Home 배경 #000817; 다음 주 목표 Workspace 완성. 기존 CMS 우선 순서를 조정하되 요구 기능은 삭제하지 않는다.

- 기존 작품·관리자·Storage를 보존하는 추가형 마이그레이션 유지.
- 이번 단위는 CMS DB 기반까지. 저장 UI와 서비스가 없는 Workspace/외부 연동 테이블을 미리 확장하지 않음.
- 역할 정보는 신뢰된 DB 레코드에서 조회. 사용자 metadata 및 클라이언트 역할 변경은 불허.
- Auth 회원가입을 막을 수 있는 DB signup trigger 대신 추후 서버 경계에서 프로필 초기화.
- 적용된 migration은 수정하지 않고 후속 migration으로 개선. 파일 버전은 원격 기록과 일치시킨다.
- PGlite는 dev-only 테스트 도구이며 웹 번들/운영 DB에 포함되지 않는다.

## Handoff

Current Task: CMS DB 기반 완료. 메인페이지 배경 #000817 적용 및 다음 주 목표를 Workspace 완성으로 변경. Music 공개 링크 재생 기반 구현 후 다음은 Music 사용자별 저장 및 Workspace 인증/저장 기반.

Files Modified: `supabase/migrations/*`, `supabase/tests/*`, `scripts/test-database.mjs`, `package.json`, `pnpm-lock.yaml`, `.github/workflows/ci.yml`, `docs/{database,progress,HANDOFF,architecture,auth,master-development-prompt}.md`.

Database Changes: 위 두 migration 원격 적용 완료. 원본 데이터 변경 없음.

GitHub Sync: 구현 commit `9b5bcbbcf0210113012df7c24fc9e8167a1c1143`가 작업 브랜치에 반영됐고, 원격 tree가 로컬 검증본과 일치함을 확인했다. 일반 git push의 자격증명 부재로 연결된 GitHub 플러그인을 사용했다.

- 원격 Node 22 CI 전체 성공: https://github.com/SeaArchive/PlutoArchive/actions/runs/35866911324
- DB 173개 검사, TypeScript, 서버 production build, Pages 재빌드 및 경로 검사 전부 성공.
- 동일 구현 commit의 Pages 배포 성공: https://github.com/SeaArchive/PlutoArchive/actions/runs/35866910634
- 이 결과 기록은 후속 문서 전용 commit으로 저장한다. 위 검증은 명시된 구현 commit 기준이다.

## Last Modified

2026-09-23 (Asia/Seoul).

## Earlier delivery references

- Foundation: `8ee5a481b39ef33c51486baa69e026a814896a97`.
- Foundation CI: https://github.com/SeaArchive/PlutoArchive/actions/runs/35516498866
- Pages 루트 배포: `37c79d3` (Windows 페이지 전환 payload 보정 포함).
- main 병합 없음. 작업은 `codex/platform-foundation`에서 이어간다.

## Latest change: Home background and Workspace priority

- Home 배경을 #000817로 적용. `AGENTS.md`, 마스터 프롬프트, 디자인 문서, HANDOFF, progress와 Workspace 실행 계획에 최신 사용자 요구를 반영.
- 검증 및 원격 반영 결과는 이번 변경 commit과 Actions를 기준으로 확인한다. 이전 절의 CI 링크는 CMS 기반 commit의 검증 기록이다.
- 이번 변경 로컬 검증: frozen-lockfile 설치, TypeScript, production build, Pages 재빌드, HTML 14개/링크·자산 248개 검사 통과. Home 전용 표식과 연결된 CSS의 #000817 값을 확인.
- 브라우저 실화면 검증은 로컬 Chromium 설치/다운로드 실패로 수행하지 못함. 이미지 출력 없음.


## Latest delivery — Music playback foundation (2026-09-24)

- Workspace 첫 앱으로 Music 등록. 기존 Notes/Tasks/Timer 및 Home #000817 유지.
- 공식 YouTube IFrame Player API를 사용. YouTube Music/YouTube/watch/shorts/live/embed/youtu.be 및 공개 재생목록 링크를 검증·정규화한다. 임의 HTML/호스트/추적 파라미터는 iframe에 전달하지 않는다.
- 링크별 이름, 세션 목록(최대 50), 선택·삭제, 재생/일시정지, 재생목록 이전/다음, 볼륨, 현재 곡 외부 링크, 간단히/펼치기 구현. 곡 제목·썸네일·재생목록 내 선택은 공식 플레이어 UI에서도 제공된다.
- API는 링크 선택 후 로드. 연결 실패/시간 초과/삭제·비공개/외부 재생 금지/153 오류/자동재생 차단 안내 및 재시도. 링크 변경·닫기 시 플레이어 제거; 페이지 숨김 시 일시정지. 간단히 모드에서도 영상 표시 유지.
- 앱 동적 로더를 registry로 이동해 새 앱 추가 시 Shell의 renderer map을 수정하지 않도록 정리.
- DB·Auth·외부 OAuth 설정 변경 없음. Music 계정 보관함/검색/서버 저장/재로그인 복원은 미구현. 현재 세션 목록을 영속 저장으로 표현하지 않는다.
- Music 검사: 35개 URL·임베드·오류 매핑 검증 + API 중복 로드·실패·재시도·재사용 검증 통과. CI에 test:music 추가.
- 기존 DB 회귀 173개 통과, TypeScript·서버 빌드 통과. Pages 및 브라우저 검증 결과는 아래 최종 기록 참조.

### Next: Music → persistent Workspace

1. 공개 환경에서 실제 재생·곡 넘김·볼륨·모바일 및 제한 콘텐츠 확인. 사용자 네트워크/지역/콘텐츠 소유자의 삽입 허용 여부가 재생에 영향을 준다.
2. Node 호스팅·Google 로그인 설정을 확인하고 사용자별 Music 링크/재생목록·설정 저장 schema/RLS/API를 구현한다. 로그인별 데이터 격리 및 재로그인 복원을 검증한다.
3. 필요 시 별도 YouTube OAuth 동의를 받아 계정 재생목록 연결. YouTube Music 사이트 자체 삽입이나 오디오 추출 방식으로 대체하지 않는다.
4. Notes/Tasks 저장, 창 관리·레이아웃 복원, 공통 서비스 및 나머지 앱 순으로 Workspace를 완성한다. CMS 요구사항은 유지한다.

Files: apps/web/src/features/workspace/music/*, registry.ts, shell.tsx, globals.css, scripts/test-music.mjs, package.json, CI, docs 및 재생성된 Pages 산출물. README 변경 없음.

### Music delivery validation

- TypeScript, server production build, Pages production build 통과. Pages HTML 14개 / 로컬 링크·자산 250개 통과.
- Music URL/임베드/오류 검사 35개 + API 로더 중복·실패·재시도·재사용 검사, 기존 DB 173개 통과.
- Chromium 실행 파일 부재 및 브라우저 다운로드 실패(손상/빈 압축 파일)로 실화면·실제 음원 재생 검증은 수행하지 못했다. 외부 API mock 검사를 실제 재생 검증으로 간주하지 않는다.
- Pages 재빌드 중 임시 디렉터리 ENOTEMPTY가 한 번 발생했으며 재실행 성공. 현재 배포 산출물은 최신 소스에서 생성했다.
- README blob cb2b0c1cb64a61362a3536fb91657d297a60974c 유지. GitHub 반영은 자격증명 없는 git push 대신 연결된 GitHub API를 사용한다. 원격 CI/배포 결과는 별도 확인 전에는 성공으로 간주하지 않는다.

### Verified GitHub delivery — 2026-09-24

- Music 구현 commit: `aac1b11954912a8848d95f2a8861457aa1437fca`; 원격 tree와 로컬 검증 tree 일치, 작업 브랜치 동기화 완료.
- 원격 Node 22 CI 성공: https://github.com/SeaArchive/PlutoArchive/actions/runs/36005101594 (DB, Music, TypeScript, server/Pages build, Pages 검사).
- GitHub Pages 배포 성공: https://github.com/SeaArchive/PlutoArchive/actions/runs/36005100636
- 실제 브라우저 음원 재생은 미검증. 위 결과는 자동 검사/배포 성공이며 계정 연동 또는 Workspace 전체 완료를 뜻하지 않는다.

## Latest work — personal Music storage (2026-09-24)

- `docs/progress.md`의 직전 중단 지점부터 재개. 인증된 Node Workspace의 Music 링크를 `public.music_links`에 사용자별 보관하고 새로고침·재로그인 시 조회한다. 공개 Pages 미리보기는 계속 세션 전용이다.
- `20260924135127_workspace_music_links` 원격 Supabase 적용 확인. RLS는 본인 SELECT/INSERT/DELETE만 허용하며 URL/이름 제약, 고유 링크, 동시 삽입을 직렬화한 50개 제한이 있다. 다른 사용자는 관리자 역할이더라도 개인 링크를 읽지 못한다. 기존 gallery/CMS/Storage 데이터는 수정하지 않았다.
- `/api/music/links`에 서버 `getUser()` 검사와 쓰기 요청 Origin 검사, 링크 재검증, 오류 응답, no-store 적용. `requireUser`에서 누락 프로필을 기본 user 역할로 생성한다. 역할 필드는 클라이언트가 쓰지 못한다.
- `pnpm test:database` 186개, `pnpm test:music` 35개 및 API 로더 검사, `pnpm typecheck`, 서버 `pnpm build`, `pnpm build:pages`, `pnpm check:pages` 통과. Pages HTML 14개/로컬 링크·자산 250개 검사 통과. README blob `cb2b0c1cb64a61362a3536fb91657d297a60974c` 유지.
- 실제 Supabase 마이그레이션 이력과 보안 advisor를 확인했다. 신규 스키마 보안 지적 없음. 기존 유출 비밀번호 차단 설정 경고는 남아 있다.
- 실제 브라우저 Google 로그인, 개인 목록의 재로그인 복원, YouTube 음원 재생은 Node 호스팅/OAuth 설정이 없어 아직 검증하지 못했다. GitHub Pages는 서버 API를 제공하지 않는다. 현 단계는 Workspace 전체 완료가 아니다.

### Next handoff

1. Node 배포 원본 URL과 Google OAuth 공급자/콜백을 설정한 뒤 실제 로그인, 링크 저장·삭제·재로그인 복원 및 재생을 확인한다.
2. Notes/Tasks 본문과 사용자별 DB/RLS/API를 구현하고 복원·격리를 검사한다.
3. Window Manager 및 디바이스별 레이아웃 저장, 공통 서비스와 나머지 앱을 `docs/workspace-roadmap.md` 순서대로 이어간다.
4. GitHub 동기화와 CI/Pages 결과를 확인해 이 절에 커밋 및 실행 결과를 추가한다.

### GitHub sync — Music storage

- Music 저장 구현 `e9e3e8db9d3860350ac000c50e436bf92c30bb65`가 작업 브랜치에 반영됐다. 연결된 GitHub API가 반환한 tree `54030162226687085b42fa1a471c7116a89a9f15`는 로컬 검증 tree와 동일하다. 일반 git push에는 자격증명이 없어 연결된 플러그인을 이용했다.
- 원격 CI/Pages 배포 결과는 별도 확인 전에는 성공으로 기록하지 않는다.

## Latest work — persistent Notes and Tasks (2026-09-24)

- 개인 Workspace에서 메모와 작업을 사용자별로 생성·조회·수정·삭제한다. Notes 본문/색상/고정과 Tasks 완료/우선순위/마감일을 별도 테이블에 저장하며 메모 검색과 오늘/완료 작업 필터를 추가했다. Notes 본문은 사용자가 저장 버튼을 눌러야 반영되고, 미저장 상태가 표시된다. 공개 미리보기는 서버 요청 없이 세션 상태를 사용한다.
- `20260924140233_workspace_notes_tasks`를 실제 Supabase에 적용했다. 두 테이블의 모든 CRUD에 본인 RLS와 서버 `getUser()` 검사가 있으며 다른 사용자/관리자에게 개인 레코드가 보이지 않는다. 서버는 요청 필드를 허용 목록으로 제한하고 쓰기 Origin을 검사한다.
- 로컬 PGlite 210개 검사, Music 회귀, TypeScript, 서버 빌드, Pages 재빌드와 검사(HTML 14개, 로컬 링크·자산 250개) 통과. 실제 Supabase에서는 rollback 트랜잭션으로 본인 쓰기·타인 읽기 차단을 검사했고 Music/Notes/Tasks 시험 행은 0개다. 보안 advisor에 신규 스키마 지적 없음. 원격 CI 결과는 후속 기록 예정.
- Google 공급자와 Node 호스팅 설정이 없어 브라우저에서 실제 로그인·새로고침·재로그인 복원은 미검증이다. Window Manager/레이아웃 및 나머지 앱도 아직 미구현이므로 Workspace 전체 완료가 아니다.

### Next handoff (updated)

1. Node 배포와 Google OAuth/콜백을 구성해 Music/Notes/Tasks의 사용자별 재로그인 복원 및 실제 YouTube 재생을 확인한다.
2. Window Manager의 이동·크기조절·최소화·복원·포커스와 desktop/tablet/mobile 배치 저장을 구현한다.
3. 공통 Command/Notification/Settings 및 나머지 기본 앱을 로드맵에 따라 이어간다. CMS 요구는 계속 유지한다.
4. 이번 Notes/Tasks 변경의 GitHub 동기화·CI/배포 결과를 확인한다.

### GitHub sync — Notes/Tasks

- Notes/Tasks 구현 commit `1466e8fda98c7b0f8b37a37bb65007d68194164e`를 작업 브랜치에 반영했다. GitHub API의 tree `4e16767c4c750f6394d198c1efcbf4a4ffe84c02`는 로컬 검증 tree와 일치한다.
- 원격 CI/Pages 실행 결과는 GitHub 플러그인의 현재 조회에서 확인되지 않아 성공으로 기록하지 않는다. 로컬 검증 결과는 위 절에 명시했다.

## Latest work — Workspace windows and device layouts (2026-09-24)

- 기존 Shell의 단순 2열 나열을 창 관리로 확장했다. 데스크톱/태블릿은 창 이동·크기조절·포커스·최소화·복원·닫기, Dock 및 키보드 이동(창 제목에 Alt+방향키)·크기조절(핸들에 방향키)을 지원한다. 창을 모두 닫은 상태도 저장된다.
- 모바일에는 데스크톱 창을 축소하지 않고 Home/Apps/Search/Notifications/Settings 탐색과 단일 앱 화면을 제공한다. 현재 Settings는 기기 배치 초기화, Notifications는 현재 알림 표시 범위다. 전체 공통 서비스 구현을 뜻하지 않는다.
- 창 실행 상태·크기·위치·순서는 앱 본문과 분리된 `workspace_layouts`에 기기별 저장한다. `20260924143603_workspace_window_layout`을 실제 Supabase에 적용했고, `getUser()` 서버 검사·쓰기 Origin 검사·앱 ID/숫자 검증·본인 RLS가 적용됐다. 공개 Pages 미리보기의 배치는 세션 전용이다.
- 로컬 PGlite **222개** 검사, `pnpm test:layout`의 기기 경계·비정상 레이아웃·화면 맞춤 검사, 기존 Music 검사, TypeScript, 서버 빌드, Pages 빌드·검사 통과. Pages HTML 14개/로컬 링크·자산 244개. README blob `cb2b0c1cb64a61362a3536fb91657d297a60974c` 보존.
- 실제 Supabase의 임시 레이아웃 생성·본인 조회·타인 차단은 rollback 트랜잭션으로 확인했고 시험 행은 0개다. 신규 스키마 보안 advisor 지적 없음. 실제 브라우저 드래그·터치·재로그인 복원과 Google OAuth는 Node 호스팅 설정 부재로 미검증이다.

### Remaining / next

1. Node 호스팅과 Google 로그인 설정 후 Music/Notes/Tasks/창 배치의 실제 재접속 복원, 모바일 터치 및 YouTube 재생을 확인한다.
2. Command Registry·Palette, 알림 센터, Settings와 App 수명주기를 공통 서비스로 발전시킨다.
3. Timer/Stopwatch/Pomodoro와 Code/Files/Reference/Cloud 등 기본 앱을 실제 기능별로 완성한다. CMS 요구사항은 계속 유지한다.
4. 이번 변경을 작업 브랜치에 동기화하고 원격 CI/Pages 결과를 확인한다.

### GitHub sync — Window Manager

- 구현 commit `f9ba2e2ad80a1d32ec5de3e2ed91726f2b4fd515`를 `codex/platform-foundation`에 반영했다. GitHub tree `6db4086e1e4ec0c5846eaaab04237bfd7d8644f7`은 로컬 검증 tree와 일치한다.
- 원격 CI/Pages 실행 결과는 확인되지 않아 성공으로 기록하지 않는다. 서버·Pages 로컬 검증과 실제 Supabase 적용/rollback 검사 결과는 위 절에 명시했다.

### Live Pages preview check

- 공개 미리보기 `https://seaarchive.github.io/PlutoArchive/workspace/preview/`에서 최신 창 UI 로드를 확인했다. Notes 창을 키보드로 20px 이동, 너비를 20px 확장했고 마우스 드래그 이동 및 최소화→Dock 복원이 실제 브라우저에서 동작했다.
- 이 검증은 공개 미리보기의 데스크톱 인터랙션이다. 모바일 터치·개인 계정 RLS/재로그인 저장은 Node 서버·OAuth 환경에서 아직 검증하지 않았다. 원격 Actions 실행 결과는 확인되지 않았다.

### Verified remote runs

- Window Manager 구현 commit `f9ba2e2ad80a1d32ec5de3e2ed91726f2b4fd515`의 GitHub Actions Validate platform 성공: https://github.com/SeaArchive/PlutoArchive/actions/runs/36014197571
- 최신 문서 commit `fa7ea4a2f4033af7760d980833efab9a15a7953e`의 Validate platform 성공: https://github.com/SeaArchive/PlutoArchive/actions/runs/36014613121
- 최신 Pages 배포 성공: https://github.com/SeaArchive/PlutoArchive/actions/runs/36014608558
- 이 결과는 자동 검사와 공개 미리보기 배포 기준이다. Node 인증 API의 실제 브라우저 이용·모바일 터치·개인 데이터 복원은 미검증이다.
