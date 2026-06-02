/**
 * file: project-templates.ts
 * description: 文件 · 待补充描述
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-04-04
 * updated: 2026-04-04
 * status: active
 * tags: [file]
 *
 * brief: 待补充简要说明
 *
 * details: 待补充详细说明
 *
 * dependencies: 待补充
 * exports: 待补充
 * notes: 待补充
 */

/**
 * ProjectTemplates - 项目模板系统
 * 
 * 职责：
 * - 定义预设项目模板（React/Vue/Express/Static HTML/Next.js）
 * - 每个模板包含文件树 + 入口点 + 描述
 * - 支持一键初始化 VFS
 * 
 * Step 10c: 项目模板系统
 * 
 * @file services/project-templates.ts
 */

import { MODEL_GLM4_PLUS, MODEL_CODEGEEX4 } from '../config/models';

// ==========================================
// Types
// ==========================================

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  tags: string[]
  entryPoint: string
  files: Record<string, { content: string; language: string }>
}

// ==========================================
// Templates
// ==========================================

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  // ========== React + TypeScript ==========
  {
    id: 'react-ts',
    name: 'React + TypeScript',
    description: '现代 React 18 + TypeScript 项目，含路由和组件示例',
    icon: '⚛️',
    color: '#61DAFB',
    tags: ['React', 'TypeScript', 'Vite'],
    entryPoint: '/src/App.tsx',
    files: {
      '/src/App.tsx': {
        content: `import React from 'react'
import { Header } from './components/Header'
import { Counter } from './components/Counter'
import './styles/global.css'

export default function App() {
  return (
    <div className="app">
      <Header title="YYC³ React App" />
      <main className="main-content">
        <Counter initial={0} />
        <p className="hint">使用 React 18 + TypeScript 构建</p>
      </main>
    </div>
  )
}`,
        language: 'typescriptreact',
      },
      '/src/components/Header.tsx': {
        content: `import React from 'react'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header style={{
      padding: '24px',
      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <h1 style={{
        background: 'linear-gradient(to right, #4ade80, #22d3ee)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        margin: 0,
        fontSize: '24px',
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0' }}>
          {subtitle}
        </p>
      )}
    </header>
  )
}`,
        language: 'typescriptreact',
      },
      '/src/components/Counter.tsx': {
        content: `import React, { useState, useCallback } from 'react'

interface CounterProps {
  initial?: number
  step?: number
}

export function Counter({ initial = 0, step = 1 }: CounterProps) {
  const [count, setCount] = useState(initial)

  const increment = useCallback(() => setCount(c => c + step), [step])
  const decrement = useCallback(() => setCount(c => c - step), [step])
  const reset = useCallback(() => setCount(initial), [initial])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      padding: '32px',
      background: 'rgba(15, 23, 42, 0.8)',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ fontSize: '48px', color: '#e2e8f0', fontFamily: 'monospace' }}>
        {count}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={decrement} className="btn btn-danger">-{step}</button>
        <button onClick={reset} className="btn btn-secondary">重置</button>
        <button onClick={increment} className="btn btn-primary">+{step}</button>
      </div>
    </div>
  )
}`,
        language: 'typescriptreact',
      },
      '/src/hooks/useLocalStorage.ts': {
        content: `import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}`,
        language: 'typescript',
      },
      '/src/styles/global.css': {
        content: `:root {
  --bg-primary: #020617;
  --bg-secondary: #0f172a;
  --text-primary: #e2e8f0;
  --accent: #4ade80;
  --accent-secondary: #22d3ee;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: Inter, -apple-system, sans-serif;
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 48px 24px;
}

.hint {
  font-size: 12px;
  color: #475569;
  font-family: monospace;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-family: monospace;
  transition: all 0.15s;
}

.btn-primary {
  background: #10b981;
  color: white;
}

.btn-primary:hover { background: #059669; }

.btn-secondary {
  background: #334155;
  color: #e2e8f0;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover { background: #dc2626; }`,
        language: 'css',
      },
      '/tsconfig.json': {
        content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}`,
        language: 'json',
      },
      '/package.json': {
        content: `{
  "name": "yyc3-react-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}`,
        language: 'json',
      },
    },
  },

  // ========== Vue 3 + TypeScript ==========
  {
    id: 'vue-ts',
    name: 'Vue 3 + TypeScript',
    description: 'Vue 3 Composition API + TypeScript SFC 项目',
    icon: '💚',
    color: '#42B883',
    tags: ['Vue', 'TypeScript', 'Vite'],
    entryPoint: '/src/App.vue',
    files: {
      '/src/App.vue': {
        content: `<script setup lang="ts">
import { ref } from 'vue'
import Header from './components/Header.vue'
import Counter from './components/Counter.vue'

const title = ref('YYC³ Vue App')
</script>

<template>
  <div class="app">
    <Header :title="title" />
    <main class="main-content">
      <Counter :initial="0" />
      <p class="hint">使用 Vue 3 + TypeScript 构建</p>
    </main>
  </div>
</template>

<style>
.app {
  min-height: 100vh;
  background: #020617;
  color: #e2e8f0;
  font-family: Inter, sans-serif;
}

.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 24px;
  min-height: calc(100vh - 80px);
}

.hint {
  font-size: 12px;
  color: #475569;
  font-family: monospace;
}
</style>`,
        language: 'html',
      },
      '/src/components/Header.vue': {
        content: `<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="header">
    <h1 class="header-title">{{ title }}</h1>
    <p v-if="subtitle" class="header-subtitle">{{ subtitle }}</p>
  </header>
</template>

<style scoped>
.header {
  padding: 24px;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.header-title {
  background: linear-gradient(to right, #42B883, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  font-size: 24px;
}

.header-subtitle {
  color: #94a3b8;
  font-size: 14px;
  margin: 4px 0 0;
}
</style>`,
        language: 'html',
      },
      '/src/components/Counter.vue': {
        content: `<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  initial?: number
  step?: number
}>(), {
  initial: 0,
  step: 1,
})

const count = ref(props.initial)

const increment = () => count.value += props.step
const decrement = () => count.value -= props.step
const reset = () => count.value = props.initial
</script>

<template>
  <div class="counter">
    <div class="count">{{ count }}</div>
    <div class="buttons">
      <button @click="decrement" class="btn btn-danger">-{{ step }}</button>
      <button @click="reset" class="btn btn-secondary">重置</button>
      <button @click="increment" class="btn btn-primary">+{{ step }}</button>
    </div>
  </div>
</template>

<style scoped>
.counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.06);
}

.count {
  font-size: 48px;
  color: #e2e8f0;
  font-family: monospace;
}

.buttons {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-family: monospace;
}

.btn-primary { background: #42B883; color: white; }
.btn-secondary { background: #334155; color: #e2e8f0; }
.btn-danger { background: #ef4444; color: white; }
</style>`,
        language: 'html',
      },
      '/package.json': {
        content: `{
  "name": "yyc3-vue-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build"
  },
  "dependencies": {
    "vue": "^3.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.5.0",
    "vue-tsc": "^2.0.0",
    "vite": "^5.4.0"
  }
}`,
        language: 'json',
      },
    },
  },

  // ========== Express API Server ==========
  {
    id: 'express-api',
    name: 'Express API 服务',
    description: 'Node.js + Express + TypeScript REST API 服务器',
    icon: '🚀',
    color: '#68A063',
    tags: ['Node.js', 'Express', 'REST'],
    entryPoint: '/src/index.ts',
    files: {
      '/src/index.ts': {
        content: `import express from 'express'
import cors from 'cors'
import { router } from './routes'
import { errorHandler } from './middleware/error-handler'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api', router)

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  })
})

// Error handler
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(\`🚀 YYC³ API Server running on port \${PORT}\`)
  console.log(\`📋 Health: http://localhost:\${PORT}/health\`)
  console.log(\`📡 API:    http://localhost:\${PORT}/api\`)
})

export default app`,
        language: 'typescript',
      },
      '/src/routes/index.ts': {
        content: `import { Router } from 'express'

export const router = Router()

// GET /api/users
router.get('/users', (_req, res) => {
  res.json({
    data: [
      { id: 1, name: '沫言总', role: 'PRODUCT_MANAGER' },
      { id: 2, name: '智源架构师', role: 'AI_ARCHITECT' },
      { id: 3, name: '织码工匠', role: 'CODE_ARTISAN' },
    ],
    total: 3,
  })
})

// POST /api/users
router.post('/users', (req, res) => {
  const { name, role } = req.body
  if (!name || !role) {
    return res.status(400).json({ error: 'name and role required' })
  }
  res.status(201).json({
    id: Date.now(),
    name,
    role,
    createdAt: new Date().toISOString(),
  })
})

// GET /api/status
router.get('/status', (_req, res) => {
  res.json({
    server: 'YYC³ API',
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
  })
})`,
        language: 'typescript',
      },
      '/src/middleware/error-handler.ts': {
        content: `import { Request, Response, NextFunction } from 'express'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error]', err.message)
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString(),
  })
}`,
        language: 'typescript',
      },
      '/package.json': {
        content: `{
  "name": "yyc3-api-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.19.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "typescript": "^5.5.0",
    "tsx": "^4.16.0"
  }
}`,
        language: 'json',
      },
      '/tsconfig.json': {
        content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true
  },
  "include": ["src"]
}`,
        language: 'json',
      },
    },
  },

  // ========== Static HTML ==========
  {
    id: 'static-html',
    name: '静态网页',
    description: '纯 HTML + CSS + JavaScript 静态页面',
    icon: '🌐',
    color: '#E44D26',
    tags: ['HTML', 'CSS', 'JavaScript'],
    entryPoint: '/index.html',
    files: {
      '/index.html': {
        content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YYC³ 静态页面</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="header">
    <h1>🧊 YYC³ 静态页面</h1>
    <p>万象归元于云枢</p>
  </header>

  <main class="container">
    <section class="card">
      <h2>功能卡片</h2>
      <p>使用纯 HTML + CSS + JavaScript 构建</p>
      <button id="counter-btn" class="btn">点击计数: 0</button>
    </section>

    <section class="card">
      <h2>响应式设计</h2>
      <p>自适应多种屏幕尺寸</p>
    </section>
  </main>

  <footer class="footer">
    <p>YYC³ AI Family &copy; 2026</p>
  </footer>

  <script src="main.js"></script>
</body>
</html>`,
        language: 'html',
      },
      '/styles.css': {
        content: `* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #020617;
  color: #e2e8f0;
  font-family: Inter, -apple-system, sans-serif;
  min-height: 100vh;
}

.header {
  padding: 32px 24px;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  text-align: center;
}

.header h1 {
  background: linear-gradient(to right, #4ade80, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 28px;
}

.header p { color: #64748b; margin-top: 8px; }

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 24px;
}

.card h2 { color: #4ade80; margin-bottom: 8px; font-size: 18px; }
.card p { color: #94a3b8; font-size: 14px; }

.btn {
  margin-top: 16px;
  padding: 10px 24px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn:hover { background: #059669; }

.footer {
  text-align: center;
  padding: 24px;
  color: #475569;
  font-size: 12px;
  font-family: monospace;
}`,
        language: 'css',
      },
      '/main.js': {
        content: `// YYC³ 静态页面交互
document.addEventListener('DOMContentLoaded', () => {
  let count = 0
  const btn = document.getElementById('counter-btn')
  
  if (btn) {
    btn.addEventListener('click', () => {
      count++
      btn.textContent = \`点击计数: \${count}\`
      
      // 动画效果
      btn.style.transform = 'scale(0.95)'
      setTimeout(() => {
        btn.style.transform = 'scale(1)'
      }, 100)
    })
  }

  console.log('🧊 YYC³ 静态页面已加载')
})`,
        language: 'javascript',
      },
    },
  },

  // ========== Bun API ==========
  {
    id: 'bun-api',
    name: 'Bun API 服务',
    description: 'Bun Runtime + Hono 高性能 API 服务器',
    icon: '🥟',
    color: '#fbf0df',
    tags: ['Bun', 'Hono', 'TypeScript'],
    entryPoint: '/src/index.ts',
    files: {
      '/src/index.ts': {
        content: `import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', logger())

// Health Check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    runtime: 'Bun',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

// API Routes
app.get('/api/family', (c) => {
  return c.json({
    data: [
      { id: 'PM', name: '沫言总', model: '${MODEL_GLM4_PLUS}', status: 'online' },
      { id: 'ARCH', name: '智源架构师', model: '${MODEL_GLM4_PLUS}', status: 'online' },
      { id: 'CODE', name: '织码工匠', model: '${MODEL_CODEGEEX4}', status: 'busy' },
      { id: 'GUARD', name: '守护哨兵', model: '${MODEL_GLM4_PLUS}', status: 'online' },
    ],
  })
})

app.post('/api/chat', async (c) => {
  const body = await c.req.json()
  return c.json({
    response: \`收到消息: \${body.message}\`,
    model: '${MODEL_GLM4_PLUS}',
    latency: Math.round(Math.random() * 200 + 50),
  })
})

export default {
  port: 3080,
  fetch: app.fetch,
}

console.log('🥟 YYC³ Bun API running on port 3080')`,
        language: 'typescript',
      },
      '/package.json': {
        content: `{
  "name": "yyc3-bun-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "bun run --hot src/index.ts",
    "start": "bun run src/index.ts"
  },
  "dependencies": {
    "hono": "^4.4.0"
  }
}`,
        language: 'json',
      },
      '/tsconfig.json': {
        content: `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "types": ["bun-types"]
  },
  "include": ["src"]
}`,
        language: 'json',
      },
    },
  },
]

// ==========================================
// Helper Functions
// ==========================================

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find(t => t.id === id)
}

export function getTemplateFiles(id: string): Record<string, { content: string; language: string }> {
  return getTemplateById(id)?.files || {}
}

export function getTemplateEntryPoint(id: string): string {
  return getTemplateById(id)?.entryPoint || '/src/App.tsx'
}