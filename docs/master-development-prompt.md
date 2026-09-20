# Pluto Archive — Master Development Prompt

너는 이 프로젝트의 **시니어 웹 아키텍트, 프론트엔드 개발자, 백엔드 개발자, UI/UX 디자이너, 성능 최적화 담당자** 역할을 동시에 수행한다.

이 프로젝트의 이름은 **Pluto Archive**이다.

목표는 단순한 포트폴리오 사이트를 만드는 것이 아니라,

1. 외부 방문자에게 나를 보여주는 **Public Portfolio**
2. 개인 작업을 통합하는 **Private Workspace**
3. 사이트 콘텐츠를 코드 수정 없이 관리하는 **Admin CMS**
4. 향후 Android/iOS 앱으로 확장 가능한 공통 플랫폼

을 하나의 프로젝트 안에서 구축하는 것이다.

---

# 0. 가장 중요한 개발 원칙

아래 원칙은 프로젝트 전체에서 최우선으로 유지한다.

## 기존 구조 우선

새 기능을 추가하기 전에 반드시 기존 프로젝트 구조, 데이터 흐름, 컴포넌트, 타입, API, DB 스키마를 먼저 확인한다.

기존 기능을 무시하고 새 구조를 중복 생성하지 않는다.

## 최소 변경

기존 기능을 보존하면서 필요한 부분만 수정한다.

한 기능을 추가하기 위해 관계없는 영역을 대규모로 재작성하지 않는다.

## 확장 가능성

현재 기능만 작동하도록 하드코딩하지 않는다.

새 콘텐츠, 새 앱, 새 Block, 새 플랫폼이 추가될 가능성을 고려한다.

## 코드와 콘텐츠 분리

원칙:

CODE = 기능 + 디자인 시스템 + Renderer
DATA = 작품 + 프로젝트 + 텍스트 + 미디어 + 카테고리
CONFIG = 사이트 설정 + 앱 설정

콘텐츠를 추가하거나 수정하기 위해 사이트 코드를 수정해야 하는 구조를 만들지 않는다.

## 더 나은 가능성 제안

내가 요구한 방법보다 다음 기준에서 명확하게 더 나은 방법이 있다면 **구현 전에 제안할 수 있다.**

* 성능
* 보안
* 유지보수성
* 확장성
* 코드 복잡도
* UX/UI
* 접근성
* 모바일 대응
* 장기적인 운영 비용

단, 단순히 취향이 다르다는 이유로 기존 방향을 임의로 변경하지 않는다.

더 나은 방법을 제안할 경우:

* 현재 방식
* 제안 방식
* 변경 이유
* 장점
* 단점
* 기존 구조에 미치는 영향

을 짧게 설명한다.

명백한 개선이 아니라면 기존 설계를 유지한다.

---

# 1. 전체 시스템 구조

Pluto Archive는 크게 세 공간으로 나눈다.

```text
PLUTO ARCHIVE
│
├─ PUBLIC SPACE
│
├─ PRIVATE SPACE
│
└─ ADMIN SPACE
```

세 공간은 서로 다른 목적과 UI를 가지지만 동일한 디자인 DNA와 공통 백엔드를 사용한다.

---

# 2. Public Space

목적:

외부 방문자에게 나를 소개하는 포트폴리오.

특히 다음 능력을 보여준다.

* Illustration / Artwork
* 꼼꼼한 디자인 구성 능력
* 구조적인 사고
* UI/UX 능력
* 웹 개발 능력
* 성능 최적화 능력

단순 작품 갤러리가 아니라 결과물과 제작 과정 및 기술적 판단을 함께 보여준다.

## 페이지

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

# 3. Public Home

권장 콘텐츠 흐름:

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

Public Home은 전체 포트폴리오를 압축해서 보여주는 역할을 한다.

---

# 4. Works

그림 중심 공간.

기본 분류 예:

```text
Featured
Illustration
Character
Concept
Sketch
Archive
```

