/**
 * file: useFileSync.ts
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
 * useFileSync - VFS ↔ 后端文件系统同步 Hook
 * 
 * 职责：
 * - 将 useVirtualFileSystem 中的文件变更同步到后端 REST API
 * - 从后端加载项目文件到 VFS
 * - 批量同步（保存全部）
 * - 离线缓冲 + 重试机制
 * - 同步状态追踪（syncing / synced / error）
 * 
 * Step 8a: VFS ↔ 后端文件系统同步
 * 
 * @file hooks/useFileSync.ts
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { VirtualFile, UseVirtualFileSystemReturn } from './useVirtualFileSystem'
import { ENDPOINTS } from '../config/endpoints'

// ==========================================
// Types
// ==========================================

export type FileSyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

export interface SyncResult {
  success: boolean
  path: string
  error?: string
  serverVersion?: number
  timestamp: number
}

export interface FileSyncState {
  /** 总体同步状态 */
  status: FileSyncStatus
  /** 待同步文件数量 */
  pendingCount: number
  /** 最后同步时间 */
  lastSyncTime: number | null
  /** 最近同步结果 */
  lastResults: SyncResult[]
  /** 错误信息 */
  lastError: string | null
}

export interface FileSyncConfig {
  /** 后端 API 基地址 */
  apiBase?: string
  /** 项目 ID */
  projectId?: string
  /** 自动同步间隔 (ms)，0 禁用 */
  autoSyncInterval?: number
  /** 保存时自动同步 */
  syncOnSave?: boolean
  /** 最大重试次数 */
  maxRetries?: number
}

export interface UseFileSyncReturn {
  /** 同步状态 */
  syncState: FileSyncState
  /** 从后端加载项目文件列表 */
  loadProject: () => Promise<ProjectFileList | null>
  /** 从后端读取单个文件内容 */
  fetchFile: (path: string) => Promise<string | null>
  /** 将单个文件推送到后端 */
  pushFile: (file: VirtualFile) => Promise<SyncResult>
  /** 批量推送所有脏文件 */
  pushDirtyFiles: (vfs: UseVirtualFileSystemReturn) => Promise<SyncResult[]>
  /** 删除后端文件 */
  deleteRemoteFile: (path: string) => Promise<SyncResult>
  /** 全量拉取项目文件到 VFS */
  pullProject: (vfs: UseVirtualFileSystemReturn) => Promise<number>
  /** 重置同步状态 */
  resetSync: () => void
  /** 后端是否可用 */
  isBackendAvailable: boolean
}

export interface ProjectFileList {
  projectId: string
  files: Array<{
    path: string
    language: string
    size: number
    lastModified: number
  }>
  totalSize: number
}

export interface RemoteFileContent {
  path: string
  content: string
  language: string
  version: number
  lastModified: number
}

// ==========================================
// REST API 封装
// ==========================================

class FileSystemAPI {
  private baseUrl: string
  private projectId: string

  constructor(baseUrl: string, projectId: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.projectId = projectId
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<{ ok: boolean; data?: T; error?: string }> {
    try {
      const url = `${this.baseUrl}${path}`
      const opts: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      }
      if (body) opts.body = JSON.stringify(body)

      const res = await fetch(url, opts)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        return { ok: false, error: err.error || `HTTP ${res.status}` }
      }
      const data = await res.json()
      return { ok: true, data }
    } catch (err: any) {
      return { ok: false, error: err.message || 'Network error' }
    }
  }

  async listFiles(): Promise<{ ok: boolean; data?: ProjectFileList; error?: string }> {
    return this.request<ProjectFileList>('GET', `/api/files/list?projectId=${this.projectId}`)
  }

  async readFile(filePath: string): Promise<{ ok: boolean; data?: RemoteFileContent; error?: string }> {
    return this.request<RemoteFileContent>(
      'POST', '/api/files/read',
      { projectId: this.projectId, path: filePath }
    )
  }

  async writeFile(
    filePath: string,
    content: string,
    language: string
  ): Promise<{ ok: boolean; data?: { version: number }; error?: string }> {
    return this.request<{ version: number }>(
      'POST', '/api/files/write',
      { projectId: this.projectId, path: filePath, content, language }
    )
  }

  async deleteFile(filePath: string): Promise<{ ok: boolean; error?: string }> {
    return this.request('POST', '/api/files/delete', {
      projectId: this.projectId, path: filePath,
    })
  }
}

// ==========================================
// Mock 后端（后端不可用时的本地模拟）
// ==========================================

class MockFileSystemAPI {
  private storage: Map<string, RemoteFileContent> = new Map()

  async listFiles(projectId: string): Promise<ProjectFileList> {
    const files = Array.from(this.storage.values()).map(f => ({
      path: f.path,
      language: f.language,
      size: f.content.length,
      lastModified: f.lastModified,
    }))
    return { projectId, files, totalSize: files.reduce((s, f) => s + f.size, 0) }
  }

  async readFile(path: string): Promise<RemoteFileContent | null> {
    return this.storage.get(path) || null
  }

  async writeFile(path: string, content: string, language: string): Promise<number> {
    const version = (this.storage.get(path)?.version || 0) + 1
    this.storage.set(path, { path, content, language, version, lastModified: Date.now() })
    return version
  }

  async deleteFile(path: string): Promise<boolean> {
    return this.storage.delete(path)
  }
}

// ==========================================
// Hook 实现
// ==========================================

