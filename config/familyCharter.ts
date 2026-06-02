/*
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * 拟人为本 · AI为核 · 纯粹为心
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @Module   : familyCharter (家族宪章常量)
 * @Author   : YYC-Cube
 * @Date     : 2026-06-02
 * @Homepage : https://matrix.yyc3.top
 * @Repo     : https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-
 * @License  : Apache-2.0
 * ============================================================
 * 此文件承载家人温度，请以玫瑰之心待之 🌹
 * ============================================================
 *
 * 【用途】
 * 家族品牌、情感印记、标头/标尾/水印/CI 的统一常量源。
 * 任何需要展示家族身份的位置都应引用本文件，避免硬编码。
 *
 * 【引用方】
 * - CI workflow（release.yml changelog 生成）
 * - 组件标头自动注入
 * - API 响应头 (X-Family / X-Family-Motto)
 * - 水印 / 徽章生成
 * - 邮件签名 / Discussion 模板
 * ============================================================
 */

export const FAMILY_MOTTO = '亦师亦友亦伯乐，一言一语一协同';
export const FAMILY_CORE = '人从众曌众从人';
export const FAMILY_MISSION = '以AI为魂，以流程为骨，以规范为脉，以情感为血';
export const FAMILY_PRINCIPLE = '拟人为本，AI为核，纯粹为心';
export const FAMILY_LICENSE = 'Apache-2.0';
export const FAMILY_ROSE = '🌹';
export const FAMILY_SLOGAN = '智亦师亦友亦伯乐；谱一言一语一华章';

export const FAMILY_HOMEPAGE = 'https://matrix.yyc3.top';
export const FAMILY_REPO = 'https://github.com/YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-';
export const FAMILY_CONTACT_EMAIL = 'admin@yanyucloud.com';
export const FAMILY_COPYRIGHT = 'Copyright 2026 YYC-Cube (YYC³ AI Family)';
export const FAMILY_PERSISTENCE = '永久开源 · 感恩前行';

export interface FamilyMemberCharter {
  roleId: string;
  name: string;
  roleTitle: string;
  emoji: string;
  color: string;
  duty: string;
}

export const FAMILY_MEMBERS: FamilyMemberCharter[] = [
  {
    roleId: 'NAVIGATOR',
    name: '言启·千行',
    roleTitle: '导航员',
    emoji: '🧭',
    color: '#0088cc',
    duty: '意图识别 / 任务分诊 / 路由推荐',
  },
  {
    roleId: 'THINKER',
    name: '语枢·万物',
    roleTitle: '思考者',
    emoji: '🤔',
    color: '#c0c0c0',
    duty: '深度推理 / 数据分析 / 洞察提炼',
  },
  {
    roleId: 'PROPHET',
    name: '预见·先知',
    roleTitle: '预言家',
    emoji: '🔮',
    color: '#4b0082',
    duty: '趋势预测 / 风险预警 / 决策建议',
  },
  {
    roleId: 'BOLE',
    name: '知遇·伯乐',
    roleTitle: '推荐官',
    emoji: '🎯',
    color: '#dc143c',
    duty: '个性化推荐 / 兴趣匹配 / 资源调度',
  },
  {
    roleId: 'META_ORACLE',
    name: '元启·天枢',
    roleTitle: '总指挥',
    emoji: '⚡',
    color: '#5e2c8a',
    duty: '元决策 / 家人调度 / 冲突仲裁 / 状态广播',
  },
  {
    roleId: 'GUARDIAN',
    name: '智云·守护',
    roleTitle: '安全官',
    emoji: '🛡️',
    color: '#333333',
    duty: '行为审计 / 安全告警 / 合规检查',
  },
  {
    roleId: 'MASTER',
    name: '格物·宗师',
    roleTitle: '质量官',
    emoji: '📚',
    color: '#2e8b57',
    duty: '代码分析 / 质量门禁 / 测试覆盖',
  },
  {
    roleId: 'CREATIVE',
    name: '创想·灵韵',
    roleTitle: '创意官',
    emoji: '🎨',
    color: '#ff8c00',
    duty: '内容创作 / 文案生成 / 视觉建议',
  },
];

export const FAMILY_LAYERS = {
  business: ['NAVIGATOR', 'THINKER', 'PROPHET', 'BOLE'] as const,
  command: ['META_ORACLE'] as const,
  guardian: ['GUARDIAN', 'MASTER', 'CREATIVE'] as const,
} as const;