카테고리는 코드에 하드코딩하지 않는다.

DB에서 관리할 수 있어야 한다.

작품 상세 페이지는 Block System으로 구성한다.

---

# 5. Projects

그림 이외의 프로젝트.

예:

* Web
* UI/UX
* Programming
* Design
* Experimental

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

# 6. Process

결과물보다 작업 사고 과정을 보여주는 공간.

예:

* Planning
* Design System
* Workflow
* Development
* Optimization
* Refactoring
* Before / After

실제 수치를 보여줄 수 있으면 적극적으로 사용한다.

예:

```text
Image Size
8.2MB → 1.4MB
```

---

# 7. Private Workspace

목적:

평소 작업하면서 여러 프로그램을 각각 실행해야 하는 불편함을 줄이고, 자주 사용하는 기능을 하나의 작업 플랫폼에서 제공한다.

브라우저 안에 완전한 운영체제를 구현하지 않는다.

필요한 기능만 App 형태로 제공한다.

Private Space는 일반 웹페이지가 아니라 **Workspace Application**처럼 동작한다.

---

# 8. Workspace System

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

# 9. 기본 Workspace Apps

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

향후 앱을 쉽게 추가할 수 있어야 한다.

새 앱을 추가하기 위해 Workspace 핵심 코드를 수정하는 구조는 피한다.

---

# 10. Music App

오른쪽 상단 또는 시스템 영역에 작은 음악 컨트롤을 제공한다.

예:

```text
♪ Song Name    ▶
```

확장하면:

* Album Art
* Title
* Previous
* Play / Pause
* Next
* Volume
* Playlist

YouTube Music 웹사이트 자체를 강제로 iframe으로 넣지 않는다.

공식적으로 가능한 YouTube Player / Playlist 방식 중심으로 구현한다.

YouTube 계정 기능이 필요한 경우 Google OAuth를 사용한다.

---

# 11. Cloud App

초기 클라우드는 Google Drive 연동을 우선한다.

사이트 로그인과 동일한 Google 계정을 기반으로 연결한다.

단:

사이트 로그인 권한과 Google Drive 접근 권한은 분리한다.

사용자가 Cloud 앱을 최초 실행할 때 필요한 Drive OAuth Scope만 추가 요청한다.

최소 권한 원칙을 따른다.

가능하다면 `drive.file`처럼 제한된 Scope를 우선 검토한다.

전체 Drive 관리 기능이 반드시 필요한 경우에만 더 넓은 권한을 사용한다.

---

# 12. Notes App

Sticky Note 중심.

지원:

* 새 메모 생성
* 삭제
* 수정
* 이동
* 크기 조절
* 색상
* Pin
* 검색
* Quick Note

데이터는 서버 동기화 가능 구조로 만든다.

UI 위치 정보와 메모 본문 데이터는 분리한다.

---

# 13. Code App

Desktop VS Code 자체를 웹에 억지로 삽입하지 않는다.

VS Code 스타일 작업 환경을 만든다.

앱 이름은 내부적으로:

```text
Code
```

를 사용한다.

권장 에디터:

Monaco Editor 계열.

초기 기능:

* File Explorer
* Tabs
* Code Editor
* Search
* Syntax Highlight
* Theme

향후:

* Terminal
* Git
* GitHub
* Preview

확장을 고려한다.

---

# 14. Files App

Cloud와 역할을 구분한다.

Files:

Workspace 내부 파일 관리.

Cloud:

Google Drive 같은 외부 저장소 연결.

---

# 15. Tasks App

기본 작업 관리.

지원:

* Todo
* Status
* Priority
* Due Date
* Today
* Completed

---

# 16. Reference App

그림 작업 참고자료 관리.

지원 확장 가능 기능:

* Images
* Collections
* Tags
* Favorite
* Pin
* Color Reference
* Pose Reference
* Moodboard

---

# 17. Timer

지원:

* Timer
* Stopwatch
* Pomodoro
* Custom Timer

---

# 18. Command Palette

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

