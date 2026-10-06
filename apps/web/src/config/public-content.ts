// Editorial content until CMS publishing is connected. Claims must remain grounded.
export const plannerProfile = {
  heading: "Planning through shared understanding",
  background:
    "I bring knowledge of illustration, development, and accounting to planning. I aim to understand what matters to each discipline and connect different perspectives through shared goals and requirements.",
  approach:
    "I see coordination as a core part of planning: helping teams work toward a shared direction. I continue to build knowledge across disciplines so I can understand their needs, constraints, and decision criteria.",
  direction:
    "My current focus is game and software planning. I keep the possibility of working across other industries and services open.",
  learning:
    "I plan to study law and explore reverse planning and original planning in practical fields such as legal services and e-commerce. These are learning plans, not completed project experience.",
  preview:
    "I aim to connect teams through knowledge of illustration, development, and accounting. Games and software are my current focus, with room to explore other practical fields.",
};
export const projects = [
  {
    slug: "pluto-archive",
    title: "Pluto Archive",
    category: "WEB · UI/UX · DEVELOPMENT",
    status: "In progress",
    summary:
      "A portfolio platform connecting artwork, projects, and the decisions behind them.",
    repository: "https://github.com/SeaArchive/PlutoArchive",
    sections: [
      {
        label: "01 / PURPOSE",
        title: "Show the work and the thinking",
        paragraphs: [
          "An image alone rarely explains the problem it addresses or the choices behind it. Public Space connects artwork, project cases, and process notes.",
          "Artwork gets room to breathe. Project cases explain their purpose, decisions, implementation, and verification.",
        ],
      },
      {
        label: "02 / DESIGN DECISIONS",
        title: "Define the boundaries first",
        paragraphs: [
          "Public Space is separated from the personal Workspace. Public content can be exported, while personal operations require server authentication and user-specific access control.",
          "An adapter connects existing artwork records without deleting the originals. This preserves source data while the content model evolves.",
        ],
      },
      {
        label: "03 / IMPLEMENTATION",
        title: "From interface to data",
        paragraphs: [
          "Next.js and TypeScript organize pages and application boundaries. Public artwork is read from the existing gallery. A separate static build provides a fallback snapshot and routes visitors to the live public site.",
          "Public pages and artwork surfaces share a #000817 background. Thin borders and typography establish the hierarchy.",
        ],
      },
      {
        label: "04 / VERIFICATION & NEXT",
        title: "Verified work. Open questions.",
        paragraphs: [
          "The repository includes type checks, production builds, public link and asset checks, and data-access tests. Progress is recorded by feature.",
          "Artwork management and classification are implemented. Full CMS publishing, more project cases, and end-to-end personal Workspace verification remain in progress. Performance results will be published when measurements are available.",
        ],
      },
    ],
  },
] as const;
export const processSteps = [
  {
    number: "01",
    title: "Define the problem",
    description:
      "Identify what the audience needs to understand, then decide how work, process, and technical records should connect.",
    example:
      "This site separates artwork viewing from project decisions through Works and Projects/Process.",
  },
  {
    number: "02",
    title: "Explain the decision",
    description:
      "Preserve existing records while building a new structure, and keep public content separate from personal operations.",
    example:
      "Existing gallery records are displayed through a read adapter while the originals are retained.",
  },
  {
    number: "03",
    title: "Verify and refine",
    description:
      "Check links, access control, and responsive layouts that affect the visitor's experience.",
    example:
      "The public export checks page links and local assets before publication.",
  },
] as const;