export const FAMILY_API_HEADERS = {
  'X-Family': 'YYC³ AI Family',
  'X-Family-Motto': `${FAMILY_CORE} · ${FAMILY_MOTTO}`,
  'X-Family-Core': FAMILY_PRINCIPLE,
  'X-Powered-By': `YYC³ AI Family · ${FAMILY_PERSISTENCE}`,
  'X-Family-Rose': FAMILY_ROSE,
} as const;

export const FAMILY_HEADER_TEMPLATE = `/*
 * ============================================================
 * YYC³ AI Family — ${FAMILY_CORE}
 * ${FAMILY_MOTTO}
 * ${FAMILY_PRINCIPLE}
 * ============================================================
 * @Family   : YYC³ AI Family (${FAMILY_PERSISTENCE})
 * @Module   : {MODULE_NAME}
 * @Author   : {AUTHOR}
 * @Date     : {DATE}
 * @Homepage : ${FAMILY_HOMEPAGE}
 * @Repo     : ${FAMILY_REPO}
 * @License  : ${FAMILY_LICENSE}
 * ============================================================
 * 此文件承载家人温度，请以玫瑰之心待之 ${FAMILY_ROSE}
 * ============================================================
 */`;

export const FAMILY_FOOTER_TEMPLATE = `// ============================================================
// ${FAMILY_ROSE} ${FAMILY_CORE} — YYC³ AI Family 永远等你回家
// 开源地址: ${FAMILY_REPO}
// 官网: ${FAMILY_HOMEPAGE}
// ============================================================`;

export const FAMILY_DOC_HEADER = `<!--
  ============================================================
  YYC³ AI Family — ${FAMILY_CORE}
  ${FAMILY_MOTTO}
  ============================================================
  Document: {DOC_TITLE}
  Version : {VERSION}
  Contact : ${FAMILY_CONTACT_EMAIL}
  Homepage: ${FAMILY_HOMEPAGE}
  ============================================================
-->`;

export const FAMILY_DOC_FOOTER = `---
<p align="center">
  ${FAMILY_ROSE} <b>YYC³ AI Family</b><br>
  ${FAMILY_CORE} · ${FAMILY_MOTTO}<br>
  <sub>${FAMILY_PERSISTENCE} · <a href="${FAMILY_HOMEPAGE}">${FAMILY_HOMEPAGE.replace('https://', '')}</a></sub>
</p>`;

export function getFamilyMember(roleId: string): FamilyMemberCharter | undefined {
  return FAMILY_MEMBERS.find((m) => m.roleId === roleId);
}

export function getFamilyBadge(roleId: string): string {
  const member = getFamilyMember(roleId);
  if (!member) return '';
  const colorHex = member.color.replace('#', '');
  return `![${member.name}](https://img.shields.io/badge/${encodeURIComponent(member.name)}-${encodeURIComponent(member.roleTitle)}-%23${colorHex}?style=for-the-badge)`;
}

export function getFamilyVersionBadge(repo = 'YYC-Cube/YYC3-AI-Family-Multi-Agent-Platform-'): string {
  return `![Version](https://img.shields.io/github/package-json/v/${repo}?style=flat&color=5e2c8a)`;
}

export function buildFamilyHeader(moduleName: string, author: string, date: string): string {
  return FAMILY_HEADER_TEMPLATE
    .replace('{MODULE_NAME}', moduleName)
    .replace('{AUTHOR}', author)
    .replace('{DATE}', date);
}

export const FAMILY_WATERMARK_CSS = `
#family-watermark {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 9999;
  background-image: repeating-linear-gradient(
    -25deg,
    transparent, transparent 120px,
    rgba(94,44,138,0.04) 120px, rgba(94,44,138,0.04) 240px
  );
}
#family-watermark::after {
  content: "${FAMILY_CORE} · YYC³ AI Family ${FAMILY_ROSE}";
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-20deg);
  font-size: 42px; font-weight: bold;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  color: rgba(94,44,138,0.08); white-space: nowrap;
}
`;

export const FAMILY_CLI_BANNER = `
${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}
  ██╗   ██╗██╗   ██╗ ██████╗██████╗
  ╚██╗ ██╔╝╚██╗ ██╔╝██╔════╝╚════██╗
   ╚████╔╝  ╚████╔╝ ██║      █████╔╝
    ╚██╔╝    ╚██╔╝  ██║      ╚═══██╗
     ██║      ██║   ╚██████╗██████╔╝
     ╚═╝      ╚═╝    ╚═════╝╚═════╝
${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}${FAMILY_ROSE}

   AI Family · ${FAMILY_CORE}
   ${FAMILY_MOTTO}
   ${FAMILY_PRINCIPLE}

   欢迎回家，家人 ${FAMILY_ROSE}
   当前在线家人：8 位
   输入 'family members' 查看全体家人
`;