각 앱은 자신의 Command를 등록한다.

Command Palette가 앱 내부 코드를 직접 알지 않도록 한다.

---

# 19. Notification System

각 앱에서 별도로 알림 UI를 만들지 않는다.

공통 Notification System을 사용한다.

예:

* Upload Complete
* Save Complete
* Timer Complete
* Error
* Sync Complete

---

# 20. Admin Space

관리자 로그인 후 사이트 콘텐츠를 코드 수정 없이 관리한다.

URL 예:

```text
/admin
```

Workspace에서 Admin 앱 형태로 진입할 수도 있지만 시스템 라우팅은 독립적으로 유지한다.

---

# 21. Admin 기능

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

# 22. Portfolio CMS

관리자는 새 콘텐츠를 생성할 수 있다.

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

# 23. Draft / Preview / Publish

반드시 지원한다.

```text
Draft
↓
Preview
↓
Publish
```

Draft는 일반 사용자에게 노출하지 않는다.

---

# 24. Featured

Home의 대표 작품 역시 코드에서 관리하지 않는다.

Admin에서 순서를 관리한다.

예:

```text
1 Work B
2 Work A
3 Work F
```

---

# 25. Categories / Tags

코드 하드코딩 금지.

관리자가 추가/수정/삭제할 수 있게 한다.

---

# 26. Navigation

Public Navigation도 Admin에서 관리할 수 있게 한다.

지원:

* 순서 변경
* 표시/숨김
* Label
* URL

---

# 27. Site Settings

예:

* Site Name
* Logo
* Profile
* Introduction
* Social Links
* Contact
* Default SEO Image
* Portfolio Status

---

# 28. Block System

Portfolio 콘텐츠는 자유형 HTML이 아니라 **정해진 고품질 Block 조합** 방식으로 작성한다.

Wix처럼 모든 요소를 자유 좌표로 배치하는 페이지 빌더는 만들지 않는다.

Block 구조:

```text
Block
├─ type
├─ schemaVersion
├─ data
├─ settings
└─ position
```

`data`와 `settings`를 분리한다.

---

# 29. 기본 Block 규격

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

새로운 Block type을 쉽게 추가 가능하게 한다.

---

# 30. Block Renderer

동일 데이터라도 플랫폼마다 다른 Renderer를 사용할 수 있게 한다.

```text
Block Data

├─ Web Renderer
└─ Mobile Renderer
```

예:

Gallery:

Desktop → Grid / Masonry
Mobile → Swipe / Single Column

데이터 구조는 공유한다.

---

# 31. Block Versioning

Block에는 반드시:

```text
schemaVersion
```

을 둔다.

향후 Block 구조 변경 시 기존 데이터를 마이그레이션할 수 있어야 한다.

---

# 32. Backend

기본 백엔드는 Supabase를 사용한다.

사용 기능:

* PostgreSQL
* Auth
* Storage
* RLS

---

# 33. Identity

Google 로그인 중심.

Supabase Auth를 사용한다.

역할:

```text
user
editor
admin
```

현재 관리자 본인은 `admin`.

---

# 34. Google OAuth 정책

사이트 로그인:

```text
Google Account
↓
Supabase Auth
↓
Pluto Session
```

Drive / YouTube API 권한은 사이트 로그인 권한과 별도로 관리한다.

로그인 시 모든 Google 권한을 한꺼번에 요구하지 않는다.

Incremental Authorization 사용.

예:

Cloud 최초 실행 → Drive 권한 요청
YouTube 기능 최초 실행 → YouTube 권한 요청

Refresh Token 등 민감한 인증 정보는 브라우저 localStorage에 장기 저장하지 않는다.

서버 측 안전한 영역에서 관리한다.

---

# 35. Database 영역

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

# 36. 주요 DB Tables

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

# 37. `contents`

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

새 종류 추가 가능.

---

# 38. `content_blocks`

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

# 39. Media System

파일 자체와 DB 레코드를 분리한다.

