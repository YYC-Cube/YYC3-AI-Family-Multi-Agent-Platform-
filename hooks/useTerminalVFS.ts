/**
 * file: useTerminalVFS.ts
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
 * useTerminalVFS - 终端 ↔ 虚拟文件系统联动 Hook
 * 
 * 职责：
 * - 解析终端命令（touch/rm/cat/ls/mkdir/mv/cp/echo/pwd/clear/help）
 * - 将命令转化为 VFS 操作
 * - 输出终端结果行
 * - 发送文件变更事件（供文件树刷新监听）
 * 
 * Step 9a: 终端 ↔ 文件系统联动
 * 
 * @file hooks/useTerminalVFS.ts
 */

import { useState, useCallback, useRef } from 'react'
import type { UseVirtualFileSystemReturn } from './useVirtualFileSystem'

// ==========================================
// Types
// ==========================================

export interface TerminalLine {
  id: string
  type: 'input' | 'output' | 'error' | 'info' | 'success'
  content: string
  timestamp: number
}

export interface VFSChangeEvent {
  type: 'create' | 'delete' | 'rename' | 'write' | 'mkdir'
  path: string
  newPath?: string
  timestamp: number
}

export interface UseTerminalVFSReturn {
  /** 终端输出行 */
  lines: TerminalLine[]
  /** 执行命令 */
  execute: (command: string) => void
  /** 清空终端 */
  clear: () => void
  /** 当前工作目录 */
  cwd: string
  /** 设置工作目录 */
  setCwd: (path: string) => void
  /** 命令历史 */
  history: string[]
  /** 文件变更事件（外部可监听） */
  lastChange: VFSChangeEvent | null
  /** 变更计数（用于触发 useEffect） */
  changeCount: number
}

// ==========================================
// 语言检测
// ==========================================

function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescriptreact', js: 'javascript', jsx: 'javascriptreact',
    json: 'json', md: 'markdown', css: 'css', scss: 'scss', html: 'html',
    py: 'python', rs: 'rust', go: 'go', yaml: 'yaml', yml: 'yaml',
    sh: 'shell', sql: 'sql', toml: 'toml', txt: 'plaintext',
  }
  return map[ext] || 'plaintext'
}

// ==========================================
// 路径解析
// ==========================================

function resolvePath(cwd: string, target: string): string {
  if (target.startsWith('/')) return normalizePath(target)
  const parts = cwd.split('/').filter(Boolean)
  const segments = target.split('/').filter(Boolean)
  for (const seg of segments) {
    if (seg === '..') { parts.pop() }
    else if (seg !== '.') { parts.push(seg) }
  }
  return '/' + parts.join('/')
}

function normalizePath(p: string): string {
  const parts = p.split('/').filter(Boolean)
  const result: string[] = []
  for (const part of parts) {
    if (part === '..') result.pop()
    else if (part !== '.') result.push(part)
  }
  return '/' + result.join('/')
}

function getFileName(p: string): string {
  return p.split('/').pop() || p
}

// ==========================================
// 命令解析器
// ==========================================

interface ParsedCommand {
  name: string
  args: string[]
  flags: Record<string, boolean>
  /** echo "content" > file 重定向 */
  redirect?: { content: string; target: string; append: boolean }
}