export function useFileSync(config?: FileSyncConfig): UseFileSyncReturn {
  const {
    apiBase = ENDPOINTS.API_BASE,
    projectId = 'default-project',
    autoSyncInterval = 0,
    syncOnSave = true,
    maxRetries = 3,
  } = config || {}

  const apiRef = useRef(new FileSystemAPI(apiBase, projectId))
  const mockApiRef = useRef(new MockFileSystemAPI())
  const retryCountRef = useRef<Map<string, number>>(new Map())

  const [syncState, setSyncState] = useState<FileSyncState>({
    status: 'idle',
    pendingCount: 0,
    lastSyncTime: null,
    lastResults: [],
    lastError: null,
  })

  const [isBackendAvailable, setIsBackendAvailable] = useState(false)

  // 检测后端可用性
  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const res = await fetch(`${apiBase}/api/health`, { signal: AbortSignal.timeout(3000) })
        if (!cancelled) setIsBackendAvailable(res.ok)
      } catch {
        if (!cancelled) setIsBackendAvailable(false)
      }
    }
    check()
    const interval = setInterval(check, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [apiBase])

  // 从后端加载项目文件列表
  const loadProject = useCallback(async (): Promise<ProjectFileList | null> => {
    setSyncState(prev => ({ ...prev, status: 'syncing' }))

    if (isBackendAvailable) {
      const res = await apiRef.current.listFiles()
      if (res.ok && res.data) {
        setSyncState(prev => ({
          ...prev, status: 'synced', lastSyncTime: Date.now(), lastError: null,
        }))
        return res.data
      }
    }

    // Mock fallback
    const mockList = await mockApiRef.current.listFiles(projectId)
    setSyncState(prev => ({
      ...prev, status: 'offline', lastSyncTime: Date.now(), lastError: null,
    }))
    return mockList
  }, [isBackendAvailable, projectId])

  // 读取单文件
  const fetchFile = useCallback(async (path: string): Promise<string | null> => {
    if (isBackendAvailable) {
      const res = await apiRef.current.readFile(path)
      return res.ok && res.data ? res.data.content : null
    }
    const mock = await mockApiRef.current.readFile(path)
    return mock?.content || null
  }, [isBackendAvailable])

  // 推送单文件
  const pushFile = useCallback(async (file: VirtualFile): Promise<SyncResult> => {
    const startTime = Date.now()

    if (isBackendAvailable) {
      const res = await apiRef.current.writeFile(file.path, file.content, file.language)
      if (res.ok) {
        retryCountRef.current.delete(file.path)
        return {
          success: true, path: file.path,
          serverVersion: res.data?.version, timestamp: Date.now(),
        }
      }

      // 重试逻辑
      const retries = retryCountRef.current.get(file.path) || 0
      if (retries < maxRetries) {
        retryCountRef.current.set(file.path, retries + 1)
        return pushFile(file) // 递归重试
      }

      return {
        success: false, path: file.path,
        error: res.error || 'Write failed', timestamp: Date.now(),
      }
    }

    // Mock 写入
    const version = await mockApiRef.current.writeFile(file.path, file.content, file.language)
    return {
      success: true, path: file.path,
      serverVersion: version, timestamp: Date.now(),
    }
  }, [isBackendAvailable, maxRetries])

  // 批量推送脏文件
  const pushDirtyFiles = useCallback(async (vfs: UseVirtualFileSystemReturn): Promise<SyncResult[]> => {
    const dirtyFiles = vfs.getDirtyFiles()
    if (dirtyFiles.length === 0) return []

    setSyncState(prev => ({
      ...prev, status: 'syncing', pendingCount: dirtyFiles.length,
    }))

    const results: SyncResult[] = []
    for (const file of dirtyFiles) {
      const result = await pushFile(file)
      results.push(result)
      if (result.success) {
        vfs.markSaved(file.path)
      }
    }

    const hasErrors = results.some(r => !r.success)
    setSyncState(prev => ({
      ...prev,
      status: hasErrors ? 'error' : (isBackendAvailable ? 'synced' : 'offline'),
      pendingCount: 0,
      lastSyncTime: Date.now(),
      lastResults: results,
      lastError: hasErrors ? results.find(r => !r.success)?.error || null : null,
    }))

    return results
  }, [pushFile, isBackendAvailable])

  // 删除后端文件
  const deleteRemoteFile = useCallback(async (path: string): Promise<SyncResult> => {
    if (isBackendAvailable) {
      const res = await apiRef.current.deleteFile(path)
      return { success: res.ok, path, error: res.error, timestamp: Date.now() }
    }
    const ok = await mockApiRef.current.deleteFile(path)
    return { success: ok, path, timestamp: Date.now() }
  }, [isBackendAvailable])

  // 全量拉取项目到 VFS
  const pullProject = useCallback(async (vfs: UseVirtualFileSystemReturn): Promise<number> => {
    const fileList = await loadProject()
    if (!fileList) return 0

    let loaded = 0
    for (const file of fileList.files) {
      const content = await fetchFile(file.path)
      if (content !== null) {
        vfs.writeFile(file.path, content, file.language)
        vfs.markSaved(file.path)
        loaded++
      }
    }

    return loaded
  }, [loadProject, fetchFile])

  // 重置
  const resetSync = useCallback(() => {
    retryCountRef.current.clear()
    setSyncState({
      status: 'idle', pendingCount: 0,
      lastSyncTime: null, lastResults: [], lastError: null,
    })
  }, [])

  return {
    syncState,
    loadProject,
    fetchFile,
    pushFile,
    pushDirtyFiles,
    deleteRemoteFile,
    pullProject,
    resetSync,
    isBackendAvailable,
  }
}