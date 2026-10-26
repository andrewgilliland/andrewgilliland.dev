import { test, expect } from "@playwright/test";
import { projects } from "../src/data/projects";

// Every case study shows exactly what its record in src/data/projects.ts says,
// so a page can't drift from the projects list or its share card.
for (const project of projects) {
  test.describe(`case study: ${project.title}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(project.href);
    });

    test("header shows the record's title and description", async ({
      page,
    }) => {
      const header = page.locator("main header");
      await expect(header.getByRole("heading", { level: 1 })).toHaveText(
        project.title,
      );
      await expect(header.getByText(project.description)).toBeVisible();
    });

    test("describes the project, not the site, to search and link previews", async ({
      page,
    }) => {
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        project.description,
      );
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        new RegExp(`/og/projects/${project.slug}\\.png$`),
      );
    });

    test("links out to the live project and lists its full tech stack", async ({
      page,
    }) => {
      await expect(
        page.getByRole("link", { name: project.linkLabel }),
      ).toHaveAttribute("href", project.link);
      const stack = page
        .locator("section", {
          has: page.getByRole("heading", { name: "Tech Stack" }),
        })
        .getByRole("listitem");
      await expect(stack).toHaveText([...project.techStack]);
    });
  });
}
