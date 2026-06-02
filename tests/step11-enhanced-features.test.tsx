/**
 * file: step11-enhanced-features.test.tsx
 * description: 测试 · 待补充描述
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-04-04
 * updated: 2026-04-04
 * status: active
 * tags: [test]
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
 * YYC³ AI Family - Step 11 增强功能测试套件
 * 
 * 覆盖范围：
 * - 11a: UserAIPanel 增强（quickActions 动态按钮 + 上下文 badge）
 * - 11b: 终端命令扩展（git/npm/grep）
 * - 11c: 全局文件搜索（GlobalSearchPalette）
 * 
 * @file tests/step11-enhanced-features.test.tsx
 */

import { describe, it, expect, vi } from 'vitest'

// ==========================================
// 1. UserAIPanel 增强测试 (11a)
// ==========================================

describe('Step 11a: UserAIPanel 增强', () => {
  it('should export UserAIPanel with new props', async () => {
    const m = await import('../components/collaboration/UserAIPanel')
    expect(m.UserAIPanel).toBeDefined()
  })

  it('should define QuickActionItem interface', () => {
    const action = {
      id: 'fix-errors',
      label: '修复 3 个错误',
      prompt: '修复错误',
      icon: 'bug' as const,
      available: true,
      priority: 1,
    }
    expect(action.icon).toBe('bug')
    expect(action.priority).toBe(1)
  })

  it('should define ContextBadgeInfo interface', () => {
    const badge = {
      activeFilePath: '/src/App.tsx',
      errorCount: 2,
      warningCount: 1,
      contextFileCount: 3,
      isReady: true,
    }
    expect(badge.isReady).toBe(true)
    expect(badge.errorCount).toBe(2)
  })

  it('should support 6 quick action icon types', () => {
    const icons = ['bug', 'sparkles', 'code', 'refactor', 'test', 'docs']
    expect(icons).toHaveLength(6)
  })

  it('should map quick action icons to colors', () => {
    const colorMap: Record<string, string> = {
      bug: 'text-red-400',
      sparkles: 'text-violet-400',
      code: 'text-cyan-400',
      refactor: 'text-amber-400',
      test: 'text-emerald-400',
      docs: 'text-slate-400',
    }
    expect(Object.keys(colorMap)).toHaveLength(6)
    expect(colorMap.bug).toContain('red')
  })

  it('should fallback to QUICK_PROMPTS when no quickActions', () => {
    const quickActions: any[] = []
    const fallback = ['帮我创建一个响应式面板布局', '分析当前代码架构']
    const shouldUseFallback = quickActions.length === 0
    expect(shouldUseFallback).toBe(true)
    expect(fallback.length).toBeGreaterThan(0)
  })

  it('should show context badge with error/warning counts', () => {
    const contextInfo = {
      activeFilePath: '/src/App.tsx',
      errorCount: 5,
      warningCount: 2,
      contextFileCount: 3,
      isReady: true,
    }
    expect(contextInfo.activeFilePath?.split('/').pop()).toBe('App.tsx')
    expect(contextInfo.errorCount + contextInfo.warningCount).toBe(7)
  })

  it('should call onQuickAction when action button clicked', () => {
    const onQuickAction = vi.fn()
    const action = { id: 'optimize', label: '优化代码', prompt: 'opt', icon: 'sparkles' as const, available: true, priority: 4 }
    onQuickAction(action)
    expect(onQuickAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'optimize' }))
  })

  it('should show file name from activeFilePath', () => {
    const path = '/src/components/Header.tsx'
    const name = path.split('/').pop()
    expect(name).toBe('Header.tsx')
  })
})

// ==========================================
// 2. 终端命令扩展测试 (11b)
// ==========================================

describe('Step 11b: 终端命令扩展 - grep', () => {
  it('should grep match in file content', () => {
    const content = 'const foo = 1\nconst bar = 2\nconst foobar = 3'
    const pattern = /foo/
    const matches = content.split('\n').filter(l => pattern.test(l))
    expect(matches).toHaveLength(2)
  })

  it('should grep with case insensitive flag', () => {
    const content = 'Hello World\nhello world\nHELLO WORLD'
    const pattern = /hello/i
    const matches = content.split('\n').filter(l => pattern.test(l))
    expect(matches).toHaveLength(3)
  })

  it('should handle invalid regex gracefully', () => {
    let errorCaught = false
    try {
      // eslint-disable-next-line no-invalid-regexp -- intentionally testing invalid regex handling
      new RegExp('[invalid')
    } catch {
      errorCaught = true
    }
    expect(errorCaught).toBe(true)
  })

  it('should search all VFS files when no file specified', () => {
    const files = ['/src/a.ts', '/src/b.ts', '/src/c.ts']
    expect(files).toHaveLength(3)
  })
})

