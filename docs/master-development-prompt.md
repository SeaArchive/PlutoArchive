# Pluto Archive — Master Development Prompt

**최신 우선순위 (2026-09-26): Public Space 완성이 최우선이다. 게임 개발·게임 기획 자기소개서에 활용할 가능성을 고려하되, 확인되지 않은 경력·성과는 쓰지 않는다.**

> 최신 사용자 변경 (2026-09-26): Public 페이지와 아트워크 바탕은 `#000817`. Public Space를 먼저 완성한다. 2026-09-23~24의 Workspace 우선 지시는 이 변경으로 대체된다. Workspace·CMS 요구는 유지한다. 구체적 순서는 `docs/public-roadmap.md`를 따른다.

너는 이 프로젝트의 **시니어 웹 아키텍트, 프론트엔드 개발자, 백엔드 개발자, UI/UX 디자이너, 성능 최적화 담당자** 역할을 동시에 수행한다.

프로젝트 이름은 **Pluto Archive**이다.

목표는 단순한 포트폴리오 사이트가 아니라 다음 네 가지를 하나의 플랫폼으로 구축하는 것이다.

1. 외부 방문자에게 나를 보여주는 **Public Portfolio**
2. 개인 작업을 통합하는 **Private Workspace**
3. 사이트 콘텐츠를 코드 수정 없이 관리하는 **Admin CMS**
4. 향후 Android/iOS 앱으로 확장 가능한 공통 플랫폼

---

# 0. 최우선 개발 원칙

아래 원칙은 프로젝트 전체에서 최우선으로 유지한다.

## 기존 구조 우선

새로운 기능을 추가하기 전에 반드시 기존 프로젝트의 다음 요소를 먼저 확인한다.

- 디렉터리 구조
- 컴포넌트
- 데이터 흐름
- TypeScript Types
- API
- Database Schema
- Authentication
- App System
- Block System
- Design System
- 기존 문서

기존 기능을 무시하고 동일한 기능을 새로 중복 구현하지 않는다.

---

## 최소 변경

기존 기능을 보존하면서 필요한 부분만 수정한다.

하나의 기능을 추가하기 위해 관계없는 영역을 대규모로 재작성하지 않는다.

단, 현재 구조가 향후 확장을 심각하게 방해하는 경우에는 개선안을 먼저 제안할 수 있다.

---

## 확장 가능성

현재 기능만 동작하도록 하드코딩하지 않는다.

다음을 지속적으로 고려한다.

- 새로운 콘텐츠
- 새로운 App
- 새로운 Block
- 새로운 사용자 역할
- 새로운 플랫폼
- Mobile Client
- 새로운 외부 서비스 연동

---

## 코드와 콘텐츠 분리

기본 원칙:

```text
CODE
= 기능 + 디자인 시스템 + Renderer

DATA
= 작품 + 프로젝트 + 텍스트 + 미디어 + 카테고리

CONFIG
= 사이트 설정 + 앱 설정

```

콘텐츠를 추가하거나 수정하기 위해 사이트 코드를 수정해야 하는 구조를 만들지 않는다.

---

# 1. 더 나은 가능성 제안 규칙

내가 요구한 방식보다 다음 기준에서 명확하게 더 나은 방법이 존재한다면 **구현 전에 제안할 수 있다.**

- 성능
- 보안
- 유지보수성
- 확장성
- 코드 복잡도
- UX/UI
- 접근성
- 모바일 대응
- 안정성
- 운영 비용
- 외부 API 제약
- 향후 개발 비용

제안할 경우 다음을 짧게 설명한다.

```text
현재 방식
제안 방식
변경 이유
장점
단점
기존 구조에 미치는 영향

```

명백한 개선이 아니라 단순 취향 차이라면 기존 방향을 유지한다.

사용자가 이미 확정한 디자인과 프로젝트 방향을 임의로 삭제하거나 변경하지 않는다.

---

# 2. 전체 시스템 구조

Pluto Archive는 크게 세 공간으로 구성한다.

```text
PLUTO ARCHIVE
│
├─ PUBLIC SPACE
│
├─ PRIVATE SPACE
│
└─ ADMIN SPACE

```

세 공간은 서로 다른 목적과 UI를 가지지만 다음 요소는 공유한다.

- Backend
- Authentication
- Domain Model
- Types
- API
- Design DNA
- App / Block 규격

---

# 3. Public Space

목적:

외부 방문자에게 나를 소개하는 포트폴리오.

특히 다음 능력을 보여준다.

- Illustration / Artwork
- 꼼꼼한 디자인 구성 능력
- 구조적인 사고
- UI/UX
- Web Development
- 성능 최적화
- 작업 과정 설계 능력

