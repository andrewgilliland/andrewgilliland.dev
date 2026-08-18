# AGENTS.md

## Project overview

This repo is a static portfolio and writing site built with Astro. It mixes Astro pages/layouts with a small amount of React for interactive UI, especially under `src/components/react` and component-level behavior such as article search.

## Tech stack

- Astro
- TypeScript
- React
- Tailwind CSS
- Vitest + Testing Library
- Playwright for end-to-end tests

## Working conventions

- Keep changes small and scoped to the relevant file or feature.
- Favor the existing patterns already used in the codebase.
- Preserve the current dark, editorial design language.
- Maintain accessibility for links, buttons, inputs, and menu interactions.
- Do not add dependencies unless the need is clearly justified.

## File structure notes

- App shell and global layout: `src/layouts/BaseLayout.astro`
- Pages: `src/pages`
- Content: `src/content`
- Shared Astro UI: `src/components`
- React UI: `src/components/react`
- Utilities and site logic: `src/lib`
- Type defs: `src/types`

## Astro + React guidance

- Use Astro for page structure and layout.
- Use React only for actual interactive UI components.
- Do not call React hooks from plain Astro scripts or non-component JavaScript.
- Do not mount a React component as a workaround for browser-only logic when a plain browser script is enough.
- If a feature is purely browser-side and does not require React rendering, prefer a plain `<script>` in Astro or a lightweight DOM event hook.

## Foley / sound guidance

- Foley is installed as `@foleyjs/core`.
- Sounds should be subtle and low-volume, not noisy or distracting.
- The audio engine must be initialized in the browser, not during server-side rendering.
- Browsers require a user gesture before audio can start. Use binding and sound triggers only in the browser context.
- Keep the default audio theme in a soft, understated configuration.
- Prefer declarative Foley attributes such as `data-foley-type`, `data-foley-hover`, and `data-foley-click` for simple UI interactions.
- Avoid React hook-based Foley bootstrapping in Astro files; it can trigger invalid hook warnings.

## Testing expectations

- Add or update tests for behavior changes, especially in search/filter components.
- Use Vitest and Testing Library for component-level issues.
- Prefer targeted tests over broad suite churn.
- Keep tests focused on real behavior rather than implementation details.

## Validation commands

Before concluding work, run the smallest relevant validation command.

Common commands:

- `npm run build`
- `npm test -- --run <path-to-test-file>`
- `npm run test:e2e -- <path-to-spec>`

## Important repo-specific guardrails

- Do not break static generation.
- Do not break route generation or article content loading.
- Do not change content schema without checking downstream consumers.
- Do not introduce browser audio logic that depends on a server-rendered environment.
- Do not reintroduce invalid React hook usage in Astro layout or script code.
