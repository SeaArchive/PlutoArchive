// Editorial content for the public site until CMS publishing is connected.
// Keep factual project claims tied to work visible in this repository.
export const projects = [
  {
    slug: "pluto-archive",
    title: "Pluto Archive",
    category: "WEB · UI/UX · DEVELOPMENT",
    status: "진행 중",
    summary:
      "그림과 프로젝트의 결과물, 그 과정의 판단을 한곳에서 보여주기 위한 포트폴리오 플랫폼.",
    repository: "https://github.com/SeaArchive/PlutoArchive",
    sections: [
      {
        label: "01 / PURPOSE",
        title: "결과와 과정을 함께 보여주기",
        paragraphs: [
          "작품 이미지만 나열하면 어떤 문제를 풀었고 왜 그런 선택을 했는지 전달하기 어렵습니다. Public Space는 작품, 프로젝트, 제작 과정이 서로 연결되도록 설계했습니다.",
          "작품은 넓은 이미지 면을 중심으로 보여주고, 프로젝트는 목표·선택·구현·검증을 읽을 수 있는 사례 형식으로 구성합니다.",
        ],
      },
      {
        label: "02 / DESIGN DECISIONS",
        title: "경계를 먼저 정리하기",
        paragraphs: [
          "방문자가 보는 Public Space와 개인 데이터가 들어가는 Workspace를 구분했습니다. 공개 페이지는 정적 배포가 가능하고, 개인 작업은 서버 인증과 사용자별 접근 제어가 필요한 구조입니다.",
          "기존 작품 기록을 지우지 않고 읽기 어댑터로 연결했습니다. 새 콘텐츠 구조로 옮기는 과정에서도 원본을 보존하는 방향을 택했습니다.",
        ],
      },
      {
        label: "03 / IMPLEMENTATION",
        title: "화면에서 데이터까지",
        paragraphs: [
          "Next.js·TypeScript로 페이지와 앱 경계를 구성하고, 작품 목록은 기존 공개 갤러리 데이터에서 읽습니다. GitHub Pages용 공개 스냅샷과 Node 서버용 개인 기능은 같은 소스에서 각기 다른 빌드로 제공합니다.",
          "작품의 이미지 영역과 Public 페이지 바탕을 #000817로 맞추고, 얇은 경계선과 타이포그래피로 정보의 순서를 구분했습니다.",
        ],
      },
      {
        label: "04 / VERIFICATION & NEXT",
        title: "확인한 것과 남은 것",
        paragraphs: [
          "저장소에는 타입 검사, 서버 빌드, 공개 페이지 링크·자산 검사와 데이터 접근 검사가 마련돼 있습니다. 변경 사항은 기능별 진행 기록에 남깁니다.",
          "관리자 CMS를 통한 게시, 더 많은 실제 프로젝트 사례, 개인 Workspace의 로그인·재접속 검증은 계속 진행 중입니다. 성능 개선 수치는 실측 자료가 준비되면 공개합니다.",
        ],
      },
    ],
  },
] as const;

export const processSteps = [
  {
    number: "01",
    title: "문제를 정의합니다",
    description:
      "방문자가 결과물에서 무엇을 알아야 하는지 정하고, 작품·과정·기술 기록을 어디에 배치할지 결정합니다.",
    example:
      "이 사이트에서는 작품 감상과 제작 판단을 각각 Works와 Projects/Process로 나눴습니다.",
  },
  {
    number: "02",
    title: "선택의 근거를 남깁니다",
    description:
      "기존 기록을 보존하면서 새로운 구조로 연결하고, 공개 화면과 개인 기능의 경계를 분명히 합니다.",
    example:
      "기존 갤러리 데이터는 읽기 어댑터를 거쳐 보여주고 원본은 유지합니다.",
  },
  {
    number: "03",
    title: "동작을 확인하고 고칩니다",
    description:
      "페이지 링크, 접근 권한, 화면 크기별 배치처럼 방문 경험에 영향을 주는 항목을 확인합니다.",
    example: "정적 공개 빌드에서 페이지와 로컬 자산의 연결을 검사합니다.",
  },
] as const;