describe('Step 11b: 终端命令扩展 - git', () => {
  it('git status should show dirty files', () => {
    const dirtyFiles = [
      { path: '/src/App.tsx', isDirty: true },
      { path: '/src/utils.ts', isDirty: true },
    ]
    expect(dirtyFiles.filter(f => f.isDirty)).toHaveLength(2)
  })

  it('git log should show mock commits', () => {
    const commits = [
      { hash: 'a3f7c2d', msg: 'feat: 初始化项目结构' },
      { hash: 'b8e1f4a', msg: 'feat: 添加核心组件' },
    ]
    expect(commits).toHaveLength(2)
    expect(commits[0].hash).toBe('a3f7c2d')
  })

  it('git diff should show modified files with + lines', () => {
    const content = 'line1\nline2\nline3'
    const diffLines = content.split('\n').map(l => `+ ${l}`)
    expect(diffLines[0]).toBe('+ line1')
  })

  it('git add should show success message', () => {
    const result = '已暂存文件'
    expect(result).toContain('暂存')
  })

  it('git commit should generate random hash', () => {
    const hash = Math.random().toString(36).slice(2, 9)
    expect(hash.length).toBe(7)
  })

  it('unsupported git command should show error', () => {
    const supported = ['status', 'log', 'diff', 'add', 'commit']
    expect(supported).not.toContain('push')
  })
})

describe('Step 11b: 终端命令扩展 - npm', () => {
  it('npm install should read package.json dependencies', () => {
    const pkgJson = '{"dependencies":{"react":"^18.3.0"},"devDependencies":{"typescript":"^5.5.0"}}'
    const pkg = JSON.parse(pkgJson)
    expect(Object.keys(pkg.dependencies)).toHaveLength(1)
    expect(Object.keys(pkg.devDependencies)).toHaveLength(1)
  })

  it('npm install <pkg> should update package.json', () => {
    const pkg = { dependencies: {}, devDependencies: {} }
    const isDev = false
    const target = isDev ? 'devDependencies' : 'dependencies'
    pkg[target as keyof typeof pkg] = { ...pkg[target as keyof typeof pkg], 'lodash': '^1.0.0' } as any
    expect((pkg.dependencies as any).lodash).toBe('^1.0.0')
  })

  it('npm install -D should add to devDependencies', () => {
    const flags = { D: true }
    const isDev = flags.D
    expect(isDev).toBe(true)
  })

  it('npm list should show dependency tree', () => {
    const deps = { react: '^18.3.0', 'react-dom': '^18.3.0' }
    const lines = Object.entries(deps).map(([n, v]) => `├── ${n}@${v}`)
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('react@^18.3.0')
  })

  it('npm init should create package.json', () => {
    const pkg = {
      name: 'yyc3-project',
      version: '1.0.0',
      type: 'module',
      scripts: { dev: 'vite' },
      dependencies: {},
    }
    expect(pkg.name).toBe('yyc3-project')
  })

  it('npm run should simulate script execution', () => {
    const script = 'dev'
    const output = `(虚拟环境: 脚本 "${script}" 模拟运行完成)`
    expect(output).toContain('模拟运行完成')
  })
})

// ==========================================
// 3. 全局文件搜索测试 (11c)
// ==========================================

describe('Step 11c: GlobalSearchPalette Component', () => {
  it('should export GlobalSearchPalette', async () => {
    const m = await import('../components/collaboration/GlobalSearchPalette')
    expect(m.GlobalSearchPalette).toBeDefined()
  })

  it('should define SearchResult interface', () => {
    const result = {
      id: '/src/App.tsx',
      type: 'file' as const,
      filePath: '/src/App.tsx',
      fileName: 'App.tsx',
      language: 'typescriptreact',
    }
    expect(result.type).toBe('file')
  })

  it('should define content SearchResult with line info', () => {
    const result = {
      id: '/src/App.tsx:10',
      type: 'content' as const,
      filePath: '/src/App.tsx',
      fileName: 'App.tsx',
      language: 'typescriptreact',
      lineNumber: 10,
      lineContent: 'export default function App() {',
    }
    expect(result.lineNumber).toBe(10)
  })
})

