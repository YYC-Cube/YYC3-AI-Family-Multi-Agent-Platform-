/**
 * file: vitest.config.ts
 * description: Vitest 测试框架配置（启用 globals + jsdom DOM 环境）
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-06-02
 * updated: 2026-06-02
 * status: active
 * tags: [test-config]
 */

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // bun:test 测试需用 bun test 运行，vitest 排除
      'tests/p0-type-deduplication.test.ts',
      'tests/p1-family-member-state-migration.test.ts',
      'tests/p1-logmessage-rag-migration.test.ts',
      'tests/p2-component-refactoring.test.tsx',
      'tests/quick-p0-verify.test.ts',
      'tests/step5-collaboration.test.tsx',
      'tests/step6-collaboration-advanced.test.tsx',
      'tests/step7-advanced-integration.test.tsx',
      'tests/routing-architecture.test.tsx',
      'tests/dynamic-config.test.tsx',
      'tests/dev-studio.test.tsx',
      'tests/collaboration-layout.test.tsx',
    ],
    setupFiles: ['./tests/setup.ts'],
  },
});