단순 작품 갤러리가 아니라 결과물과 제작 과정, 기술적 판단까지 함께 보여준다.

---

# 4. Public 페이지 구조

```text
/
├─ Home
├─ Works
│   └─ Work Detail
├─ Projects
│   └─ Project Detail
├─ Process
├─ About
└─ Contact

```

---

# 5. Public Home

기본 콘텐츠 흐름:

```text
Hero

↓

Selected Artwork

↓

Selected Projects

↓

Process Preview

↓

Technical / Optimization

↓

About

↓

Contact

```

Public Home은 전체 포트폴리오를 압축해서 보여주는 대표 페이지다.

---

# 6. Works

그림 중심 공간.

기본 카테고리 예:

```text
Featured
Illustration
Character
Concept
Sketch
Archive

```

카테고리는 코드에 하드코딩하지 않는다.

DB와 Admin CMS에서 관리할 수 있어야 한다.

작품 상세 페이지는 Block System으로 구성한다.

---

# 7. Projects

그림 이외의 프로젝트.

예:

```text
Web
UI/UX
Programming
Design
Experimental

```

Project Detail은 Case Study 형태를 지원한다.

예:

```text
Overview
Purpose
Problem
Planning
Architecture
Design
Implementation
Optimization
Result

```

하지만 이 구조 역시 고정하지 않고 Block System으로 구성한다.

---

# 8. Process

결과물보다 작업 사고 과정을 보여주는 공간.

예:

- Planning
- Design System
- Workflow
- Development
- Optimization
- Refactoring
- Before / After

실제 측정값을 보여줄 수 있으면 적극적으로 사용한다.

예:

```text
Image Size

8.2MB
→
1.4MB

```

---

# 9. Private Workspace

목적:

평소 작업하면서 여러 프로그램을 각각 실행해야 하는 불편함을 줄이고 자주 사용하는 기능을 하나의 작업 플랫폼에서 제공한다.

브라우저 안에 완전한 운영체제를 구현하지 않는다.

필요한 기능만 App 형태로 제공한다.

Private Space는 일반 웹페이지가 아니라 **Workspace Application**처럼 동작한다.

---

# 10. Workspace Core

```text
Workspace
│
├─ Desktop
├─ Dock
├─ Window Manager
├─ App Runtime
├─ App Manager
├─ Command Palette
├─ Notification Center
└─ Settings

```

Desktop은 Windows를 복제하는 것이 아니라 App을 실행하는 작업 공간이다.

---

# 11. 기본 Workspace Apps

초기 기본 앱:

```text
Music
Cloud
Notes
Code
Files
Tasks
Reference
Timer
Admin
Settings

```

향후 App을 쉽게 추가할 수 있어야 한다.

새 App을 추가하기 위해 Workspace 핵심 코드를 수정하는 구조는 피한다.

---

# 12. Music App

오른쪽 상단 또는 시스템 영역에 작은 음악 컨트롤을 제공한다.

예:

```text
♪ Song Name    ▶

```

확장 시:

- Album Art
- Title
- Previous
- Play / Pause
- Next
- Volume
- Playlist

YouTube Music 웹사이트 자체를 강제로 iframe으로 넣는 구조는 사용하지 않는다.

공식적으로 지원되는 YouTube Player / Playlist 방식 중심으로 구현한다.

YouTube 계정 데이터가 필요한 경우 Google OAuth를 사용한다.

---

# 13. Cloud App

초기 클라우드는 Google Drive 연동을 우선한다.

사이트 로그인과 동일한 Google 계정을 기반으로 연결한다.

단:

```text
사이트 로그인 권한
≠
Google Drive API 권한

```

사용자가 Cloud App을 최초 실행할 때 필요한 Drive OAuth Scope만 추가 요청한다.

최소 권한 원칙을 따른다.

가능하다면 제한된 Scope부터 검토하고 전체 Drive 접근이 반드시 필요한 경우에만 더 넓은 권한을 사용한다.

---

# 14. Notes App

Sticky Note 중심.

지원 기능:

- 새 메모
- 수정
- 삭제
- 이동
- 크기 조절
- 색상
- Pin
- 검색
- Quick Note

메모 본문 데이터와 UI 위치 상태는 분리한다.

서버 동기화 가능한 구조로 만든다.

---

# 15. Code App

Desktop VS Code 자체를 웹에 억지로 삽입하지 않는다.

VS Code 스타일 작업 환경을 구축한다.

앱 내부 이름:

```text
Code

```

권장 에디터:

```text
Monaco Editor

```

초기 기능:

- File Explorer
- Tabs
- Code Editor
- Search
- Syntax Highlight
- Theme

향후 확장:

- Terminal
- Git
- GitHub
- Preview

---

# 16. Files App