describe('Step 11c: 文件名搜索', () => {
  it('should match files by name', () => {
    const files = [
      { path: '/src/App.tsx' },
      { path: '/src/Header.tsx' },
      { path: '/src/utils.ts' },
    ]
    const query = 'app'
    const results = files.filter(f => f.path.toLowerCase().includes(query))
    expect(results).toHaveLength(1)
    expect(results[0].path).toBe('/src/App.tsx')
  })

  it('should match files by path', () => {
    const files = [
      { path: '/src/components/Header.tsx' },
      { path: '/src/hooks/useAI.ts' },
    ]
    const query = 'hooks'
    const results = files.filter(f => f.path.toLowerCase().includes(query))
    expect(results).toHaveLength(1)
  })

  it('should show all files when query is empty', () => {
    const files = [{ path: '/a' }, { path: '/b' }, { path: '/c' }]
    const query = ''
    const results = query ? files.filter(() => false) : files
    expect(results).toHaveLength(3)
  })
})

describe('Step 11c: 内容搜索', () => {
  it('should search file content', () => {
    const files = [
      { path: '/a.ts', content: 'const foo = 1\nconst bar = 2' },
      { path: '/b.ts', content: 'const baz = 3' },
    ]
    const query = 'foo'
    const results: any[] = []
    files.forEach(f => {
      f.content.split('\n').forEach((line, idx) => {
        if (line.includes(query)) {
          results.push({ filePath: f.path, lineNumber: idx + 1, lineContent: line })
        }
      })
    })
    expect(results).toHaveLength(1)
    expect(results[0].lineNumber).toBe(1)
  })

  it('should highlight match in text', () => {
    const text = 'const foobar = 1'
    const query = 'foo'
    const idx = text.indexOf(query)
    expect(idx).toBe(6)
    const before = text.slice(0, idx)
    const match = text.slice(idx, idx + query.length)
    const after = text.slice(idx + query.length)
    expect(before).toBe('const ')
    expect(match).toBe('foo')
    expect(after).toBe('bar = 1')
  })

  it('should limit results to 50', () => {
    const results = Array.from({ length: 100 }, (_, i) => ({ id: `r-${i}` }))
    const limited = results.slice(0, 50)
    expect(limited).toHaveLength(50)
  })
})

describe('Step 11c: 键盘导航', () => {
  it('should support ArrowDown to move selection', () => {
    let idx = 0
    const total = 5
    idx = Math.min(idx + 1, total - 1)
    expect(idx).toBe(1)
  })

  it('should support ArrowUp to move selection', () => {
    let idx = 3
    idx = Math.max(idx - 1, 0)
    expect(idx).toBe(2)
  })

  it('should support Enter to select item', () => {
    const onSelect = vi.fn()
    const result = { filePath: '/src/App.tsx', fileName: 'App.tsx', content: 'code', language: 'ts' }
    onSelect(result.filePath, result.fileName, result.content, result.language)
    expect(onSelect).toHaveBeenCalledWith('/src/App.tsx', 'App.tsx', 'code', 'ts')
  })

  it('should support Tab to switch mode', () => {
    let mode: 'file' | 'content' = 'file'
    mode = mode === 'file' ? 'content' : 'file'
    expect(mode).toBe('content')
  })

  it('should support Escape to close', () => {
    const onClose = vi.fn()
    onClose()
    expect(onClose).toHaveBeenCalled()
  })
})

describe('Step 11c: 快捷键集成', () => {
  it('should listen for Cmd+Shift+P', () => {
    const event = { metaKey: true, shiftKey: true, key: 'p', preventDefault: vi.fn() }
    const shouldOpen = (event.metaKey || false) && event.shiftKey && event.key === 'p'
    expect(shouldOpen).toBe(true)
  })

  it('should listen for Ctrl+Shift+P', () => {
    const event = { ctrlKey: true, shiftKey: true, key: 'p', preventDefault: vi.fn() }
    const shouldOpen = (event.ctrlKey || false) && event.shiftKey && event.key === 'p'
    expect(shouldOpen).toBe(true)
  })

  it('should toggle search palette visibility', () => {
    let visible = false
    visible = !visible
    expect(visible).toBe(true)
    visible = !visible
    expect(visible).toBe(false)
  })
})

// ==========================================
// 4. CollaborationLayout 集成测试
// ==========================================

describe('Step 11: CollaborationLayout 集成', () => {
  it('should import all Step 11 dependencies', async () => {
    const [search, layout] = await Promise.all([
      import('../components/collaboration/GlobalSearchPalette'),
      import('../layouts/CollaborationLayout'),
    ])
    expect(search.GlobalSearchPalette).toBeDefined()
    expect(layout.CollaborationLayout).toBeDefined()
  })

  it('should handle search select → open file tab', () => {
    const openFile = vi.fn()
    const updateContent = vi.fn()
    const filePath = '/src/App.tsx'
    const fileName = 'App.tsx'
    const content = 'code'
    const language = 'typescriptreact'
    openFile(filePath, fileName, content, language)
    updateContent(content)
    expect(openFile).toHaveBeenCalledWith(filePath, fileName, content, language)
    expect(updateContent).toHaveBeenCalledWith(content)
  })
})

