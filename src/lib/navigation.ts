const trimSlash = (path: string) =>
  path.length > 1 ? path.replace(/\/+$/, "") : path;

/**
 * How a nav link relates to the current path: the exact "page", the
 * "section" it heads (e.g. Articles while reading an article), or neither.
 * Trailing slashes are ignored.
 */
export function navState(
  href: string,
  currentPath: string,
): "page" | "section" | undefined {
  const target = trimSlash(href);
  const current = trimSlash(currentPath);
  if (current === target) return "page";
  if (target !== "/" && current.startsWith(`${target}/`)) return "section";
  return undefined;
}

/** A page in the site's main navigation. */
export interface Page {
  href: string;
  title: string;
}

export const pages: readonly Page[] = [
  { href: "/", title: "Home" },
  { href: "/projects", title: "Projects" },
  { href: "/articles", title: "Articles" },
  { href: "/about", title: "About" },
];

export interface NavLink extends Page {
  /** "page" on the page itself, "true" inside its section, else omitted. */
  ariaCurrent: "page" | "true" | undefined;
  /** Highlighted: the current page or the section it belongs to. */
  active: boolean;
}

/** The main navigation's links, marked for the page at `currentPath`. */
export function navLinks(currentPath: string): NavLink[] {
  return pages.map((page) => {
    const state = navState(page.href, currentPath);
    return {
      ...page,
      ariaCurrent: state === "page" ? "page" : state ? "true" : undefined,
      active: state !== undefined,
    };
  });
}
