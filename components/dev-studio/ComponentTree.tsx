/**
 * file: ComponentTree.tsx
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Component as ComponentIcon, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/components/ui/utils';

/**
 * ComponentTree - 组件树面板
 * 
 * 职责：
 * - 显示项目文件/组件结构树
 * - 支持展开/折叠目录
 * - 支持选择文件进行编辑
 * - 显示组件层级关系
 */

export interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'component';
  children?: TreeNode[];
  path: string;
}

interface ComponentTreeProps {
  onSelectNode: (node: TreeNode) => void;
  selectedNodeId: string | null;
}

// 示例树结构数据
const INITIAL_TREE: TreeNode[] = [
  {
    id: 'root',
    name: 'YYC³ Project',
    type: 'folder',
    path: '/',
    children: [
      {
        id: 'components',
        name: 'components',
        type: 'folder',
        path: '/components',
        children: [
          {
            id: 'app-tsx',
            name: 'App.tsx',
            type: 'file',
            path: '/components/App.tsx',
          },
          {
            id: 'button-tsx',
            name: 'Button.tsx',
            type: 'component',
            path: '/components/Button.tsx',
          },
          {
            id: 'card-tsx',
            name: 'Card.tsx',
            type: 'component',
            path: '/components/Card.tsx',
          },
        ],
      },
      {
        id: 'layouts',
        name: 'layouts',
        type: 'folder',
        path: '/layouts',
        children: [
          {
            id: 'chatroom-tsx',
            name: 'ChatRoomLayout.tsx',
            type: 'component',
            path: '/layouts/ChatRoomLayout.tsx',
          },
          {
            id: 'devstudio-tsx',
            name: 'DevStudioLayout.tsx',
            type: 'component',
            path: '/layouts/DevStudioLayout.tsx',
          },
        ],
      },
      {
        id: 'hooks',
        name: 'hooks',
        type: 'folder',
        path: '/hooks',
        children: [
          {
            id: 'usefamily-ts',
            name: 'useFamilySystem.ts',
            type: 'file',
            path: '/hooks/useFamilySystem.ts',
          },
        ],
      },
    ],
  },
];

export const ComponentTree: React.FC<ComponentTreeProps> = ({ onSelectNode, selectedNodeId }) => {
  const [tree] = useState<TreeNode[]>(INITIAL_TREE);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root', 'components']));

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = node.id === selectedNodeId;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        {/* Node Row */}
        <div
          onClick={() => {
            if (node.type === 'folder') {
              toggleExpand(node.id);
            } else {
              onSelectNode(node);
            }
          }}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-all text-xs font-mono group",
            isSelected
              ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500"
              : "hover:bg-white/[0.04] text-slate-400 border-l-2 border-transparent"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {/* Expand Icon */}
          {hasChildren && (
            <div className="w-3 h-3 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
          )}
          
          {/* Node Icon */}
          <div className={cn(
            "w-3.5 h-3.5 flex-none",
            isSelected ? "text-emerald-400" : "text-slate-500"
          )}>
            {node.type === 'folder' ? (
              isExpanded ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />
            ) : node.type === 'component' ? (
              <ComponentIcon className="w-3.5 h-3.5" />
            ) : (
              <File className="w-3.5 h-3.5" />
            )}
          </div>

          {/* Node Name */}
          <span className={cn(
            "flex-1 truncate",
            isSelected ? "font-semibold" : ""
          )}>
            {node.name}
          </span>

          {/* Actions (on hover) */}
          {!hasChildren && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Add action
                }}
                className="p-0.5 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300"
                title="编辑"
              >
                <ComponentIcon className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Add action
                }}
                className="p-0.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400"
                title="删除"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {node.children!.map(child => renderNode(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/50 border-r border-white/[0.04]">
      {/* Header */}
      <div className="flex-none px-3 py-2 border-b border-white/[0.04] flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">
          组件树
        </h3>
        <button
          className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
          title="新建组件"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {tree.map(node => renderNode(node))}
      </div>

      {/* Footer Stats */}
      <div className="flex-none px-3 py-1.5 border-t border-white/[0.04] text-[10px] font-mono text-slate-600">
        <span>6 文件 · 3 组件</span>
      </div>
    </div>
  );
};
