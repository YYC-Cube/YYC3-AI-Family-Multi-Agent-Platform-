/**
 * file: routes.tsx
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

import { createBrowserRouter, createMemoryRouter, type RouteObject } from "react-router";
import { AppShell } from "./layouts/AppShell";
import { ChatRoomLayout } from "./layouts/ChatRoomLayout";
import { DevStudioLayout } from "./layouts/DevStudioLayout";
import { CollaborationLayout } from "./layouts/CollaborationLayout";
import MessagesLayout from "./layouts/MessagesLayout";

/**
 * YYC³ AI Family - 路由配置
 * 四位一体工作台：AI Family 聊天室 | 智能协同平台 | 智能开发工具 | 家人私信
 */

export const routeConfig: RouteObject[] = [
  {
    path: "/",
    Component: AppShell,
    children: [
      {
        index: true,
        Component: ChatRoomLayout,
      },
      {
        path: "collab",
        Component: CollaborationLayout,
      },
      {
        path: "dev",
        Component: DevStudioLayout,
      },
      {
        path: "ai-family-messages",
        Component: MessagesLayout,
      },
      {
        path: "*",
        Component: () => (
          <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
            <div className="text-center">
              <h1 className="text-2xl font-mono mb-2">404 - NOT_FOUND</h1>
              <p className="text-sm text-slate-500 font-mono">
                Route not registered in YYC³ topology
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
];

export const routeCount = routeConfig[0].children?.length ?? 0;

const isBrowser = typeof document !== 'undefined';

export const router = isBrowser
  ? createBrowserRouter(routeConfig)
  : createMemoryRouter(routeConfig);