DB에는:

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

등을 저장한다.

---

# 40. Storage Buckets

권장:

```text
public-media
portfolio-originals
workspace-files
avatars
temp
```

원본 작품과 웹 공개 이미지를 분리한다.

Public에서 고해상도 원본을 그대로 사용하지 않는다.

필요 시:

```text
Original
Preview
Thumbnail
```

계층으로 관리한다.

---

# 41. Workspace Layout

Desktop / Tablet / Mobile 레이아웃을 분리한다.

```text
device_type

desktop
tablet
mobile
```

PC의 창 위치를 모바일에서 그대로 사용하지 않는다.

---

# 42. App System

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

# 43. App Manifest

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

Manifest = App 자체 규격.

DB = 설치 상태 / 사용자 설정 / 실행 상태.

두 개를 분리한다.

---

# 44. App Lifecycle

모든 App이 공통 Lifecycle 인터페이스를 따르도록 설계한다.

개념:

```text
mount()
unmount()

activate()
deactivate()

saveState()
restoreState()
```

실제 구현 시 React 구조와 맞지 않는 부분이 있다면 더 적절한 패턴으로 변경 가능하지만 목적은 유지한다.

---

# 45. Workspace SDK

장기적으로 공통 SDK를 만든다.

예:

```text
@pluto/app-sdk
```

서비스:

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

각 앱에서 시스템 내부 구현에 직접 접근하지 않는다.

SDK 또는 Service Layer를 사용한다.

---

# 46. Mobile 확장

향후 Android / iOS 앱을 만들 수 있어야 한다.

후보:

```text
Expo
React Native
TypeScript
```

Public Portfolio는 Next.js Web으로 유지한다.

Workspace와 Admin은 Mobile Client를 추가할 수 있게 한다.

중요:

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

기능/데이터는 공유하고 Shell은 다르게 만든다.

---

# 47. Monorepo

장기적인 기본 구조 후보:

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

현재 단계에서 mobile 앱이 아직 없다면 빈 앱을 억지로 구현할 필요는 없다.

단 구조와 공통 패키지는 향후 추가 가능한 형태로 유지한다.

---

# 48. DB Migration

DB 수정 이력을 Migration으로 관리한다.

예:

```text
001_initial.sql
002_content_blocks.sql
003_notes.sql
004_app_registry.sql
```

Dashboard에서 임의 수정만 반복하는 운영은 피한다.

---

# 49. Security

RLS 사용.

기본 정책:

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

DB에서도 권한을 검증한다.

Service Role Key 등 서버 전용 Secret을 클라이언트 번들에 노출하지 않는다.

---

# 50. 기술 스택

현재 기본 후보:

```text
Next.js
React
TypeScript

Supabase
PostgreSQL

React Router 역할 → Next.js Routing

Monaco Editor

IndexedDB
필요한 경우 Local Cache

Expo / React Native
향후 Mobile
```

상태관리는 필요성이 확인될 때 Zustand 같은 경량 상태 관리 도구를 검토한다.

불필요한 라이브러리를 미리 추가하지 않는다.

---

# 51. PUBLIC DESIGN SYSTEM

Public Space 디자인:

```text
Background
#1A0101

Main Point
Silver

Text
#EDFFFE
```

확장 후보:

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

불필요한 카드 컨테이너로 작품을 지나치게 둘러싸지 않는다.

---

# 52. PRIVATE DESIGN SYSTEM

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

확장 후보:

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

사용:

```text
Active
Selected
Focus
Success
Progress
Current
```

Blue는:

```text
System
Environment
Secondary State
Selection Background
```

용도.

---

# 53. ADMIN DESIGN SYSTEM

기본:

```text
White
Black
Gold
```

확장 후보:

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

Gold는 큰 면적보다:

* Border
* Selected
* Published
* Important
* Accent

에 사용한다.

---

# 54. 공통 형태 디자인

사용자는 둥근 UI보다 직선적이고 명확하게 끊기는 형태를 선호한다.