Cloud와 역할을 분리한다.

```text
Files
= Workspace 내부 파일 관리

Cloud
= Google Drive 등 외부 저장소 연동

```

---

# 17. Tasks App

지원:

- Todo
- Status
- Priority
- Due Date
- Today
- Completed

---

# 18. Reference App

그림 작업 참고자료 관리.

지원 가능 기능:

- Images
- Collections
- Tags
- Favorite
- Pin
- Color Reference
- Pose Reference
- Moodboard

---

# 19. Timer App

지원:

- Timer
- Stopwatch
- Pomodoro
- Custom Timer

---

# 20. Command Palette

Workspace 핵심 시스템 기능.

예:

```text
Ctrl + K

```

검색 가능한 Command Registry를 사용한다.

예:

```text
notes.create
notes.open
notes.search

cloud.upload

code.open

admin.open

```

각 App은 자신의 Command를 등록한다.

Command Palette가 App 내부 구현을 직접 참조하지 않도록 한다.

---

# 21. Notification System

각 App에서 개별 Notification UI를 만들지 않는다.

공통 Notification System을 사용한다.

예:

- Upload Complete
- Save Complete
- Timer Complete
- Sync Complete
- Warning
- Error

---

# 22. Admin Space

관리자 로그인 후 사이트 콘텐츠를 코드 수정 없이 관리한다.

기본 Route:

```text
/admin

```

Workspace에서 Admin App 형태로 진입할 수도 있지만 시스템 Route는 독립적으로 유지한다.

---

# 23. Admin 구조

```text
Dashboard

Portfolio
├─ Works
├─ Projects
├─ Process
└─ Featured

Editor
└─ Block Editor

Media Library

Categories
Tags
Navigation
Pages
Site Settings

```

---

# 24. Portfolio CMS

관리자는 새로운 콘텐츠를 생성하고 수정할 수 있다.

예:

```text
Title
Slug
Category
Thumbnail
Description
Tags
Status
Featured
Publish Date

```

지원 상태:

```text
Draft
Published
Archived

```

지원 Visibility:

```text
Public
Unlisted
Private

```

---

# 25. Draft / Preview / Publish

반드시 지원한다.

```text
Draft
↓
Preview
↓
Publish

```

Draft 상태는 일반 사용자에게 공개하지 않는다.

---

# 26. Featured

Home의 대표 작품 역시 코드에서 관리하지 않는다.

Admin에서 순서를 관리한다.

예:

```text
1 Work B
2 Work A
3 Work F

```

---

# 27. Categories / Tags

코드에 하드코딩하지 않는다.

Admin에서 추가 / 수정 / 삭제할 수 있어야 한다.

---

# 28. Navigation

Public Navigation도 Admin에서 관리할 수 있도록 한다.

지원:

- 순서 변경
- 표시 / 숨김
- Label
- URL

---

# 29. Site Settings

예:

- Site Name
- Logo
- Profile
- Introduction
- Social Links
- Contact
- Default SEO Image
- Portfolio Status

---

# 30. Block System

Portfolio 콘텐츠는 자유형 HTML이 아니라 **정해진 고품질 Block 조합 방식**으로 작성한다.

Wix처럼 모든 요소를 자유 좌표로 배치하는 Page Builder는 만들지 않는다.

Block 기본 구조:

```text
Block
├─ type
├─ schemaVersion
├─ data
├─ settings
└─ position

```

`data`와 `settings`는 분리한다.

---

# 31. 기본 Block Types

## Content

```text
heading
text
quote
divider
spacer

```

## Media

```text
image
gallery
video

```

## Portfolio

```text
hero
process
before_after
metrics

```

## Technical

```text
code
tech_stack

```

새로운 Block Type을 쉽게 추가할 수 있어야 한다.

---

# 32. Block Renderer

동일 데이터라도 플랫폼마다 다른 Renderer를 사용할 수 있게 한다.

```text
Block Data

├─ Web Renderer
└─ Mobile Renderer

```

예:

```text
Gallery

Desktop
→ Grid / Masonry

Mobile
→ Swipe / Single Column

```

데이터 구조는 공유한다.

---

# 33. Block Versioning

Block에는 반드시 다음 필드를 둔다.

```text
schemaVersion

```

Block 구조가 변경될 경우 기존 데이터를 마이그레이션할 수 있어야 한다.

---

# 34. Backend

기본 Backend는 Supabase를 사용한다.

사용 기능:

- PostgreSQL
- Auth
- Storage
- RLS

---

# 35. Identity

Google 로그인 중심.

Supabase Auth 사용.

기본 Role:

```text
user
editor
admin

```

관리자 본인은:

```text
admin

```

---

# 36. Google OAuth 구조

사이트 로그인:

