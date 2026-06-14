<div align="center">

# 📦 DriveX

### AI-Powered Cloud File Storage Platform

<p>
  <img src="https://img.shields.io/badge/-Next_JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000" alt="nextdotjs" />
  <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
  <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
  <img src="https://img.shields.io/badge/-Appwrite-black?style=for-the-badge&logoColor=white&logo=appwrite&color=FD366E" alt="appwrite" />
  <img src="https://img.shields.io/badge/-Groq-black?style=for-the-badge&logoColor=white&logo=groq&color=F55036" alt="groq" />
</p>

A full-stack cloud storage and file-sharing platform with AI-driven document summarization and automatic smart tagging, built using Next.js 15, Appwrite, and Groq (LLaMA 3.3 70B).

</div>

---

## 📋 Table of Contents

1. 🤖 [Overview](#overview)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Key Features](#key-features)
4. 🧠 [How the AI Pipeline Works](#how-the-ai-pipeline-works)
5. 📁 [Project Folder Structure](#project-folder-structure)
6. 🏗️ [Architecture Highlights](#architecture-highlights)
7. 🎬 [Demo](#demo)
8. 🤸 [Getting Started](#getting-started)
9. 🔐 [Environment Variables](#environment-variables)
10. 🚀 [Possible Future Improvements](#possible-future-improvements)
11. 👨‍💻 [Author](#author)

---

## <a name="overview">🤖 Overview</a>

**DriveX** is a full-stack, AI-powered cloud storage application that allows users to securely upload, organize, search, and share files of any type — documents, images, videos, and audio.

What sets DriveX apart from a typical file-storage app is its built-in **AI intelligence layer**: every uploaded file can be instantly summarized and auto-tagged using LLMs, turning a static file drive into a searchable, self-organizing knowledge base.

The application is built on **Next.js 15 (App Router)** with **Appwrite** handling authentication, database, and object storage, while **Groq's LLaMA 3.3 70B** powers the AI summarization and tagging features. Server-side caching (via `unstable_cache`) and carefully designed loading states keep navigation fast and the UI responsive.

This project was built to deepen hands-on experience with the **Next.js App Router**, **Backend-as-a-Service architectures (Appwrite)**, **multi-model AI integration**, and **production-grade UI/UX patterns** such as caching, optimistic loading states, and floating contextual UI.

---

## <a name="tech-stack">⚙️ Tech Stack</a>

| Layer                        | Technology                             | Purpose                                            |
| ---------------------------- | -------------------------------------- | -------------------------------------------------- |
| Framework                    | **Next.js 15** (App Router)            | Server-side rendering, routing, server actions     |
| Language                     | **TypeScript**                         | Type safety across the codebase                    |
| Backend & Auth               | **Appwrite**                           | Authentication (OTP), database, file storage       |
| AI — Summarization & Tagging | **Groq API (LLaMA 3.3 70B Versatile)** | Fast inference for summaries and smart tags        |
| Styling                      | **Tailwind CSS + ShadCN UI**           | Utility-first styling and accessible UI primitives |
| Deployment                   | **Vercel**                             | CI/CD and hosting                                  |

---

## <a name="key-features">🔋 Key Features</a>

### Core Storage & File Management

- **Secure Authentication** — Email-based signup/login with OTP verification via Appwrite Auth
- **Drag-and-Drop Uploads** — Upload documents, images, videos, and audio with real-time progress feedback
- **Categorized File Views** — Files automatically organized into Documents, Images, Media, and Others
- **File Operations** — Rename, delete, download, and share files with other registered users by email
- **Global Search** — Instantly search across all files and shared content
- **Sorting & Filtering** — Sort any file list by name, date, or size

### Dashboard & Analytics

- **Storage Dashboard** — Live overview of total storage consumed, recent uploads, and a breakdown of usage by file type
- **Custom SVG Chart** — A hand-built double-ring chart visualizing storage usage, with no external charting library dependency

### AI-Powered Intelligence

- **AI File Summarizer** — One click generates a concise 2-3 sentence summary and key insights for any file using LLaMA 3.3, helping users quickly understand file contents without opening them
- **Smart Auto-Tagging** — Automatically generates 6-8 relevant, searchable tags per file using LLaMA 3.3, dramatically reducing manual organization effort
- **Floating AI Insights Panel** — AI results render in a non-intrusive, dark-themed floating card in the bottom-right corner that persists until dismissed, so users never lose their place in the UI

### Performance & UX

- **Server-Side Caching** — `unstable_cache` is used to cache file/database queries, enabling near-instant page loads after the first visit
- **Instant Loading States** — Dedicated `loading.tsx` files ensure a spinner appears immediately on every route transition — no blank screens
- **Responsive, Minimalist UI** — Clean black-and-white design system that adapts cleanly across desktop, tablet, and mobile

---

## <a name="how-the-ai-pipeline-works">🧠 How the AI Pipeline Works</a>

1. A user clicks **"AI Summary"** or **"Smart Tags"** on a file from the dashboard or category view.
2. A server action in `lib/actions/ai.actions.ts` is triggered.
3. The relevant file metadata and extracted content are sent to **Groq's LLaMA 3.3 70B Versatile** model, chosen for its low-latency inference and strong performance on summarization tasks.
4. The model returns either a 2-3 sentence summary with key insights, or a list of 6-8 relevant tags, depending on the action requested.
5. The result is rendered in the **floating AI Insights panel**, allowing the user to keep browsing without losing context.

This keeps the AI layer fast and lightweight — summaries and tags typically return in well under a second thanks to Groq's inference speed.

---

## <a name="project-folder-structure">📁 Project Folder Structure</a>

```
storage_management_solution/
│
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── sign-in/
│   │   │   └── page.tsx          # Sign in page
│   │   ├── sign-up/
│   │   │   └── page.tsx          # Sign up page
│   │   └── layout.tsx            # Layout for auth pages
│   │
│   ├── (root)/                   # Main app route group
│   │   ├── [type]/               # Dynamic category pages
│   │   │   ├── page.tsx          # Documents / Images / Media / Others
│   │   │   └── loading.tsx       # Loading state for category pages
│   │   ├── page.tsx              # Dashboard
│   │   ├── loading.tsx           # Loading state for dashboard
│   │   └── layout.tsx            # Root layout with sidebar
│   │
│   ├── fonts/                    # Custom fonts
│   ├── favicon.ico
│   ├── globals.css               # Global styles
│   └── layout.tsx                # App root layout
│
├── components/                   # Reusable UI components
│   ├── ui/                       # ShadCN UI primitives
│   ├── ActionDropdown.tsx        # File action menu (rename, share, delete, AI)
│   ├── AIInsightsModal.tsx       # Floating AI summary / tags card
│   ├── ActionsModalContent.tsx   # File details & share modal content
│   ├── AuthForm.tsx              # Login / signup form
│   ├── Card.tsx                  # File card for grid view
│   ├── Chart.tsx                 # Custom SVG storage chart
│   ├── FileUploader.tsx          # Drag and drop file uploader
│   ├── FormattedDateTime.tsx     # Date formatting component
│   ├── Header.tsx                # Top navigation bar
│   ├── MobileNavigation.tsx      # Mobile sidebar sheet
│   ├── OTPModal.tsx              # OTP verification modal
│   ├── Search.tsx                # Global search component
│   ├── Sidebar.tsx               # Desktop sidebar navigation
│   ├── Sort.tsx                  # Sort dropdown
│   └── Thumbnail.tsx             # File type thumbnail
│
├── lib/                          # Core logic and server actions
│   ├── actions/
│   │   ├── ai.actions.ts         # AI summarize & smart tag (Groq)
│   │   ├── file.actions.ts       # File CRUD + caching (Appwrite)
│   │   └── user.actions.ts       # User auth actions (Appwrite)
│   ├── appwrite/
│   │   ├── config.ts             # Appwrite config & env vars
│   │   └── index.ts              # Appwrite client setup
│   └── utils.ts                  # Utility functions
│
├── constants/
│   └── index.ts                  # Nav items, dropdown actions, sort types
│
├── hooks/
│   └── use-toast.ts              # Toast notification hook
│
├── public/                       # Static assets
│   ├── assets/
│   │   └── icons/                # SVG icons used throughout the app
│   └── readme/                   # README images
│
├── types/                        # Global TypeScript types
│   └── index.d.ts
│
├── .env.local                    # Environment variables (not committed)
├── .gitignore
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json
└── package.json
```

---

## <a name="architecture-highlights">🏗️ Architecture Highlights</a>

- **Server Actions over API Routes** — All data mutations (file upload, rename, delete, share, AI calls) are implemented as Next.js Server Actions in `lib/actions/`, keeping sensitive logic and API keys off the client.
- **Route Groups for Clean Separation** — The `(auth)` and `(root)` route groups cleanly separate authenticated and unauthenticated layouts without affecting the URL structure.
- **Dynamic Category Routing** — A single `[type]/page.tsx` dynamic route handles Documents, Images, Media, and Others views, avoiding duplicated page code.
- **Caching Strategy** — `unstable_cache` wraps Appwrite database queries in `file.actions.ts`, reducing redundant network calls on repeat navigation.
- **Component-Driven UI** — Built on ShadCN UI primitives with custom components (`Chart.tsx`, `AIInsightsModal.tsx`, `Thumbnail.tsx`) layered on top for app-specific needs.

---

## <a name="demo">🎬 Demo</a>

🔗 **Live Demo:** _Coming soon_

📹 **Demo Video:** _Coming soon_

---

## <a name="getting-started">🤸 Getting Started</a>

### Prerequisites

Make sure the following are installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en) (v18+ recommended)
- [npm](https://www.npmjs.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/utkarsh1-a11y/DriveX.git
cd DriveX
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root and add the following:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
NEXT_PUBLIC_APPWRITE_PROJECT=""
NEXT_PUBLIC_APPWRITE_DATABASE=""
NEXT_PUBLIC_APPWRITE_USERS_COLLECTION=""
NEXT_PUBLIC_APPWRITE_FILES_COLLECTION=""
NEXT_PUBLIC_APPWRITE_BUCKET=""
NEXT_APPWRITE_KEY=""
GROQ_API_KEY=""
```

Obtain credentials from:

- **Appwrite** → [appwrite.io](https://appwrite.io) — create a project and copy your project, database, collection, and bucket IDs
- **Groq** → [console.groq.com](https://console.groq.com) — free API key, no billing required

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app running.

---

## <a name="environment-variables">🔐 Environment Variables</a>

| Variable                                | Description                                   |
| --------------------------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT`         | Appwrite API endpoint URL                     |
| `NEXT_PUBLIC_APPWRITE_PROJECT`          | Appwrite project ID                           |
| `NEXT_PUBLIC_APPWRITE_DATABASE`         | Appwrite database ID                          |
| `NEXT_PUBLIC_APPWRITE_USERS_COLLECTION` | Appwrite users collection ID                  |
| `NEXT_PUBLIC_APPWRITE_FILES_COLLECTION` | Appwrite files collection ID                  |
| `NEXT_PUBLIC_APPWRITE_BUCKET`           | Appwrite storage bucket ID                    |
| `NEXT_APPWRITE_KEY`                     | Appwrite server-side API key                  |
| `GROQ_API_KEY`                          | Groq API key for AI summarization and tagging |

---

## <a name="possible-future-improvements">🚀 Possible Future Improvements</a>

- Add file versioning and version history
- Support folder-based organization, not just flat categories
- Add real-time collaboration indicators for shared files
- Introduce role-based access control for shared files (view-only vs. edit)
- Add multimodal AI support for reading content directly from PDFs and images (not just metadata)
- Add a vector-search layer for semantic file search using AI-generated embeddings

---

## <a name="author">👨‍💻 Author</a>

**Utkarsh Kumar Gupta**

- GitHub: [@utkarsh1-a11y](https://github.com/utkarsh1-a11y)
- Project Repository: [DriveX](https://github.com/utkarsh1-a11y/DriveX)
