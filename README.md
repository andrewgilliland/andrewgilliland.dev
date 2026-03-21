# andrewgilliland.dev

The personal website of Andrew Gilliland — a community-taught full stack developer, Yacht Rock enthusiast, and person who owns more pets than houseplants (currently).

Built with [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com), and an unreasonable number of notes about JavaScript.

## What's in here?

- **Notes** — A growing collection of developer notes spanning JavaScript, React Native, AWS, CSS, Swift, databases, testing, PHP, and more. Basically Andrew's second brain, except this one has syntax highlighting.
- **Articles** — Long-form posts like *Getting Started with Astro*, *TypeScript Tips*, and *Why I Use Tailwind* (spoiler: have you seen how fast you can center a div?).
- **Projects** — Real things Andrew has shipped, including SmartScout (machine vision + AR for agriculture — yes, really) and [blono.dev](https://www.blono.dev/) (a community site for Central Illinois developers who deserve nice things).
- **About** — The page where you learn that Andrew also grills, does woodworking, and has a dog named Hank and cats named Gus and Bernie. The cats do not contribute to the codebase.

## Tech Stack

| Category | Technologies |
|----------|-------------|
| Frontend | Astro, React, Tailwind CSS, TypeScript |
| Mobile | React Native, Expo |
| Deployment | Vercel, Cloudflare, AWS, Fly.io, Netlify |
| Databases | PostgreSQL, MySQL, SQLite, DynamoDB, MongoDB |
| Apple | Swift, SwiftUI, UIKit, CoreML, ARKit, RealityKit |
| Vibes | Yacht Rock |

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server (the fun part)
npm run dev

# Type-check (the responsible part)
npm run type-check

# Build for production (the scary part)
npm run build

# Preview the build locally
npm start

# Lint (find out what you did wrong)
npm run lint
```

## Project Structure

```
src/
├── components/     # Astro & React components
├── content/        # Markdown content (notes, articles, resume)
├── layouts/        # Base page layout
├── lib/            # Utility modules
├── pages/          # File-based routing
├── styles/         # Global CSS (self-hosted fonts, animations)
└── types/          # TypeScript type definitions
public/             # Static assets
```

## License

This is a personal website. Feel free to look around, get inspired, or judge my CSS choices. Built in Bloomington-Normal, IL, probably while listening to Michael McDonald.
