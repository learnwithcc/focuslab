# FocusLab

A Remix.js application built with TypeScript and Tailwind CSS, designed to create neurodivergent-friendly tools and workflows.

## Features

### Newsletter Subscription
- Server-side email validation
- GDPR compliance with consent checkbox
- Rate limiting (3 attempts per hour per IP)
- Clear error feedback with remaining attempts
- Integration with ConvertKit for email management

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
# Upstash Redis Configuration (for rate limiting)
UPSTASH_REDIS_REST_URL=your_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

# ConvertKit Configuration (for newsletter service)
CONVERTKIT_API_KEY=your_convertkit_api_key_here
CONVERTKIT_DEFAULT_FORM_ID=your_default_form_id_here
```

## Rate Limiting

The newsletter subscription form is protected by rate limiting:
- 3 attempts per hour per IP address
- Clear feedback on remaining attempts
- Reset time information when limit is reached
- Standard rate limit headers (X-RateLimit-*) included in responses

## 🚀 Quick Start

### Prerequisites

- Node.js (v20 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd focuslab
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Project Structure

```
focuslab/
├── app/
│   ├── components/       # Reusable UI components
│   │   └── index.ts     # Component exports
│   ├── routes/          # Remix route files
│   ├── styles/          # CSS files
│   │   ├── tailwind.css # Tailwind CSS directives
│   │   └── index.css    # Global styles
│   ├── utils/           # Utility functions
│   │   └── index.ts     # Utility exports
│   ├── entry.client.tsx # Client entry point
│   ├── entry.server.tsx # Server entry point
│   └── root.tsx         # Root component
├── public/
│   └── images/          # Static image assets
├── .taskmaster/         # Task management
└── README.md
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript checks
- `npm run lint` - Run ESLint

## 🎨 Tech Stack

- **Framework**: Remix.js
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with typography plugin
- **Build Tool**: Vite
- **Package Manager**: npm

## 📁 Import Aliases

The project uses TypeScript path mapping for clean imports:

- `~/components` → `app/components`
- `~/utils` → `app/utils`
- `~/styles` → `app/styles`

Example:
```typescript
import { Button } from '~/components';
import { formatDate } from '~/utils';
```

## 🔧 Configuration

- **TypeScript**: Configured with strict mode for enhanced type safety
- **Tailwind CSS**: Includes typography plugin and dark mode support
- **ESLint**: Configured for React and TypeScript
- **PostCSS**: Configured with Tailwind and Autoprefixer

## 📝 Development Guidelines

1. Use TypeScript strict mode - all code should have proper type annotations
2. Follow Tailwind CSS utility-first approach
3. Organize components in the `app/components` directory
4. Use the path aliases for clean imports
5. Keep utility functions in `app/utils`

## 🌙 Theme Support

The application includes built-in dark mode support using Tailwind CSS classes and CSS custom properties.

---

Built with ❤️ for the neurodivergent community
