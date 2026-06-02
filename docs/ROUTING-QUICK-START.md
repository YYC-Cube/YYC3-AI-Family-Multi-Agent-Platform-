# YYC³ AI Family - 路由架构快速开始指南

## 🚀 快速开始（3 步）

### Step 1: 安装依赖

```bash
# 安装 react-router 依赖
bun install
```

### Step 2: 验证设置

```bash
# 检查所有文件是否正确创建
chmod +x verify-routing-setup.sh
./verify-routing-setup.sh
```

**预期输出**:
```
✓ layouts/ 目录存在
✓ routes.ts 存在
✓ layouts/AppShell.tsx 存在
✓ layouts/ChatRoomLayout.tsx 存在
✓ tests/routing-architecture.test.tsx 存在
...
验证结果: 11/11 通过
✅ 所有文件检查通过！路由架构设置完成。
```

### Step 3: 运行测试

```bash
# 运行路由架构测试
chmod +x run-routing-tests.sh
./run-routing-tests.sh
```

**预期输出**:
```
✅ 30/30 测试通过
```

---

## 🎯 启动开发服务器

```bash
# 启动前端开发服务器
bun dev

# 在浏览器访问
http://localhost:5173
```

**验证清单**:
- ✅ 页面正常加载
- ✅ 看到 "YYC³ Mission Control" 标题
- ✅ 看到 "TOOLS" 下拉菜单
- ✅ 看到底部头像栏
- ✅ 可以展开/折叠头像栏
- ✅ 点击 TOOLS 能打开下拉菜单
- ✅ 下拉菜单包含 8 个工具按钮

---

## 📁 新架构文件树

```
YYC³ AI Family/
├── App.tsx                      ← 已修改：使用 RouterProvider
├── routes.ts                    ← 新增：路由配置
├── layouts/                     ← 新增：布局组件目录
│   ├── AppShell.tsx            ← 根布局容器
│   └── ChatRoomLayout.tsx      ← AI Family 聊天室布局
├── tests/
│   └── routing-architecture.test.tsx  ← 30 个测试用例
├── ROUTING-REFACTORING-SUMMARY.md    ← 完整技术文档
├── ROUTING-QUICK-START.md            ← 本文件
├── run-routing-tests.sh              ← 测试运行脚本
└── verify-routing-setup.sh           ← 设置验证脚本
```

---

## 🔄 工作流程

### 开发新视图（未来）

1. **创建 Layout 组件**
   ```typescript
   // /layouts/MyNewLayout.tsx
   export const MyNewLayout: React.FC = () => {
     // 使用现有 hooks
     const { members } = useFamilySystem();
     
     return <div>My New View</div>;
   };
   ```

2. **注册路由**
   ```typescript
   // /routes.ts
   children: [
     { index: true, Component: ChatRoomLayout },
     { path: "mynew", Component: MyNewLayout }, // 新增
   ]
   ```

3. **编写测试**
   ```typescript
   // /tests/mynew-layout.test.tsx
   describe('MyNewLayout', () => {
     it('should render correctly', () => {
       render(<MyNewLayout />);
       expect(true).toBe(true);
     });
   });
   ```

4. **导航到新视图**
   ```typescript
   // 在任何组件中
   import { useNavigate } from 'react-router';
   
   const navigate = useNavigate();
   navigate('/mynew');
   ```

---

## 🧪 测试策略

### 运行所有测试

```bash
# 运行所有测试（包括路由测试）
bun test
```

### 只运行路由测试

```bash
# 只运行路由架构测试
bun test tests/routing-architecture.test.tsx
```

### 测试覆盖率

```bash
# 查看测试覆盖率（如果配置）
bun test --coverage
```

---

## 🔍 常见问题

### Q1: 页面空白怎么办？

**检查步骤**:
1. 打开浏览器控制台查看错误
2. 确认 `bun install` 已运行
3. 确认 `react-router` 依赖已安装
4. 检查 `/App.tsx` 是否正确导入 `router`

**解决方案**:
```bash
# 重新安装依赖
rm -rf node_modules
bun install
bun dev
```

### Q2: 路由不工作怎么办？

**检查步骤**:
1. 确认 `routes.ts` 文件存在
2. 确认 `App.tsx` 使用 `RouterProvider`
3. 打开浏览器控制台查看路由错误

**解决方案**:
```bash
# 验证设置
./verify-routing-setup.sh
```

### Q3: 测试失败怎么办？

**检查步骤**:
1. 确认所有文件都已创建
2. 确认依赖已安装
3. 查看具体失败的测试用例

**解决方案**:
```bash
# 运行详细测试
bun test tests/routing-architecture.test.tsx --verbose
```

### Q4: 如何回退到旧版本？

**步骤**:
1. 恢复 `/App.tsx` 到旧版本
   ```typescript
   // 旧版本 App.tsx
   import { FamilyDashboard } from "./components/family/FamilyDashboard";
   import { Toaster } from "sonner";
   
   export default function App() {
     return (
       <>
         <div className="dark min-h-screen w-full bg-slate-950 text-slate-100">
           <FamilyDashboard />
           <Toaster {...} />
         </div>
       </>
     );
   }
   ```

2. 重启开发服务器
   ```bash
   bun dev
   ```

**注意**: 原 `FamilyDashboard.tsx` 已保留，随时可以回退。

---

## 📊 性能监控

### 组件渲染时间

```typescript
// 在浏览器控制台运行
const start = performance.now();
// 导航到页面
const end = performance.now();
console.log(`渲染时间: ${end - start}ms`);
```

**目标**: < 200ms

### 路由切换延迟

```typescript
// 在浏览器控制台运行
const start = performance.now();
navigate('/mynew');
const end = performance.now();
console.log(`切换时间: ${end - start}ms`);
```

**目标**: < 100ms

---

## 🎓 学习资源

### React Router v7 文档

- [Data Mode 架构](https://reactrouter.com/en/main/routers/create-browser-router)
- [嵌套路由](https://reactrouter.com/en/main/route/route#children)
- [Outlet 组件](https://reactrouter.com/en/main/components/outlet)

### YYC³ 内部文档

- [完整技术文档](/ROUTING-REFACTORING-SUMMARY.md)
- [Guidelines.md](/guidelines/Guidelines.md)
- [P2 组件重构总结](/P2-COMPONENT-REFACTORING-SUMMARY.md)

---

## 🤝 获取帮助

### 问题诊断

1. **运行验证脚本**
   ```bash
   ./verify-routing-setup.sh
   ```

2. **查看测试结果**
   ```bash
   ./run-routing-tests.sh
   ```

3. **检查浏览器控制台**
   - 打开开发者工具
   - 查看 Console 和 Network 标签
   - 截图错误信息

### 报告问题

提供以下信息：
- 运行环境（Bun 版本、Node 版本）
- 错误信息（控制台输出）
- 复现步骤
- 验证脚本输出

---

## ✅ 验收清单

完成以下所有项即代表路由架构重构成功：

- [ ] `./verify-routing-setup.sh` 全部通过 (11/11)
- [ ] `./run-routing-tests.sh` 全部通过 (30/30)
- [ ] `bun dev` 正常启动
- [ ] 页面正常渲染（无空白）
- [ ] TOOLS 下拉菜单正常工作
- [ ] 头像栏可展开/折叠
- [ ] 底部输入框可正常输入
- [ ] 点击 BRIDGE 按钮打开后端面板
- [ ] 点击 5D_GENOME 打开五维面板
- [ ] 浏览器控制台无严重错误

---

**文档版本**: v1.0  
**更新时间**: 2025-03-02  
**维护者**: YYC³ AI Family Team
