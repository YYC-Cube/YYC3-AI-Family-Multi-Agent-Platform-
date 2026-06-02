# YYC³ AI Family - 路由架构指南

> **本文档是 Guidelines.md 的补充章节，详细描述路由架构设计**

---

## SECTION 2.5: 路由架构 (Routing Architecture)

### 2.5.1 架构概览

YYC³ AI Family v2.0 采用 **React Router v7 Data Mode** 实现多模态工作台架构。

```
/App.tsx (Entry Point)
  └── <RouterProvider router={router} />
        └── /routes.ts (Route Configuration)
              └── <AppShell /> (Root Layout)
                    ├── / (index) → <ChatRoomLayout />        AI Family 聊天室
                    ├── /collab    → <CollaborationLayout />  智能协同平台 (未来)
                    ├── /dev       → <DevStudioLayout />      智能开发工具 (未来)
                    └── /*         → 404 NotFound
```

### 2.5.2 三位一体工作台 (Trinity Workspace)

| 模式 | 路径 | 组件 | 状态 | 职责 |
|------|------|------|------|------|
| **AI Family 聊天室** | `/` | `ChatRoomLayout` | ✅ 已完成 | 家族成员协同对话，信号交换枢纽 |
| **智能协同平台** | `/collab` | `CollaborationLayout` | 🔜 计划中 | 任务看板，多智能体编排，工作流可视化 |
| **智能开发工具** | `/dev` | `DevStudioLayout` | 🔜 计划中 | 低码开发，实时预览，AI 代码助手 |

### 2.5.3 文件结构

```
YYC³ AI Family/
├── App.tsx                      ← Entry: RouterProvider
├── routes.ts                    ← Route config (createBrowserRouter)
├── layouts/                     ← Layout components (exported)
│   ├── AppShell.tsx            ← Root layout: dark theme + Toaster + Outlet
│   ├── ChatRoomLayout.tsx      ← AI Family 聊天室布局
│   ├── CollaborationLayout.tsx ← 智能协同平台布局 (未来)
│   └── DevStudioLayout.tsx     ← 智能开发工具布局 (未来)
├── components/family/*          ← Shared dashboard components (14 files)
├── hooks/*                      ← Shared hooks (10 files)
└── types/*                      ← Type definitions (10 files)
```

### 2.5.4 核心组件详解

#### `/routes.ts` - 路由配置

```typescript
import { createBrowserRouter } from "react-router";
import { AppShell } from "./layouts/AppShell";
import { ChatRoomLayout } from "./layouts/ChatRoomLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, Component: ChatRoomLayout },
      // 未来扩展：
      // { path: "collab", Component: CollaborationLayout },
      // { path: "dev", Component: DevStudioLayout },
      { path: "*", Component: NotFound },
    ],
  },
]);
```

**关键特性**:
- ✅ React Router v7 Data Mode
- ✅ 嵌套路由（AppShell → 子视图）
- ✅ 404 处理
- ✅ TypeScript 类型安全

#### `/layouts/AppShell.tsx` - 根布局

```typescript
import { Outlet } from 'react-router';
import { Toaster } from 'sonner';

export const AppShell: React.FC = () => {
  return (
    <div className="dark min-h-screen w-full bg-slate-950 text-slate-100">
      <Outlet />  {/* 子路由渲染点 */}
      <Toaster theme="dark" position="bottom-right" {...} />
    </div>
  );
};
```

**职责**:
- 全局深色主题容器
- Toast 通知系统
- 子路由渲染入口（`<Outlet />`）

#### `/layouts/ChatRoomLayout.tsx` - 聊天室布局

**迁移来源**: `/components/family/FamilyDashboard.tsx`  
**功能对等**: 100% 保持原有功能  

**核心区域**:
1. **Header** (顶部栏)
   - YYC³ Mission Control 标题
   - 连接状态指示器（CONNECTED/MOCK/CONNECTING）
   - BRIDGE 按钮（后端配置）
   - PULSE 指示器
   - **TOOLS 下拉菜单**（集成 8 个工具入口）

2. **Communication Area** (通讯区域)
   - 消息列表（`CommunicationLog`）
   - 空状态提示（首次使用引导）
   - 协议监视器（调试模式）

3. **Bottom Bar** (底部栏)
   - **Avatar Rail** (头像栏) - 左侧可折叠竖向 rail
     - 折叠态：56px，仅显示头像
     - 展开态：200px，显示名称+活动+状态
   - **Command Console** (输入控制台) - 右侧占据剩余空间
     - 目标成员选择
     - 命令输入框
     - 发送按钮

