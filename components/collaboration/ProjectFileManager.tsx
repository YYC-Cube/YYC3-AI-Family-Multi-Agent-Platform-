/**
 * file: ProjectFileManager.tsx
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
 * ProjectFileManager - 项目文件管理区（中栏）
 * 
 * Step 6b 升级版：
 * - 文件树形结构展示
 * - 拖拽移动文件/文件夹 (react-dnd)
 * - 右键上下文菜单（重命名、删除、复制、粘贴、新建）
 * - 完整 CRUD 操作（创建文件/文件夹、重命名、删除）
 * - 搜索过滤功能
 * 
 * 对应规格：Functional-Spec §智能AI编程模式页面 → 中栏
 * 
 * @file components/collaboration/ProjectFileManager.tsx
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDrag, useDrop } from 'react-dnd';
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Search,
  FileCode,
  FileText,
  FileJson,
  Image as ImageIcon,
  MoreHorizontal,
  FolderPlus,
  FilePlus,
  Copy,
  Clipboard,
  RefreshCw,
  X,
  Scissors,
  FolderInput,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { toast } from 'sonner';

// ==========================================
// Types
// ==========================================

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  language?: string;
  size?: number;
  modified?: number;
}

export interface ProjectFileManagerProps {
  onSelectFile?: (file: FileNode) => void;
  selectedFileId?: string | null;
  onCodeChange?: (code: string) => void;
  currentCode?: string;
  /** 外部文件树（受控模式） */
  fileTree?: FileNode[];
  /** 文件树变更回调 */
  onFileTreeChange?: (tree: FileNode[]) => void;
}

// DnD item type
const FILE_DND_TYPE = 'FILE_NODE';

interface FileDragItem {
  type: typeof FILE_DND_TYPE;
  nodeId: string;
  nodeName: string;
  nodeType: 'file' | 'folder';
}

// 右键菜单类型
interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetNode: FileNode | null;
  targetParentId: string | null;
}

// ==========================================
// Mock Data
// ==========================================

const DEFAULT_FILE_TREE: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'components',
        name: 'components',
        type: 'folder',
        children: [
          { id: 'App.tsx', name: 'App.tsx', type: 'file', language: 'tsx', size: 2048, modified: Date.now() - 3600000 },
          { id: 'Header.tsx', name: 'Header.tsx', type: 'file', language: 'tsx', size: 1536, modified: Date.now() - 7200000 },
          { id: 'Sidebar.tsx', name: 'Sidebar.tsx', type: 'file', language: 'tsx', size: 892, modified: Date.now() - 1800000 },
          {
            id: 'ui',
            name: 'ui',
            type: 'folder',
            children: [
              { id: 'Button.tsx', name: 'Button.tsx', type: 'file', language: 'tsx', size: 456 },
              { id: 'Input.tsx', name: 'Input.tsx', type: 'file', language: 'tsx', size: 512 },
              { id: 'Card.tsx', name: 'Card.tsx', type: 'file', language: 'tsx', size: 678 },
            ],
          },
        ],
      },
      {
        id: 'hooks',
        name: 'hooks',
        type: 'folder',
        children: [
          { id: 'useAuth.ts', name: 'useAuth.ts', type: 'file', language: 'ts', size: 1024 },
          { id: 'useTheme.ts', name: 'useTheme.ts', type: 'file', language: 'ts', size: 768 },
        ],
      },
      {
        id: 'types',
        name: 'types',
        type: 'folder',
        children: [
          { id: 'index.ts', name: 'index.ts', type: 'file', language: 'ts', size: 2048 },
        ],
      },
      { id: 'main.tsx', name: 'main.tsx', type: 'file', language: 'tsx', size: 312 },
    ],
  },
  { id: 'package.json', name: 'package.json', type: 'file', language: 'json', size: 1456 },
  { id: 'tsconfig.json', name: 'tsconfig.json', type: 'file', language: 'json', size: 542 },
  { id: 'README.md', name: 'README.md', type: 'file', language: 'md', size: 3200 },
];

// ==========================================
// Tree Utility Functions
// ==========================================

/** Deep clone tree */
function cloneTree(nodes: FileNode[]): FileNode[] {
  return JSON.parse(JSON.stringify(nodes));
}

