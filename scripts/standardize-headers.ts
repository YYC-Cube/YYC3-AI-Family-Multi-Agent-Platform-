#!/usr/bin/env node
/**
 * file: standardize-headers.ts
 * description: YYC³ 代码文件标头标准化工具 · 自动添加符合规范的 JSDoc 标头
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-04-04
 * updated: 2026-04-04
 * status: active
 * tags: [script],[automation],[standardization]
 *
 * brief: 自动扫描并修复所有 TypeScript/TSX 文件的标头，确保符合 YYC³ 规范
 *
 * details:
 * - 扫描项目中所有 .ts 和 .tsx 文件
 * - 检查文件是否有符合 YYC³ 规范的 JSDoc 标头
 * - 自动添加或修复缺失的标头字段
 * - 生成合规报告
 *
 * dependencies: Node.js, fs, path
 * exports: StandardizeHeaders
 * notes: 运行前请确保已备份代码
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileHeader {
  file: string;
  description: string;
  author: string;
  version: string;
  created: string;
  updated: string;
  status: string;
  tags: string[];
  brief?: string;
  details?: string;
  dependencies?: string;
  exports?: string;
  notes?: string;
}

interface ScanResult {
  total: number;
  compliant: number;
  nonCompliant: number;
  missing: number;
  files: {
    path: string;
    status: 'compliant' | 'non-compliant' | 'missing';
    issues?: string[];
  }[];
}

const REQUIRED_FIELDS = ['file', 'description', 'author', 'version', 'created', 'updated', 'status', 'tags'];
const YYC3_HEADER_PATTERN = /\/\*\*\s*\n(\s*\*\s*[\w\u4e00-\u9fa5]+:.+\n)*\s*\*\//;
const FIELD_PATTERN = /^\s*\*\s*([\w\u4e00-\u9fa5]+):\s*(.+)$/;

function extractHeader(content: string): { header: Record<string, string>; startIndex: number; endIndex: number } | null {
  const match = content.match(YYC3_HEADER_PATTERN);
  if (!match) return null;

  const header: Record<string, string> = {};
  const lines = match[0].split('\n');

  for (const line of lines) {
    const fieldMatch = line.match(FIELD_PATTERN);
    if (fieldMatch) {
      const [, key, value] = fieldMatch;
      header[key] = value.trim();
    }
  }

  return {
    header,
    startIndex: match.index!,
    endIndex: match.index! + match[0].length,
  };
}

function validateHeader(header: Record<string, string>): { valid: boolean; missing: string[] } {
  const missing = REQUIRED_FIELDS.filter(field => !header[field]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

function generateDefaultHeader(filePath: string): string {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);
  const isTsx = ext === '.tsx';
  const isTs = ext === '.ts';

  let fileType = '文件';
  let tags = '[file]';

  if (filePath.includes('/components/')) {
    fileType = isTsx ? '组件' : '模块';
    tags = isTsx ? '[component]' : '[module]';
  } else if (filePath.includes('/hooks/')) {
    fileType = 'Hook';
    tags = '[hook]';
  } else if (filePath.includes('/utils/')) {
    fileType = '工具函数';
    tags = '[util]';
  } else if (filePath.includes('/types/')) {
    fileType = '类型定义';
    tags = '[type]';
  } else if (filePath.includes('/services/')) {
    fileType = '服务';
    tags = '[service]';
  } else if (filePath.includes('/config/')) {
    fileType = '配置';
    tags = '[config]';
  } else if (filePath.includes('/tests/') || filePath.includes('.test.')) {
    fileType = '测试';
    tags = '[test]';
  } else if (filePath.includes('/bun-server/')) {
    fileType = '后端服务';
    tags = '[backend]';
  }

  const today = new Date().toISOString().split('T')[0];

  return `/**
 * file: ${fileName}
 * description: ${fileType} · 待补充描述
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: ${today}
 * updated: ${today}
 * status: active
 * tags: ${tags}
 *
 * brief: 待补充简要说明
 *
 * details: 待补充详细说明
 *
 * dependencies: 待补充
 * exports: 待补充
 * notes: 待补充
 */`;
}

function scanDirectory(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}

function scanFiles(rootDir: string): ScanResult {
  const result: ScanResult = {
    total: 0,
    compliant: 0,
    nonCompliant: 0,
    missing: 0,
    files: [],
  };

  const files = scanDirectory(rootDir, ['.ts', '.tsx']);
  result.total = files.length;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const headerInfo = extractHeader(content);

    if (!headerInfo) {
      result.missing++;
      result.files.push({
        path: filePath,
        status: 'missing',
        issues: ['缺少 YYC³ 标准标头'],
      });
    } else {
      const validation = validateHeader(headerInfo.header);

      if (validation.valid) {
        result.compliant++;
        result.files.push({
          path: filePath,
          status: 'compliant',
        });
      } else {
        result.nonCompliant++;
        result.files.push({
          path: filePath,
          status: 'non-compliant',
          issues: validation.missing.map(field => `缺少必填字段: ${field}`),
        });
      }
    }
  }

  return result;
}

function fixFile(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  const headerInfo = extractHeader(content);

  if (!headerInfo) {
    const defaultHeader = generateDefaultHeader(filePath);
    const newContent = defaultHeader + '\n\n' + content;
    fs.writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }

  const validation = validateHeader(headerInfo.header);

  if (!validation.valid) {
    const today = new Date().toISOString().split('T')[0];
    const fileName = path.basename(filePath);

    const missingFields: Record<string, string> = {
      file: fileName,
      description: '待补充描述',
      author: 'YanYuCloudCube Team',
      version: 'v1.0.0',
      created: today,
      updated: today,
      status: 'active',
      tags: '[file]',
    };

    const fixedHeader: Record<string, string> = { ...headerInfo.header };

    for (const field of validation.missing) {
      if (missingFields[field]) {
        fixedHeader[field] = missingFields[field];
      }
    }

    const headerLines = ['/**'];
    for (const [key, value] of Object.entries(fixedHeader)) {
      headerLines.push(` * ${key}: ${value}`);
    }
    headerLines.push(' */');

    const newHeader = headerLines.join('\n');
    const newContent = content.substring(0, headerInfo.startIndex) + newHeader + content.substring(headerInfo.endIndex);

    fs.writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }

  return false;
}

function generateReport(result: ScanResult): string {
  const lines: string[] = [
    '# YYC³ 代码文件标头合规报告',
    '',
    `生成时间: ${new Date().toISOString()}`,
    '',
    '## 📊 统计概览',
    '',
    `- **总文件数**: ${result.total}`,
    `- **合规文件**: ${result.compliant} (${((result.compliant / result.total) * 100).toFixed(1)}%)`,
    `- **不合规文件**: ${result.nonCompliant} (${((result.nonCompliant / result.total) * 100).toFixed(1)}%)`,
    `- **缺失标头**: ${result.missing} (${((result.missing / result.total) * 100).toFixed(1)}%)`,
    '',
    '## 📋 详细列表',
    '',
  ];

  if (result.missing > 0) {
    lines.push('### ❌ 缺失标头的文件');
    lines.push('');
    for (const file of result.files.filter(f => f.status === 'missing')) {
      lines.push(`- \`${file.path}\``);
    }
    lines.push('');
  }

  if (result.nonCompliant > 0) {
    lines.push('### ⚠️ 不合规的文件');
    lines.push('');
    for (const file of result.files.filter(f => f.status === 'non-compliant')) {
      lines.push(`- \`${file.path}\``);
      if (file.issues) {
        for (const issue of file.issues) {
          lines.push(`  - ${issue}`);
        }
      }
    }
    lines.push('');
  }

  if (result.compliant > 0) {
    lines.push('### ✅ 合规的文件');
    lines.push('');
    for (const file of result.files.filter(f => f.status === 'compliant')) {
      lines.push(`- \`${file.path}\``);
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'scan';
  const targetDir = args[1] || process.cwd();

  console.log('YYC³ 代码文件标头标准化工具');
  console.log('='.repeat(50));
  console.log();

  switch (command) {
    case 'scan':
      console.log(`📁 扫描目录: ${targetDir}`);
      console.log();
      const result = scanFiles(targetDir);
      const report = generateReport(result);
      console.log(report);

      const reportPath = path.join(targetDir, 'YYC3-HEADER-COMPLIANCE-REPORT.md');
      fs.writeFileSync(reportPath, report, 'utf-8');
      console.log();
      console.log(`✅ 报告已保存到: ${reportPath}`);
      break;

    case 'fix':
      console.log(`🔧 修复目录: ${targetDir}`);
      console.log();
      const scanResult = scanFiles(targetDir);
      let fixedCount = 0;

      for (const file of scanResult.files) {
        if (file.status !== 'compliant') {
          const fixed = fixFile(file.path);
          if (fixed) {
            console.log(`✅ 已修复: ${file.path}`);
            fixedCount++;
          }
        }
      }

      console.log();
      console.log(`🎉 修复完成！共修复 ${fixedCount} 个文件`);
      break;

    case 'help':
      console.log('用法:');
      console.log('  node standardize-headers.ts scan [目录]  # 扫描并生成报告');
      console.log('  node standardize-headers.ts fix [目录]   # 自动修复标头');
      console.log('  node standardize-headers.ts help         # 显示帮助');
      break;

    default:
      console.error('❌ 未知命令。使用 "help" 查看帮助。');
      process.exit(1);
  }
}

main().catch(console.error);