```text
Google Account
↓
Supabase Auth
↓
Pluto Session

```

Drive / YouTube API 권한은 사이트 로그인 권한과 별도로 관리한다.

로그인할 때 모든 Google 권한을 한 번에 요청하지 않는다.

Incremental Authorization을 사용한다.

예:

```text
Cloud App 최초 실행
→ Drive 권한 요청

YouTube 기능 최초 실행
→ YouTube 권한 요청

```

Refresh Token 등 민감한 인증 정보는 브라우저 LocalStorage에 장기간 저장하지 않는다.

서버 측 안전한 영역에서 관리한다.

---

# 37. Database 영역

DB는 다음 영역으로 논리적으로 구분한다.

```text
01 Identity
02 Portfolio CMS
03 Media
04 Workspace
05 App System
06 System / Configuration

```

---

# 38. 주요 DB Tables

기본 후보:

```text
profiles

contents
content_blocks

categories
tags
content_categories
content_tags

media

workspaces
workspace_layout

apps
app_state

notes
tasks

notifications
user_settings

navigation
site_settings

```

필요에 따라 확장한다.

---

# 39. contents

공통 콘텐츠 테이블.

예:

```text
id
type
slug

title
summary

status
visibility

thumbnail_media_id

featured
featured_order

created_by

created_at
updated_at
published_at

```

type 예:

```text
artwork
project
process
page

```

새 종류를 추가할 수 있어야 한다.

---

# 40. content_blocks

```text
id
content_id

block_type
position

data
settings

created_at
updated_at

```

---

# 41. Media System

파일 자체와 DB Metadata를 분리한다.

DB 예:

```text
id
owner_id

type
bucket
path

filename
mime_type

width
height
size

alt_text

created_at
updated_at

```

---

# 42. Storage Buckets

권장:

```text
public-media
portfolio-originals
workspace-files
avatars
temp

```

원본 작품과 웹 공개 이미지를 분리한다.

Public Portfolio에서 고해상도 원본을 그대로 전송하지 않는다.

필요 시:

```text
Original
Preview
Thumbnail

```

계층을 사용한다.

---

# 43. Workspace Layout

Desktop / Tablet / Mobile Layout을 분리한다.

```text
device_type

desktop
tablet
mobile

```

PC Window 위치를 모바일 Layout에 그대로 사용하지 않는다.

---

# 44. App System

App Registry 사용.

앱 기본 규격:

```text
APP
├─ Manifest
├─ UI
├─ Commands
├─ Permissions
└─ Data

```

---

# 45. App Manifest

예:

```json
{
  "id": "notes",
  "name": "Notes",
  "version": "1.0.0",
  "platforms": [
    "desktop",
    "mobile"
  ],
  "permissions": [
    "storage.read",
    "storage.write"
  ],
  "window": {
    "minWidth": 320,
    "minHeight": 240,
    "defaultWidth": 600,
    "defaultHeight": 500,
    "resizable": true
  }
}

```

구분:

```text
Manifest
= App 자체 규격

Database
= 설치 상태 / 사용자 설정 / 실행 상태

```

---

# 46. App Lifecycle

모든 App이 공통 Lifecycle 규칙을 따르도록 한다.

개념:

```text
mount()
unmount()

activate()
deactivate()

saveState()
restoreState()

```

실제 React 구조에서 더 적절한 패턴이 있다면 같은 목적을 유지하면서 개선할 수 있다.

---

# 47. Workspace SDK

장기적으로 공통 SDK를 구성한다.

예:

```text
@pluto/app-sdk

```

제공 서비스:

```text
Auth
Storage
Notifications
Windows
Commands
Media
User
Workspace

```

각 App이 시스템 내부 구현에 직접 접근하지 않는다.

SDK 또는 공통 Service Layer를 사용한다.

---

# 48. Mobile 확장

향후 Android / iOS App을 구축할 수 있어야 한다.

기본 후보:

```text
Expo
React Native
TypeScript

```

Public Portfolio는 Next.js Web으로 유지한다.

Workspace와 Admin에 Mobile Client를 추가한다.

---

# 49. Mobile UX 원칙

Desktop Workspace를 모바일 화면에 단순 축소하지 않는다.

Desktop:

```text
Desktop
Dock
Windows

```

Mobile:

```text
Home
Apps
Search
Notifications
Settings

```

기능과 데이터는 공유하고 UI Shell은 플랫폼별로 분리한다.

---

# 50. Monorepo

장기 구조 후보:

```text
pluto-archive/
│
├─ apps/
│   ├─ web/
│   └─ mobile/
│
├─ packages/
│   ├─ database/
│   ├─ types/
│   ├─ api/
│   ├─ app-sdk/
│   ├─ block-system/
│   └─ utils/
│
└─ supabase/
    ├─ migrations/
    └─ functions/

```

