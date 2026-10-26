import { describe, expect, it } from "vitest";
import { projectBySlug, projects, type ProjectSlug } from "./projects";

describe("projects", () => {
  it("gives every project a unique slug", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("puts each case study at /projects/<slug>", () => {
    for (const project of projects) {
      expect(project.href).toBe(`/projects/${project.slug}`);
    }
  });

  it("gives every case study a live link, its label and a full tech stack", () => {
    for (const project of projects) {
      expect(project.link).toMatch(/^https:\/\//);
      expect(project.linkLabel).not.toBe("");
      expect(project.techStack.length).toBeGreaterThan(0);
    }
  });
});

describe("projectBySlug", () => {
  it("finds a project by its slug", () => {
    expect(projectBySlug("smartscout").title).toBe("SmartScout");
  });

  it("throws for a slug with no project, so a case study can't render without one", () => {
    expect(() => projectBySlug("not-a-project" as ProjectSlug)).toThrow(
      /not-a-project/,
    );
  });
});