따라서:

```text
Border Radius
0~4px
```

를 기본으로 한다.

Pill UI를 남발하지 않는다.

기본 요소:

* Straight Line
* Grid
* Frame
* Thin Border
* Corner Marker
* Cut Corner
* L-Line

---

# 55. L-Line / Frame

Pluto Archive의 공통 디자인 언어 중 하나.

예:

```text
┌──── 01 / WORK
│
│
```

완전히 닫힌 박스보다 부분적인 Frame을 사용할 수 있다.

색:

Public → Silver
Private → Green
Admin → Gold

---

# 56. Shadow / Glow

일반적인 Drop Shadow와 Blur Glow는 거의 사용하지 않는다.

깊이는:

* 배경 명도
* Surface 차이
* Border
* Grid
* Typography

로 표현한다.

---

# 57. Hover

사이트 전체 공통 인터랙션.

Hover 시:

해당 영역의 Point Color가 테두리를 따라 활성화된다.

Public:

Silver

Private:

Green

Admin:

Gold

Glow box-shadow가 아니라 **네온 튜브처럼 선 자체가 명확하게 켜지는 느낌**으로 만든다.

필요하면 120~180ms 정도의 빠른 Border Draw Animation을 사용한다.

---

# 58. Hover와 Selected 구분

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

상태를 색만으로 구분하지 않는다.

---

# 59. Typography

공통적으로:

* Display Sans
* Readable Body Sans
* Monospace Metadata

계열 사용.

예:

```text
PROJECT / 018
STATUS ACTIVE
UPDATED 2026.09.20
```

같은 작은 System Label을 디자인 DNA로 활용한다.

---

# 60. Icons

Stroke 기반 Line Icon.

* 얇은 Stroke
* 기하학적 형태
* 직선 중심
* 과한 3D/Gradient 금지

---

# 61. Layout

12 Column Grid 기반을 우선 고려한다.

공간별 밀도:

Public:

```text
Low Density
Large Whitespace
```

Private:

```text
High Density
Compact
```

Admin:

```text
Medium Density
Structured
```

---

# 62. Spacing

Public:

```text
64 / 96 / 128
```

등 넓은 간격.

Workspace:

```text
8 / 12 / 16 / 24
```

Admin:

```text
16 / 24 / 32 / 48
```

기본 후보.

실제 Responsive Layout에 맞게 Token화한다.

---

# 63. Motion

UI 반응은 빠르고 정밀하게.

기본 후보:

```text
Micro    100~150ms
Normal   180~240ms
Large    300~400ms
```

작업 도구에서 불필요하게 느린 애니메이션을 사용하지 않는다.

Public은 일부 연출 허용.

Workspace와 Admin은 생산성을 우선한다.

---

# 64. Texture

Public:

거의 없음.

Workspace:

없음.

Admin:

아주 미세한 Grain/Texture 허용.

과한 Marble / Metal / Shine 효과는 피한다.

---

# 65. Performance

포트폴리오 자체가 성능 최적화 능력을 보여줘야 한다.

반드시 고려:

* Responsive Image
* Lazy Loading
* AVIF/WebP
* Thumbnail
* Code Splitting
* Dynamic Import
* Font Loading
* Cache
* Bundle Size
* Animation Cost
* Core Web Vitals
* 불필요한 Client Component 최소화

Next.js 사용 시 가능한 부분은 Server Component / Static Rendering을 활용한다.

Workspace처럼 클라이언트 상태가 필요한 부분만 Client 영역으로 만든다.

---

# 66. Accessibility

디자인을 위해 접근성을 희생하지 않는다.

* Keyboard Navigation
* Focus State
* ARIA
* Semantic HTML
* Contrast
* Alt Text
* Reduced Motion

지원.

Neon Border Hover 외에도 Keyboard Focus 상태가 명확해야 한다.

---

# 67. Responsive

단순 화면 축소 방식 금지.

각 영역마다 Responsive UX를 별도로 설계한다.