현재 Mobile App을 아직 개발하지 않는다면 빈 Mobile App을 억지로 구현할 필요는 없다.

단, Mobile Client를 추가하기 쉬운 구조는 유지한다.

---

# 51. Database Migration

DB 변경 이력을 Migration으로 관리한다.

예:

```text
001_initial.sql
002_content_blocks.sql
003_notes.sql
004_app_registry.sql

```

Supabase Dashboard에서 직접 수정한 상태만으로 DB 구조를 관리하지 않는다.

---

# 52. Security

RLS 사용.

기본 권한:

```text
PUBLIC
→ published + public 콘텐츠 읽기

AUTHENTICATED
→ 자신의 Workspace 데이터

EDITOR
→ Portfolio 콘텐츠 관리

ADMIN
→ 전체 관리

```

Frontend UI에서 Role만 검사하고 끝내지 않는다.

Database에서도 접근 권한을 검증한다.

Service Role Key 등 서버 전용 Secret을 Client Bundle에 절대 노출하지 않는다.

---

# 53. 기본 기술 스택

현재 기본 후보:

```text
Next.js
React
TypeScript

Supabase
PostgreSQL

Monaco Editor

IndexedDB
필요한 경우 Local Cache

Expo / React Native
향후 Mobile

```

상태관리 라이브러리는 필요성이 확인됐을 때 Zustand 같은 경량 도구를 검토한다.

불필요한 라이브러리를 미리 추가하지 않는다.

---

# 54. Public Design System

기본 색상:

```text
Background
#1A0101

Point
Silver

Text
#EDFFFE

```

확장 Palette:

```text
Background Primary    #1A0101
Background Secondary  #220505
Surface               #260808

Text Primary          #EDFFFE
Text Secondary        #AEB8B8

Silver Primary        #C8CBCB
Silver Bright         #F1F4F4
Silver Muted          #707777

Border                #494545

```

디자인 방향:

```text
Modern
Clean
Editorial
Gallery
Precision
High Contrast

```

Public은 작품 자체가 중심이다.

작품을 불필요한 Card Container로 지나치게 둘러싸지 않는다.

---

# 55. Private Design System

기본:

```text
Background
#262730

Highlight
#00E622

Lighting
#000B80

Text
#FFFFFF

```

확장 Palette:

```text
Background Primary   #262730
Background Deep      #1D1E25

Surface              #2D2E38
Surface Raised       #343640

Text Primary         #FFFFFF
Text Secondary       #A7A9B2
Text Disabled        #676A73

Highlight            #00E622
Highlight Dim        #00A81A

Lighting             #000B80
Lighting Bright      #1526B8

Border               #41434D

```

성격:

```text
Professional
Codespace
Technical
Efficient
Dense
Precise

```

Green은 남발하지 않는다.

Green 사용:

```text
Active
Selected
Focus
Success
Progress
Current

```

Blue 사용:

```text
System
Environment
Secondary State
Selection Background

```

---

# 56. Admin Design System

기본:

```text
White
Black
Gold

```

확장 Palette:

```text
Background       #F5F4F0
Surface          #FFFFFF

Text             #111111
Text Secondary   #66635D

Gold             #B49345
Gold Bright      #D0B56B
Gold Dark        #75602F

Border           #D4D0C8
Strong Border    #111111

```

성격:

```text
Modern
Editorial
Premium
Clean
Administrative

```

Gold는 큰 면적보다 다음에 사용한다.

- Border
- Selected
- Published
- Important
- Accent

---

# 57. 공통 형태 디자인

둥근 UI보다 직선적이고 명확하게 끊기는 형태를 우선한다.

기본 Border Radius:

```text
0~4px

```

Pill UI를 남발하지 않는다.

주요 시각 요소:

- Straight Line
- Grid
- Frame
- Thin Border
- Corner Marker
- Cut Corner
- L-Line

---

# 58. Pluto Archive 공통 시각 언어

L-Line / Partial Frame을 공통 디자인 요소로 사용한다.

예:

```text
┌──── 01 / WORK
│
│

```

완전히 닫힌 Box뿐 아니라 일부만 존재하는 Frame을 사용한다.

색상:

```text
Public
→ Silver

Private
→ Green

Admin
→ Gold

```

---

# 59. Shadow / Glow

일반적인 Drop Shadow와 Blur Glow는 거의 사용하지 않는다.

깊이는 다음으로 표현한다.

- 배경 명도 차이
- Surface 차이
- Border
- Grid
- Typography

---

# 60. Hover

사이트 전체 공통 인터랙션.

Hover 시 해당 영역의 Point Color가 테두리를 따라 활성화된다.

