/**
 * file: useVirtualFileSystem.ts
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
 * useVirtualFileSystem - 虚拟文件系统 Hook
 * 
 * 职责：
 * - 管理内存中的多文件项目结构
 * - 文件内容读写（CRUD）
 * - 模块解析（import/export 依赖分析）
 * - SandboxPreview 多文件打包支持
 * - 文件变更事件通知
 * 
 * Step 7a: 支持多文件项目虚拟文件系统预览
 * 
 * @file hooks/useVirtualFileSystem.ts
 */

import { useState, useCallback, useMemo } from 'react'

// ==========================================
// Types
// ==========================================

/** 虚拟文件 */
export interface VirtualFile {
  /** 文件路径（如 '/src/App.tsx'） */
  path: string
  /** 文件内容 */
  content: string
  /** 语言 */
  language: string
  /** 最后修改时间 */
  lastModified: number
  /** 是否有未保存的变更 */
  isDirty: boolean
}

/** 虚拟文件系统状态 */
export interface VFSState {
  files: Map<string, VirtualFile>
  entryPoint: string
}

/** 打包结果 */
export interface BundleResult {
  /** 打包后的 HTML */
  html: string
  /** 入口组件名 */
  entryComponent: string
  /** 依赖文件列表 */
  dependencies: string[]
  /** 打包耗时 (ms) */
  buildTime: number
  /** 错误（如果有） */
  errors: BundleError[]
}

export interface BundleError {
  file: string
  message: string
  line?: number
}

export interface UseVirtualFileSystemReturn {
  /** 所有文件 */
  files: VirtualFile[]
  /** 获取单个文件 */
  getFile: (path: string) => VirtualFile | undefined
  /** 读取文件内容 */
  readFile: (path: string) => string | null
  /** 写入文件（创建或更新） */
  writeFile: (path: string, content: string, language?: string) => void
  /** 删除文件 */
  deleteFile: (path: string) => void
  /** 重命名文件 */
  renameFile: (oldPath: string, newPath: string) => void
  /** 检查文件是否存在 */
  exists: (path: string) => boolean
  /** 列出目录下的文件 */
  listDir: (dirPath: string) => string[]
  /** 入口点 */
  entryPoint: string
  /** 设置入口点 */
  setEntryPoint: (path: string) => void
  /** 打包为预览 HTML */
  bundle: () => BundleResult
  /** 标记文件为已保存 */
  markSaved: (path: string) => void
  /** 获取所有已变更文件 */
  getDirtyFiles: () => VirtualFile[]
  /** 重置为初始状态 */
  reset: () => void
}

// ==========================================
// 默认项目模板
// ==========================================

const DEFAULT_FILES: Record<string, { content: string; language: string }> = {
  '/src/App.tsx': {
    content: `import React, { useState } from 'react'

interface CounterProps {
  initial?: number
}

function Counter({ initial = 0 }: CounterProps) {
  const [count, setCount] = useState(initial)
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      padding: '24px',
      background: 'rgba(15, 23, 42, 0.8)',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <h2 style={{ color: '#4ade80', fontSize: '18px' }}>YYC³ 计数器</h2>
      <div style={{ fontSize: '48px', color: '#e2e8f0' }}>{count}</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setCount(c => c - 1)}
          style={{
            padding: '8px 20px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          -
        </button>
        <button
          onClick={() => setCount(0)}
          style={{
            padding: '8px 20px',
            background: '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          重置
        </button>
        <button
          onClick={() => setCount(c => c + 1)}
          style={{
            padding: '8px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#020617',
      fontFamily: 'Inter, sans-serif',
      gap: '24px',
    }}>
      <h1 style={{
        background: 'linear-gradient(to right, #4ade80, #22d3ee)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: '24px',
      }}>
        YYC³ 多文件预览
      </h1>
      <Counter initial={0} />
      <p style={{ color: '#475569', fontSize: '12px', fontFamily: 'monospace' }}>
        虚拟文件系统 · 实时预览
      </p>
    </div>
  )
}`,
    language: 'typescriptreact',
  },
  '/src/utils.ts': {
    content: `// 工具函数模块
export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN')
}

export function classNames(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export const VERSION = '1.0.0'
`,
    language: 'typescript',
  },
  '/src/styles.css': {
    content: `/* YYC³ 项目样式 */
:root {
  --bg-primary: #020617;
  --text-primary: #e2e8f0;
  --accent: #4ade80;
}

body {
  margin: 0;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: Inter, -apple-system, sans-serif;
}
`,
    language: 'css',
  },
}

// ==========================================
// 多文件打包器
// ==========================================