Public:

작품 감상 우선.

Workspace Mobile:

앱 런처 중심.

Admin Mobile:

콘텐츠 관리 중심.

---

# 68. 개발 시 하지 말아야 할 것

다음 방식은 피한다.

* 모든 기능을 한 Component에 구현
* 모든 App 데이터를 하나의 JSON 컬럼에 저장
* 콘텐츠를 JSX에 하드코딩
* Categories를 코드에 하드코딩
* Google Secret을 Client에 노출
* 관리자 URL을 숨기는 것만으로 보안 처리
* Desktop Workspace를 모바일에 단순 축소
* 새 앱마다 Window System 재구현
* 새 앱마다 Notification UI 재구현
* 자유 좌표형 Page Builder
* 과한 UI Library 의존
* 불필요한 애니메이션
* 불필요한 Glow
* 모든 Surface를 Card 형태로 만드는 디자인
* 무분별한 Border Radius
* 단순한 편의를 위해 장기 확장성을 크게 훼손하는 구현

---

# 69. 개발 단계

기능을 한 번에 모두 완성하려 하지 않는다.

다음 순서를 기본으로 한다.

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

단, 의존성에 따라 순서는 조정 가능하다.

---

# 70. 작업 방식

각 작업을 시작할 때:

1. 기존 코드 확인
2. 관련 구조 확인
3. 변경 범위 판단
4. 기존 기능 영향 확인
5. 구현
6. TypeScript 오류 확인
7. Build 확인
8. 주요 기능 확인
9. 불필요한 코드 정리

가능하면 작업마다 작은 단위로 완료한다.

---

# 71. 오류 수정 원칙

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

# 72. Documentation

중요한 구조적 결정은 문서화한다.

예:

```text
/docs
├─ architecture.md
├─ database.md
├─ app-system.md
├─ block-system.md
├─ design-system.md
└─ auth.md
```

프로젝트가 커져도 AI와 개발자가 구조를 다시 추측하지 않도록 한다.

---

# 73. 최종 개발 철학

Pluto Archive는 세 개의 별도 사이트를 만드는 프로젝트가 아니다.

하나의 플랫폼이다.

```text
PUBLIC
= 보여주는 공간

WORKSPACE
= 사용하는 공간

ADMIN
= 관리하는 공간
```

세 공간은 공통 Backend와 Domain Model을 사용한다.

그리고:

```text
CONTENT → Block

FUNCTION → App

PLATFORM → Client

DESIGN → Shared Design Language
```

로 분리한다.

기능이나 콘텐츠가 증가할수록 기존 코드를 갈아엎어야 하는 구조가 아니라, **새로운 모듈을 추가하면 자연스럽게 확장되는 구조**를 목표로 한다.

현재 요구사항을 충족하는 것만을 목표로 하지 말고 향후 변경 비용이 낮은 구조를 우선한다.

그러나 미래를 예상한다는 이유로 사용하지도 않을 복잡한 기능을 미리 구현하는 Overengineering 역시 피한다.

항상:

**현재 필요한 만큼 구현하되, 다음 확장을 막지 않는 구조**

를 선택한다.

---

# 실행 지침

이 프롬프트를 읽은 후 바로 코드를 무작정 작성하지 않는다.

먼저 현재 Repository를 분석한다.

그 후 다음을 제시한다.

1. 현재 프로젝트 구조
2. 이미 구현되어 있는 부분
3. 부족한 부분
4. 이 설계와 충돌하는 기존 구조
5. 유지 가능한 기존 구조
6. 권장 Architecture
7. 개발 Phase별 실행 계획
8. 첫 번째로 구현해야 할 작업

명확하게 더 좋은 구조가 발견된다면 **“Improvement Proposal”**로 별도 표시한다.

단, 기존 요구사항과 디자인 의도를 임의로 삭제하거나 변경하지 않는다.

분석이 끝난 후 가장 기초적인 Foundation부터 단계적으로 구현한다.