/** Find node by ID in tree */
function findNodeInTree(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeInTree(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Find parent of node */
function findParentInTree(nodes: FileNode[], id: string): { parent: FileNode[] | null; parentId: string | null; index: number } {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      return { parent: nodes, parentId: null, index: i };
    }
    if (nodes[i].children) {
      for (let j = 0; j < nodes[i].children!.length; j++) {
        if (nodes[i].children![j].id === id) {
          return { parent: nodes[i].children!, parentId: nodes[i].id, index: j };
        }
        const found = findParentInTree(nodes[i].children!, id);
        if (found.parent !== null) return found;
      }
    }
  }
  return { parent: null, parentId: null, index: -1 };
}

/** Remove node from tree (returns new tree) */
function removeFromTree(nodes: FileNode[], id: string): FileNode[] {
  return nodes
    .filter(n => n.id !== id)
    .map(n => n.children
      ? { ...n, children: removeFromTree(n.children, id) }
      : n
    );
}

/** Insert node into a folder */
function insertIntoFolder(nodes: FileNode[], folderId: string, newNode: FileNode): FileNode[] {
  return nodes.map(n => {
    if (n.id === folderId && n.type === 'folder') {
      return { ...n, children: [...(n.children || []), newNode] };
    }
    if (n.children) {
      return { ...n, children: insertIntoFolder(n.children, folderId, newNode) };
    }
    return n;
  });
}

/** Rename node */
function renameInTree(nodes: FileNode[], id: string, newName: string): FileNode[] {
  return nodes.map(n => {
    if (n.id === id) {
      return { ...n, name: newName, id: newName }; // Update ID to match name
    }
    if (n.children) {
      return { ...n, children: renameInTree(n.children, id, newName) };
    }
    return n;
  });
}

// ==========================================
// Helpers
// ==========================================

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'ts':
    case 'jsx':
    case 'js':
      return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
    case 'json':
      return <FileJson className="w-3.5 h-3.5 text-yellow-400" />;
    case 'md':
      return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    case 'png':
    case 'jpg':
    case 'svg':
      return <ImageIcon className="w-3.5 h-3.5 text-pink-400" />;
    default:
      return <File className="w-3.5 h-3.5 text-slate-500" />;
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function generateId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ==========================================
// Sub-Components
// ==========================================

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  editingId: string | null;
  editingName: string;
  onSelect: (node: FileNode) => void;
  onToggleExpand: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode, parentId: string | null) => void;
  onEditNameChange: (name: string) => void;
  onEditNameSubmit: () => void;
  onEditNameCancel: () => void;
  onDragDrop: (sourceId: string, targetFolderId: string) => void;
}