function stripTypeScript(code: string): string {
  return code
    // 移除 import 语句
    .replace(/^import\s+.*$/gm, '')
    // 移除 export 语句中的 type/interface
    .replace(/^export\s+(interface|type)\s+\w+[\s\S]*?^}/gm, '')
    // 移除 standalone interface/type
    .replace(/^(interface|type)\s+\w+[\s\S]*?^}/gm, '')
    // 移除类型参数 <T extends ...>
    .replace(/<[A-Z]\w*(?:\s+extends\s+\w+)?(?:\[\])?>/g, '')
    // 移除参数类型标注
    .replace(/:\s*(?:string|number|boolean|any|void|React\.\w+|[A-Z]\w+(?:\[\])?)(\s*(?=[,)\]=;{]))/g, '$1')
    // 移除 as const / as Type
    .replace(/\s+as\s+(?:const|[A-Z]\w+)/g, '')
    // 移除 export default
    .replace(/^export\s+default\s+/gm, '')
    // 移除 export
    .replace(/^export\s+(?:function|const|let|var|class)/gm, (match) => match.replace('export ', ''))
    .trim()
}

function bundleFiles(files: Map<string, VirtualFile>, entryPoint: string): BundleResult {
  const startTime = performance.now()
  const errors: BundleError[] = []
  const dependencies: string[] = []
  
  const entryFile = files.get(entryPoint)
  if (!entryFile) {
    return {
      html: '',
      entryComponent: 'App',
      dependencies: [],
      buildTime: 0,
      errors: [{ file: entryPoint, message: `入口文件不存在: ${entryPoint}` }],
    }
  }

  // 提取入口组件名
  const defaultExportMatch = entryFile.content.match(
    /export\s+default\s+function\s+(\w+)/
  )
  const namedExportMatch = entryFile.content.match(
    /export\s+function\s+(\w+)/
  )
  const entryComponent = defaultExportMatch?.[1] || namedExportMatch?.[1] || 'App'

  // 收集所有 CSS
  let allCSS = ''
  files.forEach((file, path) => {
    if (path.endsWith('.css')) {
      allCSS += `/* ${path} */\n${file.content}\n`
      dependencies.push(path)
    }
  })

  // 收集所有 TS/TSX/JS 文件代码（扁平化）
  const codeBlocks: string[] = []
  
  // 先处理非入口文件
  files.forEach((file, path) => {
    if (path === entryPoint) return
    if (path.endsWith('.ts') || path.endsWith('.tsx') || path.endsWith('.js') || path.endsWith('.jsx')) {
      try {
        const stripped = stripTypeScript(file.content)
        if (stripped.trim()) {
          codeBlocks.push(`// === ${path} ===\n${stripped}`)
          dependencies.push(path)
        }
      } catch (err: any) {
        errors.push({ file: path, message: err.message })
      }
    }
  })

  // 最后处理入口文件
  try {
    const entryStripped = stripTypeScript(entryFile.content)
    codeBlocks.push(`// === ${entryPoint} (entry) ===\n${entryStripped}`)
    dependencies.push(entryPoint)
  } catch (err: any) {
    errors.push({ file: entryPoint, message: err.message })
  }

  const allCode = codeBlocks.join('\n\n')

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YYC³ Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      background: #020617;
      color: #e2e8f0;
      min-height: 100vh;
    }
    #root { min-height: 100vh; }
    .preview-error {
      padding: 24px;
      background: #1e1012;
      border: 1px solid #f8717150;
      border-radius: 12px;
      margin: 16px;
      color: #fca5a5;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      white-space: pre-wrap;
    }
    .preview-error-title {
      color: #ef4444; font-size: 14px; font-weight: 600;
      margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
    }
    ${allCSS}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module">
    const { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext } = React;

    try {
      ${allCode}

      const rootEl = document.getElementById('root');
      const root = ReactDOM.createRoot(rootEl);
      root.render(React.createElement(${entryComponent}));
      
      window.parent.postMessage({ type: 'preview-ready', fileCount: ${dependencies.length} }, '*');
    } catch (err) {
      document.getElementById('root').innerHTML =
        '<div class="preview-error">' +
        '<div class="preview-error-title">⚠ 渲染错误</div>' +
        err.message + '</div>';
      window.parent.postMessage({
        type: 'preview-error',
        error: { message: err.message }
      }, '*');
    }
  </script>
  <script>
    window.onerror = function(msg, url, line, col) {
      document.getElementById('root').innerHTML =
        '<div class="preview-error"><div class="preview-error-title">⚠ 运行时错误</div>' +
        msg + (line ? ' (行 ' + line + ')' : '') + '</div>';
      window.parent.postMessage({
        type: 'preview-error',
        error: { message: String(msg), line: line, column: col }
      }, '*');
      return true;
    };
    window.addEventListener('unhandledrejection', function(e) {
      document.getElementById('root').innerHTML =
        '<div class="preview-error"><div class="preview-error-title">⚠ 转译错误</div>' +
        e.reason + '</div>';
      window.parent.postMessage({
        type: 'preview-error', error: { message: String(e.reason) }
      }, '*');
    });
  </script>
