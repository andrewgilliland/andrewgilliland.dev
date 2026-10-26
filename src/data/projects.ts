// Projects and their case studies. Each project's record is the single source
// for its listing cards, its case-study header, its tech stack and its share
// image; case-study pages only add their own body content.

interface ProjectRecord {
  /** The case study's URL segment: /projects/<slug>. */
  slug: string;
  title: string;
  /** Shown on the projects page, as the case-study lead, and as its meta description. */
  description: string;
  /** One line for compact listings such as the home page. */
  summary: string;
  /** The headline technologies, for listings. */
  stack: readonly string[];
  /** Everything the project uses, for its case study. */
  techStack: readonly string[];
  /** The live project, linked from the case study's header. */
  link: string;
  linkLabel: string;
  logo?: string;
  logoAlt?: string;
  logoWidth?: number;
  logoHeight?: number;
  logoClass?: string;
}

const records = [
  {
    slug: "manchester-united-hospitality",
    title: "Manchester United Hospitality",
    description:
      "The official Manchester United hospitality storefront, built by Elevate as the club's first Official Hospitality Partner. As a software engineer on the launch, I worked on go-live release engineering and the payments and catalogue APIs behind checkout.",
    summary:
      "Launch of the club's official hospitality storefront: go-live cutover, payments, and catalogue APIs.",
    stack: ["AWS", "TanStack Start", "FastAPI"],
    techStack: [
      "TypeScript",
      "TanStack Start",
      "React",
      "Python",
      "FastAPI",
      "AWS Lambda",
      "Amazon API Gateway",
      "Amazon CloudFront and CloudFront Functions",
      "AWS CDK",
      "PostgreSQL",
      "GitHub Actions",
    ],
    link: "https://hospitality.manutd.com",
    linkLabel: "Visit hospitality.manutd.com",
    logo: "/projects/manchester-united-hospitality-logo.webp",
    // The partnership lockup is wide, so it keeps its aspect ratio.
    logoAlt: "Manchester United and Elevate logos",
    logoWidth: 600,
    logoHeight: 128,
    logoClass: "h-12 w-auto",
  },
  {
    slug: "smartscout",
    title: "SmartScout",
    description:
      "Precision Planting SmartScout is a mobile app that uses machine vision and augmented reality to automatically assess emergence and plant spacing in a 3D space. SmartScout is built with React Native and Swift for Native Modules, and deployed on iOS and iPadOS.",
    summary:
      "Machine vision and AR to assess plant emergence and spacing, on iOS and iPadOS.",
    stack: ["React Native", "Swift", "ARKit"],
    techStack: [
      "TypeScript",
      "React Native",
      "Swift",
      "SwiftUI",
      "ARKit",
      "CoreML",
      "AWS",
    ],
    link: "https://apps.apple.com/us/app/precision-planting-smartscout/id1672094173",
    linkLabel: "View on the App Store",
    logo: "/projects/smartscout-icon-1.webp",
  },
  {
    slug: "blono-dev",
    title: "blono.dev",
    description:
      "blono.dev is a website for Bloomington-Normal Developers, a local developer community in Central Illinois. Built with Next.js and Tailwind CSS.",
    summary:
      "Website for Bloomington-Normal Developers, a local developer community.",
    stack: ["Next.js", "Tailwind CSS"],
    techStack: ["TypeScript", "React", "Next.js", "Tailwind CSS", "Vercel"],
    link: "https://blono.dev",
    linkLabel: "Visit blono.dev",
    logo: "/projects/blono-dev-icon-1.svg",
  },
] as const satisfies readonly ProjectRecord[];

export type ProjectSlug = (typeof records)[number]["slug"];

export interface Project extends ProjectRecord {
  slug: ProjectSlug;
  /** The case study's path. */
  href: string;
}

export const projects: Project[] = records.map((record) => ({
  ...record,
  href: `/projects/${record.slug}`,
}));

/** The project a case study is about. Throws for an unknown slug. */
export function projectBySlug(slug: ProjectSlug): Project {
  const project = projects.find((p) => p.slug === slug);
  if (!project) {
    throw new Error(`No project "${slug}" in src/data/projects.ts.`);
  }
  return project;
}