function FileTreeNode({
  node,
  depth,
  selectedId,
  expandedIds,
  editingId,
  editingName,
  onSelect,
  onToggleExpand,
  onContextMenu,
  onEditNameChange,
  onEditNameSubmit,
  onEditNameCancel,
  onDragDrop,
}: FileTreeNodeProps) {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const isFolder = node.type === 'folder';
  const isEditing = editingId === node.id;
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // DnD - Drag source
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: FILE_DND_TYPE,
    item: { type: FILE_DND_TYPE, nodeId: node.id, nodeName: node.name, nodeType: node.type } as FileDragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [node.id, node.name, node.type]);

  // DnD - Drop target (only folders)
  const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
    accept: FILE_DND_TYPE,
    canDrop: (item: FileDragItem) => {
      // Can't drop onto itself or non-folders
      return isFolder && item.nodeId !== node.id;
    },
    drop: (item: FileDragItem) => {
      onDragDrop(item.nodeId, node.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  }), [node.id, isFolder, onDragDrop]);

  // Combine refs
  const combinedRef = useCallback(
    (el: HTMLDivElement | null) => {
      dragRef(el);
      if (isFolder) dropRef(el);
    },
    [dragRef, dropRef, isFolder]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onEditNameSubmit();
    } else if (e.key === 'Escape') {
      onEditNameCancel();
    }
  }, [onEditNameSubmit, onEditNameCancel]);

  return (
    <div>
      <div
        ref={combinedRef}
        onContextMenu={(e) => {
          e.preventDefault();
          const parentInfo = findParentInTree([], node.id); // parent handled by container
          onContextMenu(e, node, null);
        }}
        className={cn(
          "transition-all",
          isDragging && "opacity-40",
          isOver && canDrop && "bg-emerald-500/10 outline outline-1 outline-emerald-500/30 rounded-sm",
        )}
      >
        <button
          onClick={() => {
            if (isEditing) return;
            if (isFolder) {
              onToggleExpand(node.id);
            } else {
              onSelect(node);
            }
          }}
          className={cn(
            "w-full flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono transition-all rounded-sm",
            isSelected
              ? "bg-emerald-500/10 text-emerald-300"
              : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isFolder ? (
            <>
              <ChevronRight className={cn(
                "w-3 h-3 transition-transform flex-none",
                isExpanded && "rotate-90"
              )} />
              {isExpanded
                ? <FolderOpen className="w-3.5 h-3.5 text-amber-400 flex-none" />
                : <Folder className="w-3.5 h-3.5 text-amber-400/70 flex-none" />
              }
            </>
          ) : (
            <>
              <span className="w-3 flex-none" />
              {getFileIcon(node.name)}
            </>
          )}

          {isEditing ? (
            <input
              ref={inputRef}
              value={editingName}
              onChange={(e) => onEditNameChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={onEditNameSubmit}
              className="flex-1 bg-black/40 border border-emerald-500/30 rounded px-1 py-0.5 text-[11px] text-emerald-300 font-mono focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{node.name}</span>
          )}

          {!isFolder && !isEditing && node.size && (
            <span className="ml-auto text-[9px] text-slate-600 flex-none">{formatFileSize(node.size)}</span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isFolder && isExpanded && node.children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            {node.children.map(child => (
              <FileTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedId={selectedId}
                expandedIds={expandedIds}
                editingId={editingId}
                editingName={editingName}
                onSelect={onSelect}
                onToggleExpand={onToggleExpand}
                onContextMenu={onContextMenu}
                onEditNameChange={onEditNameChange}
                onEditNameSubmit={onEditNameSubmit}
                onEditNameCancel={onEditNameCancel}
                onDragDrop={onDragDrop}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// Context Menu Component
// ==========================================

interface ContextMenuProps {
  state: ContextMenuState;
  onAction: (action: string) => void;
  onClose: () => void;
}

function ContextMenu({ state, onAction, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!state.visible) return null;

  const isFolder = state.targetNode?.type === 'folder';

  const menuItems = [
    ...(isFolder ? [
      { id: 'new-file', label: '新建文件', icon: FilePlus, shortcut: '⌘N' },
      { id: 'new-folder', label: '新建文件夹', icon: FolderPlus, shortcut: '⌘⇧N' },
      { id: 'divider-1', label: '', icon: null },
    ] : []),
    { id: 'rename', label: '重命名', icon: Edit3, shortcut: 'F2' },
    { id: 'copy', label: '复制', icon: Copy, shortcut: '⌘C' },
    { id: 'cut', label: '剪切', icon: Scissors, shortcut: '⌘X' },
    ...(isFolder ? [
      { id: 'paste', label: '粘贴', icon: Clipboard, shortcut: '⌘V' },
    ] : []),
    { id: 'divider-2', label: '', icon: null },
    { id: 'delete', label: '删除', icon: Trash2, shortcut: 'Del', danger: true },
  ];

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      transition={{ duration: 0.1 }}
      className="fixed z-[100] min-w-[180px] bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-lg shadow-2xl shadow-black/50 py-1"
      style={{ left: state.x, top: state.y }}
    >
      {menuItems.map((item) => {
        if (item.id.startsWith('divider')) {
          return <div key={item.id} className="h-px bg-white/[0.06] my-1 mx-2" />;
        }
        const Icon = item.icon!;
        const isDanger = (item as any).danger;
        return (
          <button
            key={item.id}
            onClick={() => {
              onAction(item.id);
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono transition-all",
              isDanger
                ? "text-red-400 hover:bg-red-500/10"
                : "text-slate-300 hover:bg-white/[0.05]"
            )}
          >
            <Icon className="w-3.5 h-3.5 flex-none" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && (
              <span className="text-[9px] text-slate-600">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </motion.div>
  );
}

// ==========================================
// Main Component
// ==========================================

export function ProjectFileManager({
  onSelectFile,
  selectedFileId = null,
  onCodeChange,
  currentCode,
  fileTree: externalTree,
  onFileTreeChange,
}: ProjectFileManagerProps) {
  const [internalTree, setInternalTree] = useState<FileNode[]>(DEFAULT_FILE_TREE);
  const fileTree = externalTree || internalTree;
  const setFileTree = useCallback((updater: FileNode[] | ((prev: FileNode[]) => FileNode[])) => {
    const newTree = typeof updater === 'function' ? updater(fileTree) : updater;
    setInternalTree(newTree);
    onFileTreeChange?.(newTree);
  }, [fileTree, onFileTreeChange]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['src', 'components']));
  const [selectedId, setSelectedId] = useState<string | null>(selectedFileId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // CRUD state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [clipboard, setClipboard] = useState<{ node: FileNode; action: 'copy' | 'cut' } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, targetNode: null, targetParentId: null,
  });

  // ---- Expand/Collapse ----
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ---- Select ----
  const handleSelectFile = useCallback((node: FileNode) => {
    setSelectedId(node.id);
    onSelectFile?.(node);
  }, [onSelectFile]);

  // ---- Context Menu ----
  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode, parentId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 250),
      targetNode: node,
      targetParentId: parentId,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // ---- CRUD Operations ----

  // Create new file
  const createFile = useCallback((parentFolderId: string | null, type: 'file' | 'folder') => {
    const newName = type === 'file' ? 'untitled.tsx' : 'new-folder';
    const newNode: FileNode = {
      id: generateId(),
      name: newName,
      type,
      ...(type === 'folder' ? { children: [] } : { language: 'tsx', size: 0, modified: Date.now() }),
    };

    if (parentFolderId) {
      setFileTree((prev: FileNode[]) => insertIntoFolder(cloneTree(prev), parentFolderId, newNode));
      // Expand parent
      setExpandedIds(prev => new Set([...prev, parentFolderId]));
    } else {
      setFileTree((prev: FileNode[]) => [...cloneTree(prev), newNode]);
    }

    // Start editing the name
    setEditingId(newNode.id);
    setEditingName(newName);
    toast.success(`${type === 'file' ? '文件' : '文件夹'}已创建`);
  }, [setFileTree]);

  // Rename
  const startRename = useCallback((node: FileNode) => {
    setEditingId(node.id);
    setEditingName(node.name);
  }, []);

  const submitRename = useCallback(() => {
    if (!editingId || !editingName.trim()) {
      setEditingId(null);
      return;
    }
    setFileTree((prev: FileNode[]) => renameInTree(cloneTree(prev), editingId, editingName.trim()));
    if (selectedId === editingId) {
      setSelectedId(editingName.trim());
    }
    toast.success(`已重命名为 ${editingName.trim()}`);
    setEditingId(null);
  }, [editingId, editingName, selectedId, setFileTree]);

  const cancelRename = useCallback(() => {
    setEditingId(null);
  }, []);

  // Delete
  const deleteNode = useCallback((nodeId: string) => {
    const node = findNodeInTree(fileTree, nodeId);
    if (!node) return;
    setFileTree((prev: FileNode[]) => removeFromTree(cloneTree(prev), nodeId));
    if (selectedId === nodeId) setSelectedId(null);
    toast.success(`已删除 ${node.name}`);
  }, [fileTree, selectedId, setFileTree]);

  // Copy / Cut
  const copyNode = useCallback((node: FileNode, action: 'copy' | 'cut') => {
    setClipboard({ node: JSON.parse(JSON.stringify(node)), action });
    toast.info(`已${action === 'copy' ? '复制' : '剪切'} ${node.name}`);
  }, []);

  // Paste
  const pasteNode = useCallback((targetFolderId: string) => {
    if (!clipboard) return;

    const pastedNode: FileNode = {
      ...clipboard.node,
      id: clipboard.action === 'copy' ? generateId() : clipboard.node.id,
      name: clipboard.action === 'copy' ? `${clipboard.node.name} 副本` : clipboard.node.name,
    };

    let newTree = cloneTree(fileTree);
    if (clipboard.action === 'cut') {
      newTree = removeFromTree(newTree, clipboard.node.id);
    }
    newTree = insertIntoFolder(newTree, targetFolderId, pastedNode);
    setFileTree(newTree);
    setExpandedIds(prev => new Set([...prev, targetFolderId]));

    if (clipboard.action === 'cut') setClipboard(null);
    toast.success(`已粘贴 ${pastedNode.name}`);
  }, [clipboard, fileTree, setFileTree]);

  // Drag & Drop - Move file to folder
  const handleDragDrop = useCallback((sourceId: string, targetFolderId: string) => {
    const sourceNode = findNodeInTree(fileTree, sourceId);
    if (!sourceNode) return;

    let newTree = removeFromTree(cloneTree(fileTree), sourceId);
    newTree = insertIntoFolder(newTree, targetFolderId, sourceNode);
    setFileTree(newTree);
    setExpandedIds(prev => new Set([...prev, targetFolderId]));
    toast.success(`已移动 ${sourceNode.name}`);
  }, [fileTree, setFileTree]);

  // ---- Context Menu Action Handler ----
  const handleContextAction = useCallback((action: string) => {
    const target = contextMenu.targetNode;
    if (!target) return;

    switch (action) {
      case 'new-file':
        createFile(target.type === 'folder' ? target.id : contextMenu.targetParentId, 'file');
        break;
      case 'new-folder':
        createFile(target.type === 'folder' ? target.id : contextMenu.targetParentId, 'folder');
        break;
      case 'rename':
        startRename(target);
        break;
      case 'copy':
        copyNode(target, 'copy');
        break;
      case 'cut':
        copyNode(target, 'cut');
        break;
      case 'paste':
        if (target.type === 'folder') pasteNode(target.id);
        break;
      case 'delete':
        deleteNode(target.id);
        break;
    }
  }, [contextMenu, createFile, startRename, copyNode, pasteNode, deleteNode]);

  // ---- Keyboard Shortcuts ----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 = Rename
      if (e.key === 'F2' && selectedId) {
        e.preventDefault();
        const node = findNodeInTree(fileTree, selectedId);
        if (node) startRename(node);
      }
      // Delete = Delete
      if (e.key === 'Delete' && selectedId && !editingId) {
        e.preventDefault();
        deleteNode(selectedId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, fileTree, startRename, deleteNode, editingId]);

  // Filter file tree by search
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return fileTree;

    const filter = (nodes: FileNode[]): FileNode[] => {
      return nodes.reduce<FileNode[]>((acc, node) => {
        if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          acc.push(node);
        } else if (node.children) {
          const filtered = filter(node.children);
          if (filtered.length > 0) {
            acc.push({ ...node, children: filtered });
          }
        }
        return acc;
      }, []);
    };

    return filter(fileTree);
  }, [searchQuery, fileTree]);

  // Root-level context menu (right-click on empty area)
  const handleRootContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 250),
      targetNode: { id: '__root__', name: 'root', type: 'folder', children: fileTree },
      targetParentId: null,
    });
  }, [fileTree]);

  return (
    <div
      className="flex flex-col h-full bg-slate-950/30"
      onContextMenu={handleRootContextMenu}
    >
      {/* Tab Header */}
      <div className="flex-none flex items-center justify-between px-2 py-1.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-slate-300 px-1.5">文件管理器</span>
          {clipboard && (
            <span className="text-[9px] font-mono text-amber-400 px-1 py-0.5 bg-amber-500/10 rounded">
              📋 {clipboard.action === 'copy' ? '已复制' : '已剪切'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={cn(
              "p-1 rounded hover:bg-white/5 transition-colors",
              showSearch ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => createFile(null, 'file')}
            className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
            title="新建文件"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => createFile(null, 'folder')}
            className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
            title="新建文件夹"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
            title="刷新"
            onClick={() => toast.info('文件树已刷新')}
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-none px-2 py-1.5 border-b border-white/[0.04] overflow-hidden"
          >
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文件..."
                className="w-full bg-black/30 border border-white/[0.06] rounded-md pl-7 pr-7 py-1.5 text-[11px] text-slate-300 placeholder-slate-600 font-mono focus:outline-none focus:border-emerald-500/30"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {filteredTree.map(node => (
          <FileTreeNode
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            expandedIds={expandedIds}
            editingId={editingId}
            editingName={editingName}
            onSelect={handleSelectFile}
            onToggleExpand={handleToggleExpand}
            onContextMenu={handleContextMenu}
            onEditNameChange={setEditingName}
            onEditNameSubmit={submitRename}
            onEditNameCancel={cancelRename}
            onDragDrop={handleDragDrop}
          />
        ))}
        {filteredTree.length === 0 && searchQuery && (
          <div className="px-4 py-8 text-center">
            <Search className="w-6 h-6 text-slate-700 mx-auto mb-2" />
            <p className="text-[11px] text-slate-600 font-mono">未找到匹配 &quot;{searchQuery}&quot; 的文件</p>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex-none flex items-center justify-between px-3 py-1 border-t border-white/[0.06] bg-black/20 text-[9px] font-mono text-slate-600">
        <div className="flex items-center gap-3">
          <span>{selectedId ? `📄 ${selectedId}` : '未选择文件'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{fileTree.length} 项</span>
          <span>拖拽移动</span>
        </div>
      </div>

      {/* Context Menu Portal */}
      <AnimatePresence>
        {contextMenu.visible && (
          <ContextMenu
            state={contextMenu}
            onAction={handleContextAction}
            onClose={closeContextMenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
