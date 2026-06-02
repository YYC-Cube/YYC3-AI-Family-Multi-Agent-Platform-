/**
 * file: AppShell.tsx
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

import React from 'react';
import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { DynamicConfigProvider } from '../hooks/useDynamicConfig';

/**
 * AppShell - YYC³ AI Family 根布局容器
 * 
 * 职责：
 * - 提供全局深色主题容器
 * - 管理全局 Toast 通知系统
 * - 注入 DynamicConfigProvider（全局可编辑配置）
 * - 渲染子路由视图（通过 Outlet）
 */
export const AppShell: React.FC = () => {
  return (
    <DynamicConfigProvider>
      <div className="dark min-h-screen w-full bg-slate-950 text-slate-100">
        {/* 子路由渲染点 */}
        <Outlet />
        
        {/* 全局 Toast 通知 */}
        <Toaster 
          theme="dark" 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: 'rgba(2, 6, 23, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
            },
          }}
        />
      </div>
    </DynamicConfigProvider>
  );
};