**Hook 集成**:
```typescript
const { members, uiMessages, dispatchSignal, ... } = useFamilySystem();
const { status, connect, disconnect, config } = useBackendConnection();
const panelManager = usePanelManager();
```

### 2.5.5 导航机制

#### 程序式导航

```typescript
import { useNavigate } from 'react-router';

const navigate = useNavigate();

// 导航到聊天室
navigate('/');

// 导航到协同平台（未来）
navigate('/collab');

// 导航到开发工具（未来）
navigate('/dev');
```

#### 声明式导航

```typescript
import { Link } from 'react-router';

<Link to="/collab" className="...">
  智能协同平台
</Link>
```

### 2.5.6 状态管理策略

#### 全局状态 (跨视图共享)

通过 Hooks 注入，所有视图共享：

- `useFamilySystem` - 家族系统状态
- `useBackendConnection` - 后端连接状态
- `usePanelManager` - 面板管理器（P2 重构成果）

#### 本地状态 (视图独有)

在各 Layout 组件内部管理：

```typescript
// ChatRoomLayout.tsx
const [selectedMemberId, setSelectedMemberId] = useState<RoleId | null>(null);
const [avatarBarExpanded, setAvatarBarExpanded] = useState(false);
const [showDebug, setShowDebug] = useState(false);
```

#### 持久化状态

使用 `localStorage` 存储：

```typescript
// 示例：保存头像栏展开状态
useEffect(() => {
  localStorage.setItem('avatarBarExpanded', String(avatarBarExpanded));
}, [avatarBarExpanded]);
```

### 2.5.7 未来扩展点

#### 智能协同平台 (`/collab`)

**布局设计**:
```
┌─────────────────────────────────────────────┐
│  Header (协同平台标题 + 工具栏)              │
├──────────────────┬──────────────────────────┤
│                  │                          │
│   任务看板       │   多智能体协作视图        │
│   (Kanban)       │   (Agent Collaboration)  │
│                  │                          │
├──────────────────┴──────────────────────────┤
│  工作流可视化 (Workflow Pipeline)            │
└─────────────────────────────────────────────┘
```

**技术栈**:
- `react-dnd` - 拖拽交互
- `recharts` - 数据可视化
- WebSocket 实时通信

**核心功能**:
- 任务卡片拖拽排序
- 多智能体实时协作状态
- 工作流编排可视化
- 创生七步曲进度追踪

#### 智能开发工具 (`/dev`)

**布局设计**:
```
┌──────────────────────────────────────────────┐
│  Header (项目名 + 工具栏)                     │
├────────────┬────────────────────┬────────────┤
│            │                    │            │
│  组件树    │   代码编辑器       │  实时预览  │
│  (左)      │   (中)             │  (右)      │
│            │                    │            │
├────────────┴────────────────────┴────────────┤
│  AI 助手面板 (可折叠，BigModel SDK 驱动)     │
└──────────────────────────────────────────────┘
```

**技术栈**:
- `re-resizable` - 可调整大小面板
- `monaco-editor` (可选) - 代码编辑器
- BigModel SDK - AI 代码生成
- Motion (`motion/react`) - 动画效果

**核心功能**:
- 组件树可视化编辑
- 代��实时编辑 + 语法高亮
- 实时预览（iframe 隔离）
- AI 智能补全和生成
- 低码拖拽配置

### 2.5.8 路由守卫与权限

#### 访问控制（未来）

```typescript
// 示例：需要后端连接才能访问开发工具
const DevStudioGuard: React.FC = () => {
  const { isConnected } = useBackendConnection();
  
  if (!isConnected) {
    return <Navigate to="/" />;
  }
  
  return <DevStudioLayout />;
};
```

#### 路由元数据

```typescript
// 未来扩展：路由配置元数据
{
  path: "dev",
  Component: DevStudioLayout,
  meta: {
    title: "智能开发工具",
    requiresAuth: false,
    requiresBackend: true,
  },
}
```

### 2.5.9 性能优化

#### 代码分割（Code Splitting）

```typescript
// 懒加载视图组件（未来优化）
const CollaborationLayout = lazy(() => import('./layouts/CollaborationLayout'));
const DevStudioLayout = lazy(() => import('./layouts/DevStudioLayout'));

// 路由配置
{
  path: "collab",
  Component: CollaborationLayout,
  loader: () => <Suspense fallback={<LoadingSpinner />} />,
}
```

