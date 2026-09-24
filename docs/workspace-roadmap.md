# Workspace completion — primary next-work goal

**최신 우선순위 (2026-09-24): Workspace 완성이 주 목표이며 Music(YouTube 음악 재생 앱)을 최우선으로 개발한다.**

사용자 지정: 2026-09-23. **다음 작업의 주 목표는 워크스페이스 완성**이다.
기존 CMS 게시 흐름 우선 계획을 조정한다. CMS와 나머지 마스터 프롬프트 요구는 유지한다.

## 현재 상태

- 구현: 공통 App Manifest/SDK 계약, 동적 앱 로딩, 앱 런처, 검색 팔레트, 공통 알림, Notes/Tasks/Timer 세션 미리보기, 모바일 레이아웃.
- 부분 구현: 개인 Workspace의 Music 링크와 Notes/Tasks는 사용자별 DB/RLS/API로 저장한다. 공개 미리보기는 세션 전용이다. Notes는 본문 변경 후 저장 버튼을 누른다.
- 부분 구현: 데스크톱/태블릿 창 이동·크기조절·포커스·최소화·복원·Dock 및 desktop/tablet/mobile별 실행 창 배치 저장. 모바일은 Home/Apps/Search/Notifications/Settings 탐색과 단일 앱 화면을 제공한다. 설정·알림의 공통 서비스 확장은 남아 있다.
- 미구현: 나머지 기본 앱과 외부 서비스 연동, 창 배치의 실제 브라우저·재로그인 검증.
- GitHub Pages의 Workspace는 공개 미리보기다. 실제 개인 Workspace에는 Node 서버 호스팅, Google OAuth 실설정 및 사용자별 권한 검증이 필요하다.

## 권장 구현 순서

| 순서 | 범위 | 검증 가능한 결과 |
| --- | --- | --- |
| 0 (최우선) | Music | 공식 YouTube 링크/목록 재생 → 실제 재생 검증 → 사용자별 저장 → 별도 계정 연결 |
| 1 | 인증·저장 기반 | 로그인, 서버 사용자 검증, 프로필 초기화, 사용자별 테이블/RLS; 다른 사용자의 데이터 접근 차단 |
| 2 | Notes / Tasks | 생성·조회·수정·삭제 및 오류 처리; 새로고침·재로그인 후 복원; Notes 본문과 배치 상태 분리 |
| 3 | Workspace Core | 창 이동·크기조절·포커스·최소화·복원, Dock, 실행 상태 및 desktop/tablet/mobile별 배치 저장 |
| 4 | 공통 서비스 | 앱별 Command Registry, Command Palette, Notification Center, Settings, 앱 설정/설치 상태, 공통 수명주기 |
| 5 | 기본 앱 완성 | Timer/Stopwatch/Pomodoro, Files, Reference, Code(Monaco), Music, Cloud, Admin 진입, Settings 및 Notes/Tasks 세부 기능 |
| 6 | 외부 서비스 | Drive 최소 권한 연결, 공식 YouTube Player/Playlist, 필요한 Google API 추가 동의, 서버 토큰 보관 |
| 7 | 통합 검증 | 모바일 전용 UX, 키보드·포커스, 복원·동기화·오류 상태, 사용자 간 격리, 성능·회귀 확인 |

모든 앱을 한 번에 구현하지 않고 검증 가능한 작은 단위로 진행한다. 아직 필요한 설정/자격증명이 없는 외부 연동은 정확한 차단 지점을 기록하며, 다른 독립 작업을 진행한다. 미리보기나 빈 화면을 완성된 기능으로 기록하지 않는다.

## 완료 기준

- 인증된 사용자만 개인 Workspace에 접근하며 모든 데이터 작업에 서버 권한 검증과 RLS가 적용된다.
- Notes/Tasks와 앱별 필수 데이터가 영속 저장되고 재접속 시 복원된다.
- 창 관리·Dock·앱 실행/전환·설정·명령·알림이 공통 구조로 동작한다.
- 마스터 프롬프트의 기본 앱 기능이 실제 동작하고 외부 연동의 동의/연결/실패 상태가 구분된다. Admin은 보호된 관리 경로 진입을 제공하며 CMS 전체 편집 완성과는 구분한다.
- 모바일에서는 데스크톱 창을 축소하지 않고 Home/Apps/Search/Notifications/Settings 중심으로 제공한다.
- 인증·권한·영속 저장·레이아웃 복원·접근성·반응형과 TypeScript/build 회귀 검증을 통과한다.
- 남은 기능/차단 요소가 있으면 Workspace 전체를 완료로 표시하지 않고 progress/HANDOFF에 구체적으로 남긴다.

## 이후 작업

Workspace 목표 달성 후 CMS Draft → Preview → Publish, Block Editor, 공개 reader/legacy gallery/Pages 스냅샷 전환을 이어간다. Workspace에 필요한 공통 인증·프로필·미디어 기능은 먼저 구현할 수 있다.
