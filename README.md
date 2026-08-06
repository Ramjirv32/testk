# testk — GRE Platform Monorepo

A full-stack GRE testing platform with adaptive test engine.

## Projects

| Folder | Description | Stack |
|--------|-------------|-------|
| `University/` | Student & Admin portal UI | Next.js 15, TypeScript |
| `gre-backend/` | REST API backend | Node.js, Express, PostgreSQL |
| `go-Engine/` | High-performance test engine | Go |

## Quick Start

### 1. GRE Backend
```bash
cd gre-backend
pnpm install
pnpm dev   # runs on :11000
```

### 2. University Frontend
```bash
cd University
pnpm install
pnpm dev   # runs on :3000
```

### 3. Go Engine
```bash
cd go-Engine
go run main.go   # runs on :8080
```

## Features
- Section-adaptive GRE exam engine (AWA, Verbal, Quant)
- Anti-cheat / proctoring with fullscreen enforcement
- Admin dashboard: allocate tests, question bank management
- Student dashboard: performance analytics, results
