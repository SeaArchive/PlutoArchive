# Pluto Archive Progress

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

Current Task: CMS DB 기반 완료. 메인페이지 배경 #000817 적용 및 다음 주 목표를 Workspace 완성으로 변경. 다음 구현은 Workspace 인증/저장 기반부터 진행.

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
