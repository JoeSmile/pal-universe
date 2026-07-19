# 002-frontend-init

## Status
- status: completed
- assigned_to: cursor
- depends_on: []
- completed_at: 2026-07-19

## Goal

初始化 `frontend/` 为 Next.js 15 + TypeScript + Tailwind CSS v4 + Radix UI 项目骨架。

## Files
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.ts`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.mjs`
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/.gitignore`
- Create: `frontend/Dockerfile`

## Acceptance Criteria
- [x] `bun install` 成功
- [x] `bun run build` 通过
- [x] `bun run dev` 启动后 localhost:3000 显示首页
- [x] Tailwind CSS 类名生效
- [x] Strict TypeScript 模式下无错误（`bun run type-check`）

## Tech Stack
- next@15.1.0
- react@19.0.0 + react-dom@19.0.0
- typescript@^5.7
- tailwindcss@^4.0 + @tailwindcss/postcss
- @radix-ui/react-slot, @radix-ui/react-dialog, @radix-ui/react-tooltip
- zustand, @tanstack/react-query, clsx, tailwind-merge, lucide-react, framer-motion, nanoid
- bun 作为包管理器和运行时

## Implementation Hints
- **不要用 `create-next-app`**，手动写 config 文件更干净
- package.json scripts: dev, build, start, lint, type-check, test
- tsconfig: strict 模式 + `noUncheckedIndexedAccess: true` + paths `@/* → ./src/*`
- 参考 `ai_agent/frontend` 的已有配置结构，但只取需要的依赖
- layout.tsx 包含基础 HTML 结构 + 字体 + 元数据
- page.tsx 写一个简单的"Pal Universe"标题验证渲染
