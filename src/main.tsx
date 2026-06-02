/**
 * file: main.tsx
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
 * YYC³ AI Family - Vite Entry Point (本地部署入口)
 * 
 * 注意：Figma Make 的所有文件在根目录，
 * 但 Vite 的入口在 src/main.tsx，所以用 "../" 引用根级文件。
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App";
import "../styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
