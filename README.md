# andrewgilliland.dev

Andrew Gilliland's portfolio, articles, and developer notes. The site is statically generated with [Astro](https://astro.build).

## Stack

- Astro with MDX and content collections
- React for interactive components
- TypeScript and Tailwind CSS
- Vitest and Testing Library for unit and component tests
- Playwright for end-to-end tests

## Development

```sh
npm install
npm run dev
```

The development server runs at `http://localhost:4321` by default.

## Commands

```sh
npm run dev          # Start the development server
npm run build
npm start            # Preview the production build
npm run type-check   # Run Astro diagnostics
npm run lint
npm test             # Run unit and component tests
npm run test:e2e     # Run Playwright tests
```

## Content

Articles, notes, and resume content live under `src/content`. Their frontmatter is validated by schemas in `src/content/schemas.ts`.

## Structure

```
src/
├── components/  # Shared Astro and React UI
├── content/     # Articles, notes, and resume content
├── layouts/     # Page layouts
├── lib/         # Utilities
├── pages/       # File-based routes
├── styles/      # Global styles
└── types/       # Shared TypeScript types
e2e/             # Playwright tests
public/          # Static assets
```
