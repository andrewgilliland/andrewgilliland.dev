# Andrew Gilliland's Personal Website

A modern personal website built with Next.js, featuring articles, notes, pixel art, and interactive tools.

## 🚀 Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Content**: MDX for articles and notes
- **Testing**: Jest + Cypress
- **Deployment**: Vercel

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/             # About page
│   ├── articles/          # Blog articles
│   ├── notes/             # Personal notes
│   ├── pixel-art/         # Pixel art showcase
│   ├── resume/            # Resume page
│   └── tools/             # Interactive tools
├── components/            # Reusable React components
├── lib/                   # Utilities and data
├── markdown/              # MDX content files
└── styles/                # Global styles and themes
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/andrewgilliland/andrewgilliland.github.io.git
   cd andrewgilliland.dev
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run cypress:open` - Open Cypress test runner
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🧪 Testing

- **Unit Tests**: Jest with React Testing Library
- **E2E Tests**: Cypress for end-to-end testing
- **Test Coverage**: Comprehensive test suite for components and pages

## 🎨 Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **MDX Support**: Write content with React components
- **Interactive Tools**: Custom tools and utilities
- **Pixel Art Gallery**: Showcase of pixel art creations
- **Performance Optimized**: Built with Next.js best practices

## 📝 Content Management

Content is managed through MDX files in the `markdown/` directory:

- Articles: Long-form blog posts
- Notes: Quick thoughts and learning notes
- Resume: Professional experience and skills

## 🚀 Deployment

This site is deployed on Vercel with automatic deployments from the main branch.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