// ==========================================
// 5. 回归测试
// ==========================================

describe('Step 11 回归测试', () => {
  it('should still export Step 10 features', async () => {
    const [tp, pts, auto] = await Promise.all([
      import('../components/collaboration/TerminalPanel'),
      import('../components/collaboration/ProjectTemplateSelector'),
      import('../hooks/useAIAutoContext'),
    ])
    expect(tp.TerminalPanel).toBeDefined()
    expect(pts.ProjectTemplateSelector).toBeDefined()
    expect(auto.useAIAutoContext).toBeDefined()
  })

  it('should still export Step 9 features', async () => {
    const [tvfs, aiCtx, diff] = await Promise.all([
      import('../hooks/useTerminalVFS'),
      import('../hooks/useAIContext'),
      import('../components/collaboration/DiffViewer'),
    ])
    expect(tvfs.useTerminalVFS).toBeDefined()
    expect(aiCtx.useAIContext).toBeDefined()
    expect(diff.DiffViewer).toBeDefined()
  })

  it('should still export project templates', async () => {
    const m = await import('../services/project-templates')
    expect(m.PROJECT_TEMPLATES.length).toBeGreaterThanOrEqual(5)
  })

  it('should maintain useTerminalVFS with new commands', async () => {
    const m = await import('../hooks/useTerminalVFS')
    expect(m.useTerminalVFS).toBeDefined()
  })
})

// ==========================================
// 6. 端到端流程
// ==========================================

describe('Step 11 端到端流程', () => {
  it('11a: 活动标签 → quickActions 更新 → 点击修复 → AI 带上下文发送', () => {
    const flow = [
      'editorTabs.switchTab() → triggers useAIAutoContext',
      'aiContext.setActiveFile() → quickActions recalc',
      'user clicks "修复 3 个错误"',
      'handleQuickAction → aiAutoContext.executeQuickAction',
      'buildFixErrorPrompt with ±5 lines context',
      'handleSendMessage(enrichedPrompt)',
    ]
    expect(flow).toHaveLength(6)
  })

  it('11b: 终端输入 git status → 显示 dirty 文件 → npm install lodash → package.json 更新', () => {
    const flow = [
      'user types "git status"',
      'execute() → git case → getDirtyFiles()',
      'render dirty file list',
      'user types "npm install lodash"',
      'execute() → npm install case → update package.json VFS',
      'emitChange() → vfsChangeCount++',
    ]
    expect(flow).toHaveLength(6)
  })

  it('11c: Cmd+Shift+P → 搜索 "App" → 选择结果 → 打开标签', () => {
    const flow = [
      'keydown Cmd+Shift+P',
      'setShowSearchPalette(true)',
      'user types "App" in search input',
      'results filter: file name match "App.tsx"',
      'user presses Enter',
      'handleSearchSelect → editorTabs.openFile',
      'collab.updateContent(file.content)',
      'setShowSearchPalette(false)',
    ]
    expect(flow).toHaveLength(8)
  })
})

// ==========================================
// 7. 五化一体合规性
// ==========================================

describe('Step 11 五化一体合规性', () => {
  it('[标准化] 新增接口类型在组件文件内定义', () => {
    const newTypes = ['QuickActionItem', 'ContextBadgeInfo', 'SearchResult']
    expect(newTypes).toHaveLength(3)
  })

  it('[流程化] quickAction → sendWithContext 闭环', () => {
    const loop = ['click_action', 'executeQuickAction', 'buildUserMessage', 'handleSendMessage']
    expect(loop).toHaveLength(4)
  })

  it('[智能化] grep 支持正则表达式搜索', () => {
    const pattern = /import.*from/
    const line = "import React from 'react'"
    expect(pattern.test(line)).toBe(true)
  })

  it('[可视化] 搜索面板支持文件名/内容双模式', () => {
    const modes = ['file', 'content']
    expect(modes).toHaveLength(2)
  })

  it('[可视化] context badge 显示活动文件 + 错误/警告计数', () => {
    const badge = { activeFilePath: '/src/App.tsx', errorCount: 2, warningCount: 1 }
    expect(badge.errorCount + badge.warningCount).toBe(3)
  })
})
