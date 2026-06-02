/**
 * file: App.tsx
 * description: 应用根组件 · 提供路由提供者和全局配置
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-02-26
 * updated: 2026-04-04
 * status: active
 * tags: [component],[root],[router]
 *
 * brief: 应用根组件，负责路由初始化和全局配置
 *
 * details:
 * - 使用 React Router 的 RouterProvider 提供路由功能
 * - 支持哈希路由模式，兼容 Electron 和静态部署
 * - 作为整个应用的入口组件
 *
 * dependencies: react-router, routes.tsx
 * exports: App (default)
 * notes: 需要在 main.tsx 中渲染此组件
 */
import { RouterProvider } from 'react-router';
import { router } from './routes.tsx';

export default function App() {
  return <RouterProvider router={router} />;
}