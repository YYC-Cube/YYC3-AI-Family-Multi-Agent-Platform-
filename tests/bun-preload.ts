/**
 * file: bun-preload.ts
 * description: Bun test 全局 preload — 为 React 测试注入 happy-dom 浏览器环境
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-06-02
 * updated: 2026-06-02
 * status: active
 * tags: [test-setup]
 */

import { Window } from 'happy-dom';

if (typeof (globalThis as any).window === 'undefined') {
  const window = new Window();
  const anyWin = window as any;
  (globalThis as any).window = window;
  (globalThis as any).document = window.document;
  (globalThis as any).navigator = window.navigator;
  (globalThis as any).location = window.location;
  (globalThis as any).history = window.history;
  (globalThis as any).localStorage = anyWin.localStorage;
  (globalThis as any).sessionStorage = anyWin.sessionStorage;
  (globalThis as any).console = console;
  (globalThis as any).HTMLElement = anyWin.HTMLElement;
  (globalThis as any).Element = anyWin.Element;
  (globalThis as any).Node = anyWin.Node;
  (globalThis as any).SVGElement = anyWin.SVGElement;
  (globalThis as any).Text = anyWin.Text;
  (globalThis as any).Comment = anyWin.Comment;
  (globalThis as any).DocumentFragment = anyWin.DocumentFragment;
  (globalThis as any).Event = anyWin.Event;
  (globalThis as any).CustomEvent = anyWin.CustomEvent;
  (globalThis as any).MouseEvent = anyWin.MouseEvent;
  (globalThis as any).KeyboardEvent = anyWin.KeyboardEvent;
  (globalThis as any).getComputedStyle = anyWin.getComputedStyle.bind(window);
  (globalThis as any).requestAnimationFrame = anyWin.requestAnimationFrame?.bind(window) ?? ((cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16));
  (globalThis as any).cancelAnimationFrame = anyWin.cancelAnimationFrame?.bind(window) ?? ((id: number) => clearTimeout(id));
  (globalThis as any).matchMedia = anyWin.matchMedia?.bind(window) ?? ((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => { }, removeListener: () => { },
    addEventListener: () => { }, removeEventListener: () => { },
    dispatchEvent: () => false,
  }));
}

export { };