#### 预加载（Prefetch）

```typescript
// 未来优化：鼠标悬停时预加载
<Link 
  to="/collab" 
  onMouseEnter={() => {
    // 预加载协同平台资源
    import('./layouts/CollaborationLayout');
  }}
>
  智能协同平台
</Link>
```

### 2.5.10 ��试策略

#### 单元测试

```typescript
// tests/routing-architecture.test.tsx
describe('路由架构', () => {
  it('应该正确配置 createBrowserRouter', () => {
    expect(router).toBeDefined();
  });
  
  it('根路径应该渲染 ChatRoomLayout', () => {
    const memoryRouter = createMemoryRouter(router.routes, {
      initialEntries: ['/'],
    });
    render(<RouterProvider router={memoryRouter} />);
    expect(screen.getByText(/YYC³ Mission Control/)).toBeTruthy();
  });
});
```

#### 集成测试

```typescript
// 测试路由导航流程
it('应该能从聊天室导航到协同平台', () => {
  render(<App />);
  
  // 点击导航链接
  fireEvent.click(screen.getByText(/协同平台/));
  
  // 验证 URL 变更
  expect(window.location.pathname).toBe('/collab');
  
  // 验证新视图渲染
  expect(screen.getByText(/任务看板/)).toBeTruthy();
});
```

---

## 编码规范

### 1. Layout 组件命名

```typescript
// ✅ 正确：使用 Layout 后缀
export const ChatRoomLayout: React.FC = () => { ... };
export const CollaborationLayout: React.FC = () => { ... };

// ❌ 错误：不使用后缀或使用 Page
export const ChatRoom: React.FC = () => { ... };
export const ChatRoomPage: React.FC = () => { ... };
```

### 2. 路由配置集中管理

```typescript
// ✅ 正确：所有路由在 /routes.ts 中配置
export const router = createBrowserRouter([...]);

// ❌ 错误：在多个文件中分散配置路由
```

### 3. 导航使用 Hook

```typescript
// ✅ 正确：使用 useNavigate hook
const navigate = useNavigate();
navigate('/collab');

// ❌ 错误：直接操作 window.location
window.location.href = '/collab';
```

### 4. 共享逻辑抽离为 Hook

```typescript
// ✅ 正确：复用现有 hooks
const { members } = useFamilySystem();

// ❌ 错误：在每个 Layout 中重新实现逻辑
const [members, setMembers] = useState([]);
useEffect(() => { /* 重新实现 */ }, []);
```

---

## 迁移检查清单

从单一视图迁移到多模态工作台时，确保：

- [ ] 所有原有功能 100% 保留
- [ ] 所有 Hook 正确导入和使用
- [ ] 所有子组件正确导入
- [ ] 所有类型定义正确导入
- [ ] 测试用例全部通过（> 95% 覆盖率）
- [ ] 性能指标达标（渲染 < 200ms）
- [ ] 浏览器控制台无严重错误
- [ ] 后向兼容性验证通过

---

## 常见问题 FAQ

### Q: 为什么选择 React Router v7 Data Mode？

**A**: 
- ✅ 嵌套路由支持（AppShell → 子视图）
- ✅ TypeScript 类型安全
- ✅ Loader 和 Action 支持（未来可用于数据预加载）
- ✅ 错误边界内置
- ✅ 社区最佳实践

### Q: 为什么不使用 react-router-dom？

**A**: 根据 Guidelines.md 要���，Figma Make 环境中使用 `react-router` 包，而非 `react-router-dom`。

### Q: ChatRoomLayout 和 FamilyDashboard 有什么区别？

**A**: 
- **功能**: 100% 对等，无差异
- **位置**: `ChatRoomLayout` 在 `/layouts/` 目录
- **架构**: `ChatRoomLayout` 是路由视图，`FamilyDashboard` 是直接渲染组件
- **未来**: `FamilyDashboard` 将在验证完成后废弃

### Q: 如何添加新的视图？

**A**: 参考 [Section 2.5.7 未来扩展点](#257-未来扩展点)

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| v2.0.0 | 2025-03-02 | ✅ 初始路由架构实现（Step 1 & 2） |
| v2.1.0 | 待定 | 🔜 智能开发工具 (DevStudioLayout) |
| v2.2.0 | 待定 | 🔜 智能协同平台 (CollaborationLayout) |

---

**维护者**: YYC³ AI Family Team  
**文档版本**: v1.0  
**最后更新**: 2025-03-02