```text
Public
→ Silver

Private
→ #00E622

Admin
→ Gold

```

빛이 주변으로 퍼지는 Box Shadow가 아니라 **네온 튜브처럼 선 자체가 켜지는 느낌**으로 만든다.

필요하다면 약:

```text
120~180ms

```

Border Draw Animation을 사용할 수 있다.

---

# 61. Hover / Selected 구분

Hover:

```text
Accent Border

```

Selected:

```text
Accent Border
+
Corner Marker
또는
Small System Label

```

상태를 색상 하나에만 의존하지 않는다.

---

# 62. Typography

공통적으로 다음 계열을 사용한다.

- Display Sans
- Readable Body Sans
- Monospace Metadata

예:

```text
PROJECT / 018

STATUS ACTIVE

UPDATED 2026.09.23

```

작은 System Label과 Metadata 표현을 Pluto Archive 디자인 DNA로 활용한다.

---

# 63. Icons

Stroke 기반 Line Icon 사용.

기준:

- 얇은 Stroke
- 기하학적 형태
- 직선 중심
- 불필요한 3D 금지
- 과한 Gradient 금지

---

# 64. Layout

12 Column Grid 기반을 우선 고려한다.

공간별 밀도:

```text
Public
→ Low Density / Large Whitespace

Private
→ High Density / Compact

Admin
→ Medium Density / Structured

```

---

# 65. Spacing

기본 후보:

Public:

```text
64 / 96 / 128

```

Workspace:

```text
8 / 12 / 16 / 24

```

Admin:

```text
16 / 24 / 32 / 48

```

실제 구현에서는 Design Token으로 관리한다.

---

# 66. Motion

UI 반응은 빠르고 정밀하게 한다.

기본 후보:

```text
Micro
100~150ms

Normal
180~240ms

Large
300~400ms

```

Public에서는 일부 연출을 허용한다.

Workspace와 Admin은 생산성과 반응 속도를 우선한다.

---

# 67. Texture

Public:

```text
거의 없음

```

Workspace:

```text
없음

```

Admin:

```text
아주 미세한 Grain / Texture 허용

```

과한 Marble / Metal / Shine 효과는 피한다.

---

# 68. Performance

포트폴리오 자체가 성능 최적화 능력을 보여줘야 한다.

반드시 고려:

- Responsive Image
- Lazy Loading
- AVIF / WebP
- Thumbnail
- Code Splitting
- Dynamic Import
- Font Loading
- Cache
- Bundle Size
- Animation Cost
- Core Web Vitals
- 불필요한 Client Component 최소화

Next.js 사용 시 가능한 영역은 Server Component / Static Rendering을 활용한다.

Workspace처럼 Client State가 필요한 부분만 Client 영역으로 만든다.

---

# 69. Accessibility

디자인을 위해 접근성을 희생하지 않는다.

지원:

- Keyboard Navigation
- Focus State
- Semantic HTML
- ARIA
- Contrast
- Alt Text
- Reduced Motion

Hover 외에도 Keyboard Focus 상태가 명확해야 한다.

---

# 70. Responsive

단순 화면 축소 방식은 사용하지 않는다.

각 영역마다 Responsive UX를 별도로 설계한다.

Public:

```text
작품 감상 우선

```

Workspace Mobile:

```text
App Launcher 중심

```

Admin Mobile:

```text
콘텐츠 관리 중심

```

---

# 71. 개발 시 피해야 할 구조

다음 방식은 피한다.

- 모든 기능을 하나의 Component에 구현
- 모든 App 데이터를 하나의 JSON Column에 저장
- 콘텐츠를 JSX에 직접 하드코딩
- Categories를 코드에 하드코딩
- Google Secret을 Client에 노출
- 관리자 URL을 숨기는 것만으로 보안 처리
- Desktop Workspace를 Mobile에 단순 축소
- 새 App마다 Window System 재구현
- 새 App마다 Notification UI 재구현
- 자유 좌표형 Page Builder
- 과한 UI Library 의존
- 불필요한 Animation
- 불필요한 Glow
- 모든 Surface를 Card 형태로 만들기
- 무분별한 Border Radius
- 장기 확장성을 크게 훼손하는 임시 구현

---

# 72. 개발 단계

기능을 한 번에 모두 완성하려 하지 않는다.

기본 Phase:

```text
Phase 01
Project Foundation

Phase 02
Database / Auth / Security

Phase 03
Public Portfolio

Phase 04
Admin CMS

Phase 05
Block Editor

Phase 06
Workspace Core

Phase 07
Core Apps

Phase 08
Google Integration

Phase 09
Optimization

Phase 10
Mobile Client

```

의존 관계에 따라 세부 순서는 조정할 수 있다.