</body>
</html>`

  return {
    html,
    entryComponent,
    dependencies,
    buildTime: performance.now() - startTime,
    errors,
  }
}

// ==========================================
// Hook 实现
// ==========================================

export function useVirtualFileSystem(
  initialFiles?: Record<string, { content: string; language: string }>,
  initialEntryPoint?: string
): UseVirtualFileSystemReturn {
  const defaultEntry = initialEntryPoint || '/src/App.tsx'
  
  const initFiles = (): Map<string, VirtualFile> => {
    const map = new Map<string, VirtualFile>()
    const source = initialFiles || DEFAULT_FILES
    for (const [path, { content, language }] of Object.entries(source)) {
      map.set(path, {
        path,
        content,
        language,
        lastModified: Date.now(),
        isDirty: false,
      })
    }
    return map
  }

  const [state, setState] = useState<VFSState>({
    files: initFiles(),
    entryPoint: defaultEntry,
  })

  const files = useMemo(() => Array.from(state.files.values()), [state.files])

  const getFile = useCallback((path: string) => state.files.get(path), [state.files])

  const readFile = useCallback((path: string) => {
    const file = state.files.get(path)
    return file ? file.content : null
  }, [state.files])

  const writeFile = useCallback((path: string, content: string, language?: string) => {
    setState(prev => {
      const newFiles = new Map(prev.files)
      const existing = newFiles.get(path)
      newFiles.set(path, {
        path,
        content,
        language: language || existing?.language || detectLanguage(path),
        lastModified: Date.now(),
        isDirty: true,
      })
      return { ...prev, files: newFiles }
    })
  }, [])

  const deleteFile = useCallback((path: string) => {
    setState(prev => {
      const newFiles = new Map(prev.files)
      newFiles.delete(path)
      const newEntry = prev.entryPoint === path
        ? (newFiles.keys().next().value || '/src/App.tsx')
        : prev.entryPoint
      return { ...prev, files: newFiles, entryPoint: newEntry }
    })
  }, [])

  const renameFile = useCallback((oldPath: string, newPath: string) => {
    setState(prev => {
      const newFiles = new Map(prev.files)
      const file = newFiles.get(oldPath)
      if (!file) return prev
      newFiles.delete(oldPath)
      newFiles.set(newPath, {
        ...file,
        path: newPath,
        language: detectLanguage(newPath),
        lastModified: Date.now(),
        isDirty: true,
      })
      const newEntry = prev.entryPoint === oldPath ? newPath : prev.entryPoint
      return { ...prev, files: newFiles, entryPoint: newEntry }
    })
  }, [])

  const exists = useCallback((path: string) => state.files.has(path), [state.files])

  const listDir = useCallback((dirPath: string) => {
    const prefix = dirPath.endsWith('/') ? dirPath : dirPath + '/'
    const result: string[] = []
    state.files.forEach((_, path) => {
      if (path.startsWith(prefix)) {
        const rest = path.slice(prefix.length)
        const firstSegment = rest.split('/')[0]
        if (!result.includes(firstSegment)) {
          result.push(firstSegment)
        }
      }
    })
    return result
  }, [state.files])

  const setEntryPoint = useCallback((path: string) => {
    setState(prev => ({ ...prev, entryPoint: path }))
  }, [])

  const bundle = useCallback((): BundleResult => {
    return bundleFiles(state.files, state.entryPoint)
  }, [state.files, state.entryPoint])

  const markSaved = useCallback((path: string) => {
    setState(prev => {
      const newFiles = new Map(prev.files)
      const file = newFiles.get(path)
      if (file) {
        newFiles.set(path, { ...file, isDirty: false })
      }
      return { ...prev, files: newFiles }
    })
  }, [])

  const getDirtyFiles = useCallback(() => {
    return Array.from(state.files.values()).filter(f => f.isDirty)
  }, [state.files])

  const reset = useCallback(() => {
    setState({ files: initFiles(), entryPoint: defaultEntry })
  }, [])  

  return {
    files,
    getFile,
    readFile,
    writeFile,
    deleteFile,
    renameFile,
    exists,
    listDir,
    entryPoint: state.entryPoint,
    setEntryPoint,
    bundle,
    markSaved,
    getDirtyFiles,
    reset,
  }
}

// ==========================================
// Helpers
// ==========================================

function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescriptreact',
    js: 'javascript', jsx: 'javascriptreact',
    json: 'json', md: 'markdown', css: 'css',
    html: 'html', py: 'python', sql: 'sql',
  }
  return map[ext || ''] || 'plaintext'
}