function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim()
  
  // 处理 echo "xxx" > file 或 echo "xxx" >> file
  const echoRedirect = trimmed.match(/^echo\s+["'](.+?)["']\s*(>>?)\s*(.+)$/)
  if (echoRedirect) {
    return {
      name: 'echo',
      args: [],
      flags: {},
      redirect: {
        content: echoRedirect[1],
        target: echoRedirect[3].trim(),
        append: echoRedirect[2] === '>>',
      },
    }
  }

  const tokens: string[] = []
  let current = ''
  let inQuote = false
  let quoteChar = ''
  for (const ch of trimmed) {
    if (inQuote) {
      if (ch === quoteChar) { inQuote = false }
      else { current += ch }
    } else if (ch === '"' || ch === "'") {
      inQuote = true
      quoteChar = ch
    } else if (ch === ' ') {
      if (current) { tokens.push(current); current = '' }
    } else {
      current += ch
    }
  }
  if (current) tokens.push(current)

  const name = tokens[0] || ''
  const flags: Record<string, boolean> = {}
  const args: string[] = []
  for (let i = 1; i < tokens.length; i++) {
    if (tokens[i].startsWith('-')) {
      for (const ch of tokens[i].slice(1)) flags[ch] = true
    } else {
      args.push(tokens[i])
    }
  }

  return { name, args, flags }
}

// ==========================================
// Hook 实现
// ==========================================

export function useTerminalVFS(vfs: UseVirtualFileSystemReturn): UseTerminalVFSReturn {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'welcome',
      type: 'info',
      content: '🧊 YYC³ Virtual Terminal v1.0 — 输入 help 查看可用命令',
      timestamp: Date.now(),
    },
  ])
  const [cwd, setCwd] = useState('/src')
  const [history, setHistory] = useState<string[]>([])
  const [lastChange, setLastChange] = useState<VFSChangeEvent | null>(null)
  const [changeCount, setChangeCount] = useState(0)
  const lineIdCounter = useRef(1)

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    const id = `line-${lineIdCounter.current++}`
    setLines(prev => [...prev, { id, type, content, timestamp: Date.now() }])
  }, [])

  const emitChange = useCallback((event: Omit<VFSChangeEvent, 'timestamp'>) => {
    const change = { ...event, timestamp: Date.now() }
    setLastChange(change)
    setChangeCount(c => c + 1)
  }, [])

  const execute = useCallback((command: string) => {
    const trimmed = command.trim()
    if (!trimmed) return

    setHistory(prev => [...prev, trimmed])
    addLine('input', `$ ${trimmed}`)

    const parsed = parseCommand(trimmed)

    switch (parsed.name) {
      // ========== touch ==========
      case 'touch': {
        if (parsed.args.length === 0) {
          addLine('error', 'touch: 缺少文件名参数')
          return
        }
        for (const arg of parsed.args) {
          const fullPath = resolvePath(cwd, arg)
          if (vfs.exists(fullPath)) {
            addLine('info', `touch: '${getFileName(arg)}' 已存在，更新时间戳`)
            // re-write same content to update timestamp
            const content = vfs.readFile(fullPath) || ''
            vfs.writeFile(fullPath, content, detectLanguage(fullPath))
          } else {
            vfs.writeFile(fullPath, '', detectLanguage(fullPath))
            addLine('success', `创建文件: ${fullPath}`)
            emitChange({ type: 'create', path: fullPath })
          }
        }
        break
      }

      // ========== rm ==========
      case 'rm': {
        if (parsed.args.length === 0) {
          addLine('error', 'rm: 缺少文件名参数')
          return
        }
        for (const arg of parsed.args) {
          const fullPath = resolvePath(cwd, arg)
          if (!vfs.exists(fullPath)) {
            addLine('error', `rm: 无法删除 '${arg}': 文件不存在`)
          } else {
            vfs.deleteFile(fullPath)
            addLine('success', `已删除: ${fullPath}`)
            emitChange({ type: 'delete', path: fullPath })
          }
        }
        break
      }

      // ========== cat ==========
      case 'cat': {
        if (parsed.args.length === 0) {
          addLine('error', 'cat: 缺少文件名参数')
          return
        }
        for (const arg of parsed.args) {
          const fullPath = resolvePath(cwd, arg)
          const content = vfs.readFile(fullPath)
          if (content === null) {
            addLine('error', `cat: ${arg}: 文件不存在`)
          } else {
            if (parsed.args.length > 1) addLine('info', `=== ${fullPath} ===`)
            if (content.length === 0) {
              addLine('info', '(空文件)')
            } else {
              // 逐行输出，限制 50 行
              const fileLines = content.split('\n')
              const maxLines = 50
              fileLines.slice(0, maxLines).forEach(l => addLine('output', l))
              if (fileLines.length > maxLines) {
                addLine('info', `... 省略 ${fileLines.length - maxLines} 行`)
              }
            }
          }
        }
        break
      }

      // ========== ls ==========
      case 'ls': {
        const targetDir = parsed.args[0] ? resolvePath(cwd, parsed.args[0]) : cwd
        const entries = vfs.listDir(targetDir)
        if (entries.length === 0) {
          addLine('info', '(空目录)')
        } else {
          const showAll = parsed.flags['l']
          if (showAll) {
            entries.forEach(entry => {
              const file = vfs.getFile(entry)
              if (file) {
                const size = file.content.length.toString().padStart(8)
                const mod = new Date(file.lastModified).toLocaleTimeString('zh-CN')
                const dirty = file.isDirty ? ' [未保存]' : ''
                addLine('output', `${size}B  ${mod}  ${getFileName(entry)}${dirty}`)
              } else {
                addLine('output', `    <DIR>            ${getFileName(entry)}/`)
              }
            })
          } else {
            const names = entries.map(e => getFileName(e))
            addLine('output', names.join('  '))
          }
        }
        break
      }

      // ========== mkdir ==========
      case 'mkdir': {
        if (parsed.args.length === 0) {
          addLine('error', 'mkdir: 缺少目录名参数')
          return
        }
        for (const arg of parsed.args) {
          const dirPath = resolvePath(cwd, arg)
          // VFS 不显式存储目录，创建占位 .gitkeep
          const placeholder = `${dirPath}/.gitkeep`
          vfs.writeFile(placeholder, '', 'plaintext')
          addLine('success', `创建目录: ${dirPath}/`)
          emitChange({ type: 'mkdir', path: dirPath })
        }
        break
      }

      // ========== cd ==========
      case 'cd': {
        const target = parsed.args[0] || '/src'
        const newCwd = resolvePath(cwd, target)
        setCwd(newCwd)
        addLine('info', `当前目录: ${newCwd}`)
        break
      }

      // ========== pwd ==========
      case 'pwd': {
        addLine('output', cwd)
        break
      }

      // ========== mv ==========
      case 'mv': {
        if (parsed.args.length < 2) {
          addLine('error', 'mv: 需要源路径和目标路径')
          return
        }
        const src = resolvePath(cwd, parsed.args[0])
        const dst = resolvePath(cwd, parsed.args[1])
        if (!vfs.exists(src)) {
          addLine('error', `mv: '${parsed.args[0]}': 文件不存在`)
        } else {
          vfs.renameFile(src, dst)
          addLine('success', `移动: ${src} → ${dst}`)
          emitChange({ type: 'rename', path: src, newPath: dst })
        }
        break
      }

      // ========== cp ==========
      case 'cp': {
        if (parsed.args.length < 2) {
          addLine('error', 'cp: 需要源路径和目标路径')
          return
        }
        const src = resolvePath(cwd, parsed.args[0])
        const dst = resolvePath(cwd, parsed.args[1])
        const content = vfs.readFile(src)
        if (content === null) {
          addLine('error', `cp: '${parsed.args[0]}': 文件不存在`)
        } else {
          vfs.writeFile(dst, content, detectLanguage(dst))
          addLine('success', `复制: ${src} → ${dst}`)
          emitChange({ type: 'create', path: dst })
        }
        break
      }

      // ========== echo (with redirect) ==========
      case 'echo': {
        if (parsed.redirect) {
          const fullPath = resolvePath(cwd, parsed.redirect.target)
          if (parsed.redirect.append) {
            const existing = vfs.readFile(fullPath) || ''
            vfs.writeFile(fullPath, existing + parsed.redirect.content + '\n', detectLanguage(fullPath))
            addLine('success', `追加到: ${fullPath}`)
          } else {
            vfs.writeFile(fullPath, parsed.redirect.content + '\n', detectLanguage(fullPath))
            addLine('success', `写入: ${fullPath}`)
          }
          emitChange({ type: 'write', path: fullPath })
        } else {
          addLine('output', parsed.args.join(' '))
        }
        break
      }

      // ========== wc ==========
      case 'wc': {
        if (parsed.args.length === 0) {
          addLine('error', 'wc: 缺少文件名参数')
          return
        }
        for (const arg of parsed.args) {
          const fullPath = resolvePath(cwd, arg)
          const content = vfs.readFile(fullPath)
          if (content === null) {
            addLine('error', `wc: ${arg}: 文件不存在`)
          } else {
            const lineCount = content.split('\n').length
            const wordCount = content.split(/\s+/).filter(Boolean).length
            const charCount = content.length
            addLine('output', `  ${lineCount} 行  ${wordCount} 词  ${charCount} 字符  ${getFileName(arg)}`)
          }
        }
        break
      }

      // ========== head ==========
      case 'head': {
        const n = parsed.flags['n'] ? 20 : 10
        if (parsed.args.length === 0) {
          addLine('error', 'head: 缺少文件名参数')
          return
        }
        const fullPath = resolvePath(cwd, parsed.args[0])
        const content = vfs.readFile(fullPath)
        if (content === null) {
          addLine('error', `head: ${parsed.args[0]}: 文件不存在`)
        } else {
          content.split('\n').slice(0, n).forEach(l => addLine('output', l))
        }
        break
      }

      // ========== clear ==========
      case 'clear': {
        setLines([{
          id: `clear-${Date.now()}`,
          type: 'info',
          content: '终端已清空',
          timestamp: Date.now(),
        }])
        break
      }

      // ========== tree ==========
      case 'tree': {
        const targetDir = parsed.args[0] ? resolvePath(cwd, parsed.args[0]) : cwd
        const allFiles = vfs.files
        const relevant = allFiles
          .filter(f => f.path.startsWith(targetDir))
          .sort((a, b) => a.path.localeCompare(b.path))
        if (relevant.length === 0) {
          addLine('info', '(空目录)')
        } else {
          addLine('output', getFileName(targetDir) || '/')
          relevant.forEach((f, i) => {
            const relativePath = f.path.slice(targetDir.length)
            const depth = relativePath.split('/').filter(Boolean).length
            const prefix = i === relevant.length - 1 ? '└── ' : '├── '
            const indent = '│   '.repeat(Math.max(0, depth - 1))
            addLine('output', `${indent}${prefix}${getFileName(f.path)}`)
          })
          addLine('info', `${relevant.length} 个文件`)
        }
        break
      }

      // ========== stat ==========
      case 'stat': {
        if (parsed.args.length === 0) {
          addLine('error', 'stat: 缺少文件名参数')
          return
        }
        const fullPath = resolvePath(cwd, parsed.args[0])
        const file = vfs.getFile(fullPath)
        if (!file) {
          addLine('error', `stat: '${parsed.args[0]}': 不存在`)
        } else {
          addLine('output', `  文件: ${file.path}`)
          addLine('output', `  大小: ${file.content.length} 字节`)
          addLine('output', `  语言: ${file.language}`)
          addLine('output', `  修改: ${new Date(file.lastModified).toLocaleString('zh-CN')}`)
          addLine('output', `  状态: ${file.isDirty ? '未保存' : '已保存'}`)
        }
        break
      }

      // ========== help ==========
      case 'help': {
        const commands = [
          ['touch <file>',      '创建空文件'],
          ['rm <file>',         '删除文件'],
          ['cat <file>',        '查看文件内容'],
          ['ls [-l] [dir]',     '列出目录内容'],
          ['mkdir <dir>',       '创建目录'],
          ['cd [dir]',          '切换目录'],
          ['pwd',               '显示当前目录'],
          ['mv <src> <dst>',    '移动/重命名文件'],
          ['cp <src> <dst>',    '复制文件'],
          ['echo "x" > file',   '写入内容到文件'],
          ['echo "x" >> file',  '追加内容到文件'],
          ['wc <file>',         '统计行/词/字符数'],
          ['head <file>',       '查看前 10 行'],
          ['tree [dir]',        '树形显示目录结构'],
          ['stat <file>',       '查看文件详细信息'],
          ['grep <pattern> [file]', '搜索文件内容'],
          ['git status',        '查看虚拟 Git 状态'],
          ['git log',           '查看虚拟提交历史'],
          ['git diff [file]',   '查看文件差异'],
          ['npm install [pkg]', '模拟安装依赖'],
          ['npm list',          '列出已安装依赖'],
          ['clear',             '清空终端'],
          ['help',              '显示帮助信息'],
        ]
        addLine('info', '🧊 YYC³ 虚拟终端可用命令:')
        commands.forEach(([cmd, desc]) => {
          addLine('output', `  ${cmd.padEnd(26)} ${desc}`)
        })
        break
      }

      // ========== grep ==========
      case 'grep': {
        if (parsed.args.length === 0) {
          addLine('error', 'grep: 缺少搜索模式')
          break
        }
        const pattern = parsed.args[0]
        const searchFiles = parsed.args.length > 1
          ? [resolvePath(cwd, parsed.args[1])]
          : vfs.files.map(f => f.path)
        let matchCount = 0
        try {
          const regex = new RegExp(pattern, parsed.flags['i'] ? 'i' : '')
          searchFiles.forEach(filePath => {
            const content = vfs.readFile(filePath)
            if (content === null) return
            content.split('\n').forEach((line, lineIdx) => {
              if (regex.test(line)) {
                matchCount++
                addLine('output', `${getFileName(filePath)}:${lineIdx + 1}: ${line.trim()}`)
              }
            })
          })
          if (matchCount === 0) {
            addLine('info', `grep: 未找到匹配 '${pattern}' 的内容`)
          } else {
            addLine('success', `找到 ${matchCount} 处匹配`)
          }
        } catch {
          addLine('error', `grep: 无效的正则表达式 '${pattern}'`)
        }
        break
      }

      // ========== git ==========
      case 'git': {
        const subCmd = parsed.args[0] || ''
        switch (subCmd) {
          case 'status': {
            const dirtyFiles = vfs.getDirtyFiles()
            const allFiles = vfs.files
            addLine('output', 'On branch main')
            addLine('output', '')
            if (dirtyFiles.length > 0) {
              addLine('output', 'Changes not staged for commit:')
              addLine('output', '  (use "git add <file>..." to update what will be committed)')
              addLine('output', '')
              dirtyFiles.forEach(f => {
                addLine('error', `\tmodified:   ${f.path}`)
              })
              addLine('output', '')
            }
            const newFiles = allFiles.filter(f => f.lastModified > Date.now() - 300000)
            if (newFiles.length > dirtyFiles.length) {
              addLine('output', 'Untracked files:')
              newFiles.filter(f => !dirtyFiles.find(d => d.path === f.path)).forEach(f => {
                addLine('info', `\t${f.path}`)
              })
              addLine('output', '')
            }
            if (dirtyFiles.length === 0 && newFiles.length === 0) {
              addLine('success', 'nothing to commit, working tree clean')
            }
            break
          }
          case 'log': {
            const commits = [
              { hash: 'a3f7c2d', msg: 'feat: 初始化项目结构', author: 'YYC³ Developer', time: '2 分钟前' },
              { hash: 'b8e1f4a', msg: 'feat: 添加核心组件', author: 'AI_ARCHITECT', time: '5 分钟前' },
              { hash: 'c9d2e5b', msg: 'chore: 配置 TypeScript', author: 'CODE_ARTISAN', time: '10 分钟前' },
              { hash: 'd0a3f6c', msg: 'init: 项目初始化', author: 'CENTRAL_PULSE', time: '15 分钟前' },
            ]
            commits.forEach(c => {
              addLine('output', `commit ${c.hash} (HEAD -> main)`)
              addLine('output', `Author: ${c.author}`)
              addLine('output', `Date:   ${c.time}`)
              addLine('output', '')
              addLine('info', `    ${c.msg}`)
              addLine('output', '')
            })
            break
          }
          case 'diff': {
            const targetFile = parsed.args[1] ? resolvePath(cwd, parsed.args[1]) : null
            const dirtyFiles = vfs.getDirtyFiles()
            const filesToDiff = targetFile
              ? dirtyFiles.filter(f => f.path === targetFile)
              : dirtyFiles
            if (filesToDiff.length === 0) {
              addLine('info', 'No changes to diff')
            } else {
              filesToDiff.forEach(f => {
                addLine('output', `diff --git a${f.path} b${f.path}`)
                addLine('output', `--- a${f.path}`)
                addLine('output', `+++ b${f.path}`)
                addLine('info', `@@ file modified (${f.content.split('\n').length} lines) @@`)
                const lines = f.content.split('\n').slice(0, 10)
                lines.forEach(l => addLine('success', `+ ${l}`))
                if (f.content.split('\n').length > 10) {
                  addLine('info', `... ${f.content.split('\n').length - 10} more lines`)
                }
              })
            }
            break
          }
          case 'add':
            addLine('success', `已暂存文件`)
            break
          case 'commit':
            addLine('success', `[main ${Math.random().toString(36).slice(2, 9)}] 虚拟提交成功`)
            break
          default:
            addLine('error', `git: '${subCmd}' 不是一个 git 命令（虚拟环境支持: status/log/diff/add/commit）`)
        }
        break
      }

      // ========== npm ==========
      case 'npm': {
        const subCmd = parsed.args[0] || ''
        switch (subCmd) {
          case 'install':
          case 'i': {
            const pkgNames = parsed.args.slice(1)
            if (pkgNames.length === 0) {
              addLine('info', 'npm install: 从 package.json 安装所有依赖...')
              addLine('output', '')
              // 读取 package.json
              const pkgJson = vfs.readFile('/package.json')
              if (pkgJson) {
                try {
                  const pkg = JSON.parse(pkgJson)
                  const deps = Object.entries(pkg.dependencies || {})
                  const devDeps = Object.entries(pkg.devDependencies || {})
                  deps.forEach(([name, ver]) => addLine('output', `  + ${name}@${ver}`))
                  devDeps.forEach(([name, ver]) => addLine('output', `  + ${name}@${ver} (dev)`))
                  addLine('success', `已安装 ${deps.length + devDeps.length} 个依赖`)
                } catch {
                  addLine('error', 'npm: package.json 解析失败')
                }
              } else {
                addLine('error', 'npm: 未找到 package.json')
              }
            } else {
              // 安装特定包 → 更新 package.json
              const pkgJsonPath = '/package.json'
              const pkgJson = vfs.readFile(pkgJsonPath) || '{"name":"project","version":"1.0.0","dependencies":{}}'
              try {
                const pkg = JSON.parse(pkgJson)
                if (!pkg.dependencies) pkg.dependencies = {}
                const isDev = parsed.flags['D'] || parsed.flags['d']
                const target = isDev ? 'devDependencies' : 'dependencies'
                if (!pkg[target]) pkg[target] = {}
                pkgNames.forEach(name => {
                  const version = `^1.0.0`
                  pkg[target][name] = version
                  addLine('output', `  + ${name}@${version}${isDev ? ' (dev)' : ''}`)
                })
                vfs.writeFile(pkgJsonPath, JSON.stringify(pkg, null, 2), 'json')
                emitChange({ type: 'write', path: pkgJsonPath })
                addLine('success', `已安装 ${pkgNames.length} 个包并更新 package.json`)
              } catch {
                addLine('error', 'npm: package.json 操作失败')
              }
            }
            break
          }
          case 'list':
          case 'ls': {
            const pkgJson = vfs.readFile('/package.json')
            if (pkgJson) {
              try {
                const pkg = JSON.parse(pkgJson)
                addLine('output', `${pkg.name || 'project'}@${pkg.version || '1.0.0'}`)
                Object.entries(pkg.dependencies || {}).forEach(([name, ver]) => {
                  addLine('output', `├── ${name}@${ver}`)
                })
                Object.entries(pkg.devDependencies || {}).forEach(([name, ver]) => {
                  addLine('output', `├── ${name}@${ver} (dev)`)
                })
              } catch {
                addLine('error', 'npm: package.json 解析失败')
              }
            } else {
              addLine('error', 'npm: 未找到 package.json')
            }
            break
          }
          case 'init': {
            const pkg = {
              name: 'yyc3-project',
              version: '1.0.0',
              type: 'module',
              scripts: { dev: 'vite', build: 'tsc && vite build' },
              dependencies: {},
              devDependencies: {},
            }
            vfs.writeFile('/package.json', JSON.stringify(pkg, null, 2), 'json')
            emitChange({ type: 'create', path: '/package.json' })
            addLine('success', '已创建 package.json')
            break
          }
          case 'run': {
            const script = parsed.args[1] || ''
            addLine('info', `> 运行脚本: ${script}`)
            addLine('output', `(虚拟环境: 脚本 "${script}" 模拟运行完成)`)
            break
          }
          default:
            addLine('error', `npm: '${subCmd}' 命令不支持（虚拟环境支持: install/list/init/run）`)
        }
        break
      }

      default:
        addLine('error', `未知命令: ${parsed.name}. 输入 help 查看可用命令`)
    }
  }, [cwd, vfs, addLine, emitChange])

  const clear = useCallback(() => {
    setLines([])
  }, [])

  return {
    lines,
    execute,
    clear,
    cwd,
    setCwd,
    history,
    lastChange,
    changeCount,
  }
}