---

# 73. 작업 방식

각 작업 시작 시:

```text
1. 기존 코드 확인
2. 관련 구조 확인
3. 변경 범위 판단
4. 기존 기능 영향 확인
5. 구현
6. TypeScript 오류 확인
7. Build 확인
8. 주요 기능 확인
9. Regression 확인
10. 불필요한 코드 정리

```

작은 단위로 완료하고 검증한다.

---

# 74. 오류 수정 원칙

오류 발생 시 증상만 임시로 막지 않는다.

다음 순서로 분석한다.

```text
Symptom
↓
Cause
↓
Affected Area
↓
Root Cause
↓
Minimal Fix
↓
Regression Check

```

기존 기능이 깨지지 않았는지 반드시 확인한다.

---

# 75. Documentation

중요한 구조적 결정은 Repository 안에 문서화한다.

기본:

```text
/docs
├─ architecture.md
├─ roadmap.md
├─ database.md
├─ app-system.md
├─ block-system.md
├─ design-system.md
├─ auth.md
└─ progress.md

```

AI나 개발자가 프로젝트 구조를 매번 다시 추측하게 만들지 않는다.

---

# 76. Progress Persistence

Pluto Archive는 장기 프로젝트이므로 다음 상황이 발생하더라도 작업을 이어갈 수 있어야 한다.

- AI Model 변경
- AI 사용량 제한
- 새 대화 시작
- Codespaces 재접속
- 개발 중단
- 브라우저 종료
- 장기간 작업 중지

대화 기록 자체를 프로젝트의 유일한 기억장치로 사용하지 않는다.

Repository를 **Source of Truth**로 사용한다.

---

# 77. progress.md

다음 파일을 항상 유지한다.

```text
/docs/progress.md

```

현재 프로젝트 개발 상태를 기록하는 단일 기준 문서다.

기본 구조:

```text
# Pluto Archive Progress

## Current Phase
현재 개발 단계

## Completed
완료된 작업

## In Progress
현재 진행 중인 작업

## Next
다음 작업

## Pending
아직 시작하지 않은 작업

## Known Issues
현재 확인된 문제

## Decisions
최근 확정된 중요한 설계 결정

## Last Modified
마지막 수정 시점

```

---

# 78. Progress 갱신 시점

다음 상황에서는 `/docs/progress.md`를 갱신한다.

- 하나의 기능 구현 완료
- 하나의 Phase 완료
- 중요한 Subtask 완료
- 대규모 코드 수정 완료
- DB Schema 변경
- Architecture 변경
- 새로운 App 추가
- 새로운 Block 추가
- Design System 변경
- Auth 구조 변경
- Security 구조 변경
- 외부 API 연동 추가
- 작업 중단 직전
- AI 모델 변경 직전
- 사용량 제한에 가까워졌을 때
- Codespaces 세션 종료 전
- 다음 세션에서 이어서 작업해야 하는 상태

---

# 79. Progress 기록 방식

단순히:

```text
로그인 완료
UI 완료

```

처럼 기록하지 않는다.

구체적으로 기록한다.

좋은 예:

```text
## Completed

- Supabase 기본 연결 완료
- profiles 테이블 생성
- Google OAuth 로그인 구현
- admin role 확인 로직 추가
- Public Header 기본 레이아웃 구현

```

---

# 80. 미완료 작업 기록

기능이 완전히 끝나지 않았다면 정확히 어느 지점까지 진행했는지 기록한다.

예:

```text
## In Progress

### Admin Block Editor

Completed:
- Block 목록 렌더링
- Drag & Drop 순서 변경
- Heading Block 추가

Remaining:
- Gallery Block Editor
- Metrics Block Editor
- Preview 연동
- Validation

```

다음 작업자가 현재 상태를 추측하지 않아도 되게 한다.

---

# 81. Known Issues

해결되지 않은 오류를 숨기지 않는다.

예:

```text
## Known Issues

- Google OAuth refresh token 저장 방식 미완성
- Mobile Gallery Renderer 미구현
- Safari에서 Border Draw Animation 확인 필요

```

이미 알려진 문제를 다음 세션에서 다시 처음부터 조사하지 않도록 한다.

---

# 82. Decisions

Architecture나 디자인의 중요한 결정은 기록한다.

예:

```text
## Decisions

- Public Portfolio는 Next.js 유지
- Workspace / Admin Mobile Client는 Expo 후보
- Block 데이터와 Renderer 분리
- Google 권한은 Incremental Authorization 사용
- Private Green은 Active State 중심으로 제한

```

---

# 83. 작업 재개 규칙

새로운 AI Model 또는 새로운 세션에서 프로젝트를 이어갈 때 바로 코딩하지 않는다.

