# AGENTS.md

This file is intentionally short and opinionated. It exists to prevent repeat mistakes in this repo, not to document generic engineering advice.

## Project shape

This repo is a static Astro portfolio and writing site. It uses Astro for layout and page generation, and React only for true interactive UI.

Key locations:

- App shell: `src/layouts/BaseLayout.astro`
- Pages: `src/pages`
- Content: `src/content`
- Shared UI: `src/components`
- Interactive React UI: `src/components/react`
- Utilities: `src/lib`
- Types: `src/types`

## Non-negotiable rules

- Keep changes small and scoped to the relevant feature.
- Favor patterns already used in this codebase.
- Preserve the dark editorial design language and accessibility.
- Do not add dependencies without a clear need.
- Do not break static generation or route generation.
- Do not break article/content loading or schema assumptions.

## Astro + React guardrails

- Use Astro for page structure and layout.
- Use React only for actual interactive UI components.
- Do not call React hooks from plain Astro scripts or non-component JavaScript.
- Do not mount a React component as a workaround for browser-only logic when a plain browser script is sufficient.
- If the logic is browser-only, prefer a small script or DOM event hook instead of forcing React into the fix.

## Foley / browser audio guardrails

- Foley is installed as `@foleyjs/core`.
- Keep sounds subtle, low-volume, and understated.
- Initialize audio only in the browser, never during SSR.
- Respect browser autoplay restrictions; sound should be triggered by a user gesture or explicit browser context.
- Prefer declarative Foley attributes such as `data-foley-type`, `data-foley-hover`, and `data-foley-click` for simple UI interactions.
- Do not bootstrap Foley via React hooks in Astro files. That pattern caused invalid hook warnings in this repo.

## Testing expectations

- Add or update tests for behavior changes, especially around search, filtering, and interaction logic.
- Prefer targeted Vitest + Testing Library checks over broad suite churn.
- Keep tests focused on real behavior, not implementation details.
- Validate with the smallest relevant command before concluding work.

Common commands:

- `npm run build`
- `npm test -- --run <path-to-test-file>`
- `npm run test:e2e -- <path-to-spec>`

## Known failure modes to avoid

- React hooks inside Astro/browser scripts.
- Browser audio logic that depends on server-rendered execution.
- “Quick fixes” that add new dependencies or wrapper components without a real need.
- Broad refactors when the issue is local and well-scoped.

## Rule of thumb

If a rule does not prevent a real project regression, it probably should not be in this file.