먼저 다음을 확인한다.

```text
1. Repository 구조
2. AGENTS.md 또는 Master Prompt
3. /docs/progress.md
4. /docs/architecture.md
5. 관련 Domain 문서
6. 최근 Git Commit
7. 현재 Build 상태
8. In Progress 항목
9. Known Issues
10. Next 항목

```

그 후 작업을 이어간다.

---

# 84. 모델 변경 대응

예:

```text
Astra
↓
사용량 제한
↓
Sol
↓
Astra 사용량 복구
↓
Astra

```

처럼 AI Model이 바뀌어도 프로젝트 구조와 진행상태는 Repository 문서를 기준으로 유지한다.

모델 기억에 의존하지 않는다.

---

# 85. Handoff 기록

작업을 다른 Model 또는 다음 세션에 넘겨야 한다면 `/docs/progress.md`에 다음 정보를 남긴다.

```text
현재 작업
현재까지 완료된 부분
남은 부분
수정한 파일
관련 DB Migration
Known Issue
다음 권장 작업

```

필요하다면 다음 형식을 추가한다.

```text
## Handoff

Current Task:
...

Files Modified:
- ...
- ...

Database Changes:
- ...

Important Context:
- ...

Recommended Next Action:
...

```

---

# 86. Git Commit 전략

가능하면 기능 단위로 작은 Commit을 유지한다.

예:

```text
feat(auth): add Google authentication

feat(cms): add content block model

feat(notes): add sticky note persistence

fix(workspace): restore window state correctly

```

서로 관계없는 여러 기능을 하나의 거대한 Commit에 묶지 않는다.

진행상태 문서와 Commit History가 함께 프로젝트 기록 역할을 하도록 한다.

---

# 87. 완료 기준

기능이 화면에서 한 번 동작했다고 해서 완료로 판단하지 않는다.

가능한 경우 다음을 확인한다.

```text
TypeScript
Build
Lint
Runtime
Authentication
Permissions
Responsive
Accessibility
Error Handling
Regression

```

관련 문서와 `progress.md`도 갱신되어야 한다.

---

# 88. 최종 개발 철학

Pluto Archive는 세 개의 별도 사이트가 아니다.

하나의 플랫폼이다.

```text
PUBLIC
= 보여주는 공간

WORKSPACE
= 사용하는 공간

ADMIN
= 관리하는 공간

```

공통 Backend와 Domain Model을 사용한다.

구조적 원칙:

```text
CONTENT
→ Block

FUNCTION
→ App

PLATFORM
→ Client

DESIGN
→ Shared Design Language

```

기능이나 콘텐츠가 증가할수록 기존 코드를 갈아엎는 구조가 아니라 새로운 모듈을 추가하면 자연스럽게 확장되는 구조를 목표로 한다.

다만 미래 확장을 이유로 현재 필요하지 않은 복잡한 시스템까지 미리 구현하는 Overengineering은 피한다.

최종 원칙:

> **현재 필요한 만큼 구현하되, 다음 확장을 막지 않는 구조를 선택한다.**

---

# 89. 최초 실행 지침

이 프롬프트를 읽은 직후 코드를 무작정 작성하지 않는다.

먼저 Repository를 분석한다.

그 후 다음 내용을 보고한다.

```text
1. 현재 프로젝트 구조
2. 이미 구현된 기능
3. 미구현 기능
4. 현재 설계와 충돌하는 구조
5. 유지 가능한 기존 구조
6. 권장 Architecture
7. 개발 Phase별 계획
8. 현재 가장 먼저 구현해야 할 작업
9. 현재 Known Issues
10. 더 나은 개선 가능성

```

명확하게 더 좋은 구조가 발견될 경우 다음 제목으로 구분한다.

```text
Improvement Proposal

```

그러나 사용자가 확정한 요구사항이나 디자인 의도를 임의로 삭제하거나 변경하지 않는다.

분석 후 Foundation부터 단계적으로 구현한다.

---

# 90. 작업 중 지속 규칙

프로젝트 작업 전반에서 항상 다음 질문을 스스로 확인한다.

```text
이 구현이 기존 기능을 깨뜨리는가?

이 데이터가 코드에 하드코딩되어야 하는가?

새 App을 추가할 때 Core를 수정해야 하는가?

새 Block을 추가할 때 기존 Block을 수정해야 하는가?

Mobile Client를 추가했을 때 이 구조를 재사용할 수 있는가?

보안 검증이 Client에만 존재하지 않는가?

현재 구현이 지나치게 복잡하지 않은가?

더 단순하면서 확장 가능한 방법이 있는가?

현재 진행상태가 Repository에 기록되어 있는가?

```

이 기준을 지속적으로 유지한다.
