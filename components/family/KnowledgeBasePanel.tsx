/**
 * file: KnowledgeBasePanel.tsx
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
 * YYC³ AI Family - Knowledge Base Panel (知识长河·可视化中枢)
 * 
 * Frontend interface for the 6-module KB backend:
 *   Stats  — /api/kb/stats + /api/kb/embedding
 *   Search — POST /api/kb/search (semantic), /api/kb/search/advanced (hybrid)
 *   Graph  — GET /api/kb/graph (D3 force-directed visualization)
 *   Sources — from stats.indexedSources
 * 
 * Connects to Bun backend via REST API (configurable apiUrl).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, BarChart3, Network, FileText, Database,
  RefreshCw, Loader2, AlertTriangle, CheckCircle2,
  HardDrive, Brain, TrendingUp, Zap,
  Clock, Hash, Layers,
  ZoomIn, ZoomOut, Maximize2, Filter
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { ENDPOINTS } from '../../config/endpoints';

// ==========================================
// Types (mirrors backend kb-types.ts)
// ==========================================

interface KBStats {
  totalDocuments: number;
  totalChunks: number;
  totalSizeBytes: number;
  vectorDimensions: number;
  byModality: Record<string, number>;
  byFormat: Record<string, number>;
  totalSearches: number;
  avgSearchLatencyMs: number;
  graphNodes: number;
  graphEdges: number;
  graphDensity: number;
  externalSources: number;
  lastSyncAt: number;
  conflictsUnresolved: number;
  duplicatesDetected: number;
  avgQualityScore: number;
  topAccessedDocuments: { source: string; count: number }[];
  topSearchQueries: { query: string; count: number }[];
  lastIndexedAt: number;
  indexedSources: { path: string; chunks: number; lastModified: number }[];
  uptime: number;
}

interface EmbeddingStatus {
  provider: string;
  activeProvider: string;
  model: string;
  dimensions: number;
  autoDetected: boolean;
  totalCalls: number;
  totalErrors: number;
  errorRate: string;
  ollamaModelVerified?: boolean;
}

interface SearchResultItem {
  chunk: {
    id: string;
    content: string;
    source: string;
    sourceType: string;
    chunkIndex: number;
    totalChunks: number;
    metadata: {
      title?: string;
      section?: string;
      language?: string;
      format?: string;
      createdAt: number;
      updatedAt: number;
    };
    qualityLevel: string;
    credibilityScore: number;
  };
  similarity: number;
  relevanceScore: number;
  highlights: { text: string; startOffset: number; endOffset: number; matchType: string }[];
  sourcePreview?: string;
}

interface GraphVisualization {
  nodes: {
    id: string;
    label: string;
    type: string;
    size: number;
    color: string;
    x?: number;
    y?: number;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    label: string;
    weight: number;
  }[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    components: number;
    density: number;
  };
}

// ==========================================
// Props
// ==========================================

interface KnowledgeBasePanelProps {
  onClose: () => void;
  apiUrl?: string;
}

// ==========================================
// Tab Definitions
// ==========================================

type TabId = 'stats' | 'search' | 'graph' | 'sources';

const TABS: { id: TabId; label: string; icon: React.ReactNode; shortLabel: string }[] = [
  { id: 'stats', label: '知识概览', icon: <BarChart3 className="w-4 h-4" />, shortLabel: 'STATS' },
  { id: 'search', label: '语义搜索', icon: <Search className="w-4 h-4" />, shortLabel: 'SEARCH' },
  { id: 'graph', label: '知识图谱', icon: <Network className="w-4 h-4" />, shortLabel: 'GRAPH' },
  { id: 'sources', label: '数据源', icon: <FileText className="w-4 h-4" />, shortLabel: 'SOURCES' },
];

// ==========================================
// Utility
// ==========================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatTime(ms: number): string {
  if (ms === 0) return '--';
  const date = new Date(ms);
  return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getSourceFileName(path: string): string {
  return path.split('/').pop() || path;
}

// Color map for entity types
const ENTITY_COLORS: Record<string, string> = {
  'PERSON': '#10b981',
  'ORGANIZATION': '#3b82f6',
  'TECHNOLOGY': '#8b5cf6',
  'PROJECT': '#f59e0b',
  'PRODUCT': '#ef4444',
  'LOCATION': '#06b6d4',
  'EVENT': '#ec4899',
  'CODE_SYMBOL': '#84cc16',
  'FILE_PATH': '#64748b',
  'CUSTOM': '#a78bfa',
};

// Metric colors
const METRIC_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  cyan: { bg: 'rgba(6, 182, 212, 0.05)', border: 'rgba(6, 182, 212, 0.2)', text: '#22d3ee' },
  blue: { bg: 'rgba(59, 130, 246, 0.05)', border: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' },
  violet: { bg: 'rgba(139, 92, 246, 0.05)', border: 'rgba(139, 92, 246, 0.2)', text: '#a78bfa' },
  amber: { bg: 'rgba(245, 158, 11, 0.05)', border: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
};

// ==========================================
// Main Component
// ==========================================

export const KnowledgeBasePanel: React.FC<KnowledgeBasePanelProps> = ({
  onClose,
  apiUrl = ENDPOINTS.API_BASE,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('stats');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<KBStats | null>(null);
  const [embeddingStatus, setEmbeddingStatus] = useState<EmbeddingStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [graphData, setGraphData] = useState<GraphVisualization | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);

  // ---- API Helpers ----

  const fetchAPI = useCallback(async (path: string, options?: RequestInit) => {
    const res = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
    return res.json();
  }, [apiUrl]);

  // ---- Load Stats + Embedding ----

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, embData] = await Promise.all([
        fetchAPI('/api/kb/stats'),
        fetchAPI('/api/kb/embedding'),
      ]);
      setStats(statsData);
      setEmbeddingStatus(embData);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  }, [fetchAPI]);

  // ---- Search ----

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const start = Date.now();
      const data = await fetchAPI('/api/kb/search', {
        method: 'POST',
        body: JSON.stringify({ query: searchQuery, topK: 10, threshold: 0.1 }),
      });
      setSearchResults(data.results || []);
      setSearchTime(Date.now() - start);
    } catch (err: any) {
      setError(err.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, fetchAPI]);

  // ---- Load Graph ----

  const loadGraph = useCallback(async () => {
    setGraphLoading(true);
    try {
      const data = await fetchAPI('/api/kb/graph?depth=3&limit=200');
      setGraphData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGraphLoading(false);
    }
  }, [fetchAPI]);

  // ---- Initial Load ----

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'graph' && !graphData) {
      loadGraph();
    }
  }, [activeTab, graphData, loadGraph]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/5 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Database className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
              知识长河 · Knowledge Base
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono tracking-wider">
              {stats && (
                <>
                  <span className="text-cyan-500">{stats.totalChunks} CHUNKS</span>
                  <span className="w-1 h-1 bg-slate-700 rounded-full" />
                  <span className="text-blue-500">{stats.totalDocuments} SOURCES</span>
                  <span className="w-1 h-1 bg-slate-700 rounded-full" />
                  <span className="text-violet-500">{stats.graphNodes} NODES</span>
                </>
              )}
              {embeddingStatus && (
                <>
                  <span className="w-1 h-1 bg-slate-700 rounded-full" />
                  <span className={cn(
                    embeddingStatus.activeProvider === 'ollama' ? 'text-emerald-500' : 'text-yellow-500'
                  )}>
                    {embeddingStatus.activeProvider.toUpperCase()} {embeddingStatus.dimensions}d
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <nav className="flex-none flex items-center border-b border-white/5 bg-black/20 px-4 gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs font-mono transition-all border-b-2 whitespace-nowrap",
              activeTab === tab.id
                ? "border-cyan-500 text-cyan-400 bg-cyan-500/5"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5"
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        ))}
      </nav>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-none bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2 text-xs text-red-400 font-mono overflow-hidden"
          >
            <AlertTriangle className="w-3 h-3 flex-none" />
            <span className="truncate">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500/60 hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-y-auto p-4 md:p-6 space-y-6"
            >
              <StatsTab stats={stats} embedding={embeddingStatus} loading={loading} />
            </motion.div>
          )}

          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col overflow-hidden"
            >
              <SearchTab
                query={searchQuery}
                onQueryChange={setSearchQuery}
                onSearch={handleSearch}
                results={searchResults}
                searchTime={searchTime}
                isSearching={isSearching}
                topQueries={stats?.topSearchQueries || []}
              />
            </motion.div>
          )}

          {activeTab === 'graph' && (
            <motion.div
              key="graph"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-hidden"
            >
              <GraphTab data={graphData} loading={graphLoading} onRefresh={loadGraph} />
            </motion.div>
          )}

          {activeTab === 'sources' && (
            <motion.div
              key="sources"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full overflow-y-auto p-4 md:p-6"
            >
              <SourcesTab stats={stats} loading={loading} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};


// ==========================================
// Stats Tab
// ==========================================

const StatsTab: React.FC<{
  stats: KBStats | null;
  embedding: EmbeddingStatus | null;
  loading: boolean;
}> = ({ stats, embedding, loading }) => {
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <AlertTriangle className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-mono">无法获取知识库数据</p>
        <p className="text-[10px] font-mono mt-1 text-slate-600">请确认后端服务已启动 (bun run index.ts)</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Core Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={<Layers className="w-4 h-4" />}
          label="知识碎片"
          value={stats.totalChunks.toLocaleString()}
          sub="CHUNKS"
          color="cyan"
        />
        <MetricCard
          icon={<FileText className="w-4 h-4" />}
          label="文档源"
          value={stats.totalDocuments.toString()}
          sub="SOURCES"
          color="blue"
        />
        <MetricCard
          icon={<Network className="w-4 h-4" />}
          label="图谱节点"
          value={`${stats.graphNodes} / ${stats.graphEdges}`}
          sub="NODES / EDGES"
          color="violet"
        />
        <MetricCard
          icon={<HardDrive className="w-4 h-4" />}
          label="索引大小"
          value={formatBytes(stats.totalSizeBytes)}
          sub="TOTAL SIZE"
          color="amber"
        />
      </div>

      {/* Embedding Status */}
      {embedding && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Embedding Engine</span>
            {embedding.ollamaModelVerified && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Provider</div>
              <div className="text-sm text-white font-mono">{embedding.activeProvider}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Model</div>
              <div className="text-sm text-white font-mono">{embedding.model}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Dimensions</div>
              <div className="text-sm text-white font-mono">
                {embedding.dimensions}d
                {embedding.autoDetected && (
                  <span className="ml-1 text-[9px] text-emerald-500">(auto)</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Calls / Errors</div>
              <div className="text-sm text-white font-mono">
                {embedding.totalCalls} / <span className={cn(
                  embedding.totalErrors > 0 ? "text-red-400" : "text-emerald-400"
                )}>{embedding.totalErrors}</span>
                <span className="ml-1 text-[9px] text-slate-500">({embedding.errorRate})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Performance + Quality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Performance */}
        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">搜索性能</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">总搜索次数</span>
              <span className="text-sm text-white font-mono">{stats.totalSearches}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">平均延迟</span>
              <span className="text-sm text-white font-mono">{stats.avgSearchLatencyMs}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">向量维度</span>
              <span className="text-sm text-white font-mono">{stats.vectorDimensions}d</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">图谱密度</span>
              <span className="text-sm text-white font-mono">{(stats.graphDensity * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Quality Score */}
        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">质量与同步</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">平均质量分</span>
              <QualityBar score={stats.avgQualityScore} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">未解决冲突</span>
              <span className={cn("text-sm font-mono", stats.conflictsUnresolved > 0 ? "text-red-400" : "text-emerald-400")}>
                {stats.conflictsUnresolved}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">重复检测</span>
              <span className="text-sm text-white font-mono">{stats.duplicatesDetected}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">最后索引</span>
              <span className="text-sm text-white font-mono">{formatTime(stats.lastIndexedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Format Distribution */}
      {Object.keys(stats.byFormat).length > 0 && (
        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">格式分布</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byFormat)
              .sort(([, a], [, b]) => b - a)
              .map(([format, count]) => (
                <FormatBadge key={format} format={format} count={count} total={stats.totalChunks} />
              ))}
          </div>
        </div>
      )}

      {/* Top Queries */}
      {stats.topSearchQueries.length > 0 && (
        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">热门搜索</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.topSearchQueries.map((q, i) => (
              <span
                key={i}
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center gap-1.5"
              >
                {q.query}
                <span className="text-[9px] text-cyan-500/60">x{q.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// ==========================================
// Search Tab
// ==========================================

const SearchTab: React.FC<{
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  results: SearchResultItem[];
  searchTime: number | null;
  isSearching: boolean;
  topQueries: { query: string; count: number }[];
}> = ({ query, onQueryChange, onSearch, results, searchTime, isSearching, topQueries }) => {

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="flex-none p-4 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-2 bg-slate-900 rounded-xl border border-white/10 px-4 py-2.5 focus-within:border-cyan-500/50 transition-colors">
          <Search className="w-4 h-4 text-slate-500 flex-none" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="语义搜索知识库... (例: AI Family 信任公约)"
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none font-mono"
          />
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-cyan-500 animate-spin flex-none" />
          ) : (
            <button
              onClick={onSearch}
              disabled={!query.trim()}
              className="text-[10px] font-mono px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-30 transition-colors flex-none"
            >
              SEARCH
            </button>
          )}
        </div>

        {/* Quick suggestions */}
        {!results.length && topQueries.length > 0 && !query && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] text-slate-600 font-mono">热门:</span>
            {topQueries.slice(0, 5).map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  onQueryChange(q.query);
                }}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                {q.query}
              </button>
            ))}
          </div>
        )}

        {/* Search metadata */}
        {searchTime !== null && results.length > 0 && (
          <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-500">
            <span>找到 <span className="text-cyan-400">{results.length}</span> 条结果</span>
            <span className="w-1 h-1 bg-slate-700 rounded-full" />
            <span>耗时 <span className="text-emerald-400">{searchTime}ms</span></span>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isSearching && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
          </div>
        )}

        {!isSearching && results.length === 0 && searchTime !== null && (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <Search className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs font-mono">未找到相关知识</p>
            <p className="text-[10px] font-mono mt-1 text-slate-600">尝试更宽泛的关键词</p>
          </div>
        )}

        {!isSearching && results.length === 0 && searchTime === null && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-600">
            <Brain className="w-12 h-12 mb-3 opacity-10" />
            <p className="text-sm font-mono text-slate-500 mb-1">语义穿透检索引擎</p>
            <p className="text-[10px] font-mono text-slate-600 max-w-sm text-center">
              输入自然语言查询，知识库将通过 {' '}
              <span className="text-cyan-500">Ollama 768d</span> 向量空间检索最相关的知识碎片
            </p>
          </div>
        )}

        {results.map((result, idx) => (
          <SearchResultCard key={result.chunk.id} result={result} rank={idx + 1} />
        ))}
      </div>
    </div>
  );
};

// ==========================================
// Search Result Card
// ==========================================

const SearchResultCard: React.FC<{ result: SearchResultItem; rank: number }> = ({ result, rank }) => {
  const [expanded, setExpanded] = useState(false);
  const { chunk, similarity, relevanceScore } = result;
  const simPct = (similarity * 100).toFixed(1);
  const fileName = getSourceFileName(chunk.source);

  // Similarity color
  const simColor = similarity >= 0.7 ? 'text-emerald-400' : similarity >= 0.4 ? 'text-yellow-400' : 'text-slate-400';
  const simBg = similarity >= 0.7 ? 'bg-emerald-500/10 border-emerald-500/20' : similarity >= 0.4 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-slate-500/10 border-slate-500/20';

  return (
    <div
      className={cn(
        "rounded-xl border transition-all cursor-pointer",
        expanded ? "bg-slate-900/80 border-cyan-500/30" : "bg-black/20 border-white/5 hover:border-white/10"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-3">
        {/* Rank */}
        <div className="flex-none w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400">
          #{rank}
        </div>

        {/* Content Preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono text-cyan-400 truncate max-w-[200px]">{fileName}</span>
            {chunk.metadata.section && (
              <span className="text-[9px] font-mono text-slate-600 truncate max-w-[120px]">
                § {chunk.metadata.section}
              </span>
            )}
            <span className="text-[9px] font-mono text-slate-700">
              [{chunk.chunkIndex + 1}/{chunk.totalChunks}]
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
            {chunk.content.substring(0, 200)}
          </p>
        </div>

        {/* Similarity Badge */}
        <div className={cn("flex-none px-2.5 py-1 rounded-lg border text-center", simBg)}>
          <div className={cn("text-sm font-mono", simColor)}>{simPct}%</div>
          <div className="text-[8px] text-slate-500 font-mono">SIM</div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 border-t border-white/5 space-y-2">
              <div className="mt-2 p-3 bg-black/30 rounded-lg font-mono text-[11px] text-slate-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                {chunk.content}
              </div>
              <div className="flex items-center gap-3 flex-wrap text-[9px] font-mono text-slate-600">
                <span>SOURCE: {chunk.source}</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span>TYPE: {chunk.sourceType}</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span>QUALITY: {chunk.qualityLevel}</span>
                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                <span>CREDIBILITY: {(chunk.credibilityScore * 100).toFixed(0)}%</span>
                {chunk.metadata.format && (
                  <>
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span>FORMAT: {chunk.metadata.format}</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ==========================================
// Graph Tab (D3 Force Simulation)
// ==========================================

interface ForceNode {
  id: string;
  label: string;
  type: string;
  size: number;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface ForceEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
}

const GraphTab: React.FC<{
  data: GraphVisualization | null;
  loading: boolean;
  onRefresh: () => void;
}> = ({ data, loading, onRefresh }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const [hoveredNode, setHoveredNode] = useState<ForceNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Force simulation state
  const nodesRef = useRef<ForceNode[]>([]);
  const edgesRef = useRef<ForceEdge[]>([]);

  // Initialize simulation when data changes
  useEffect(() => {
    if (!data || data.nodes.length === 0) return;

    // Initialize node positions
    const centerX = 400;
    const centerY = 300;
    const nodes: ForceNode[] = data.nodes.map((n, i) => ({
      ...n,
      x: centerX + (Math.cos(i * 2 * Math.PI / data.nodes.length) * 200) + (Math.random() - 0.5) * 50,
      y: centerY + (Math.sin(i * 2 * Math.PI / data.nodes.length) * 200) + (Math.random() - 0.5) * 50,
      vx: 0,
      vy: 0,
    }));

    const edges: ForceEdge[] = data.edges.map(e => ({ ...e }));

    nodesRef.current = nodes;
    edgesRef.current = edges;

    // Run force simulation
    let iteration = 0;
    const maxIterations = 300;
    const alpha = 0.3;

    function simulate() {
      if (iteration >= maxIterations) return;

      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const decay = 1 - iteration / maxIterations;

      // Repulsion (all nodes repel each other)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (150 * decay) / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }

      // Attraction (connected nodes attract)
      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      for (const edge of edges) {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (!source || !target) continue;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 100) * 0.01 * decay;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }

      // Center gravity
      for (const node of nodes) {
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        node.vx += dx * 0.001 * decay;
        node.vy += dy * 0.001 * decay;
      }

      // Apply velocity with damping
      for (const node of nodes) {
        node.vx *= 0.85;
        node.vy *= 0.85;
        node.x += node.vx * alpha;
        node.y += node.vy * alpha;
      }

      iteration++;
    }

    // Run simulation in batches
    const timer = setInterval(() => {
      for (let i = 0; i < 5; i++) simulate();
      renderCanvas();
      if (iteration >= maxIterations) clearInterval(timer);
    }, 16);

    return () => clearInterval(timer);
  }, [data]);

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Clear
    ctx.fillStyle = 'rgba(2, 6, 23, 1)';
    ctx.fillRect(0, 0, w, h);

    // Grid background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(offset.x + w / 2 - 400 * zoom, offset.y + h / 2 - 300 * zoom);
    ctx.scale(zoom, zoom);

    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Draw edges
    for (const edge of edges) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) continue;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = `rgba(100, 150, 255, ${0.1 + edge.weight * 0.15})`;
      ctx.lineWidth = 0.5 + edge.weight * 0.5;
      ctx.stroke();

      // Edge label
      if (zoom > 0.7) {
        const mx = (source.x + target.x) / 2;
        const my = (source.y + target.y) / 2;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.font = `${9 / zoom}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(edge.label, mx, my - 3);
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const radius = Math.max(4, node.size * 3);
      const isHovered = hoveredNode?.id === node.id;

      // Glow
      if (isHovered) {
        const grad = ctx.createRadialGradient(node.x, node.y, radius, node.x, node.y, radius * 3);
        grad.addColorStop(0, `${node.color}40`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? node.color : `${node.color}cc`;
      ctx.fill();
      ctx.strokeStyle = `${node.color}60`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      if (zoom > 0.5 || isHovered) {
        ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(226, 232, 240, 0.8)';
        ctx.font = `${Math.max(10, 11 / zoom)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + radius + 12);
      }
    }

    ctx.restore();

    // HUD
    if (data) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`NODES: ${data.stats.totalNodes} | EDGES: ${data.stats.totalEdges} | ZOOM: ${zoom.toFixed(1)}x`, 10, h - 10);
    }
  }, [data, zoom, offset, hoveredNode]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => renderCanvas());
    observer.observe(container);
    return () => observer.disconnect();
  }, [renderCanvas]);

  // Re-render on state changes
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    draggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }

    // Hit test for hover
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const mx = (e.clientX - rect.left - offset.x - rect.width / 2 + 400 * zoom) / zoom;
    const my = (e.clientY - rect.top - offset.y - rect.height / 2 + 300 * zoom) / zoom;

    let found: ForceNode | null = null;
    for (const node of nodesRef.current) {
      const dx = node.x - mx;
      const dy = node.y - my;
      if (dx * dx + dy * dy < 200) {
        found = node;
        break;
      }
    }
    setHoveredNode(found);
  }, [zoom, offset]);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.2, Math.min(3, prev - e.deltaY * 0.001)));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Network className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-sm font-mono">知识图谱暂无数据</p>
        <p className="text-[10px] font-mono mt-1 text-slate-600">索引文档后图谱将自动生成</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Graph Controls */}
      <div className="flex-none flex items-center justify-between px-4 py-2 bg-black/20 border-b border-white/5">
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
          <span className="text-violet-400">{data.stats.totalNodes} nodes</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full" />
          <span className="text-blue-400">{data.stats.totalEdges} edges</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full" />
          <span>{data.stats.components} components</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1.5 rounded hover:bg-white/5 text-slate-400">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="p-1.5 rounded hover:bg-white/5 text-slate-400">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} className="p-1.5 rounded hover:bg-white/5 text-slate-400">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onRefresh} className="p-1.5 rounded hover:bg-white/5 text-slate-400">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoveredNode && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 right-3 p-3 rounded-xl bg-slate-900/95 border border-cyan-500/30 backdrop-blur-sm max-w-xs"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hoveredNode.color }} />
                <span className="text-sm text-white font-mono">{hoveredNode.label}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 space-y-0.5">
                <div>TYPE: <span className="text-cyan-400">{hoveredNode.type}</span></div>
                <div>SIZE: <span className="text-blue-400">{hoveredNode.size}</span></div>
                <div>ID: <span className="text-slate-600">{hoveredNode.id.substring(0, 12)}...</span></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 p-2 rounded-lg bg-black/60 backdrop-blur-sm border border-white/5">
          <div className="text-[9px] font-mono text-slate-600 mb-1">ENTITY TYPES</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {Object.entries(ENTITY_COLORS).slice(0, 6).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[9px] font-mono text-slate-500">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// Sources Tab
// ==========================================

const SourcesTab: React.FC<{ stats: KBStats | null; loading: boolean }> = ({ stats, loading }) => {
  const [sortBy, setSortBy] = useState<'chunks' | 'time'>('chunks');
  const [filter, setFilter] = useState('');

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!stats || stats.indexedSources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <FileText className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-sm font-mono">暂无索引数据源</p>
      </div>
    );
  }

  const sources = stats.indexedSources
    .filter(s => !filter || s.path.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => sortBy === 'chunks' ? b.chunks - a.chunks : b.lastModified - a.lastModified);

  const totalChunks = sources.reduce((sum, s) => sum + s.chunks, 0);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-black/20 rounded-lg border border-white/5 px-3 py-1.5 flex-1 min-w-[200px]">
          <Filter className="w-3 h-3 text-slate-500" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="筛选数据源..."
            className="bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none font-mono flex-1"
          />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono">
          <button
            onClick={() => setSortBy('chunks')}
            className={cn("px-2 py-1 rounded", sortBy === 'chunks' ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300")}
          >
            BY CHUNKS
          </button>
          <button
            onClick={() => setSortBy('time')}
            className={cn("px-2 py-1 rounded", sortBy === 'time' ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300")}
          >
            BY TIME
          </button>
        </div>
        <span className="text-[10px] font-mono text-slate-600">
          {sources.length} sources / {totalChunks} chunks
        </span>
      </div>

      {/* Sources List */}
      <div className="space-y-1">
        {sources.map((source) => {
          const fileName = getSourceFileName(source.path);
          const ext = fileName.split('.').pop() || '';
          const chunkPct = stats.totalChunks > 0 ? (source.chunks / stats.totalChunks * 100) : 0;

          return (
            <div
              key={source.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/20 border border-white/5 hover:border-white/10 transition-colors group"
            >
              {/* File icon */}
              <div className={cn(
                "flex-none w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono",
                ext === 'md' ? 'bg-blue-500/10 text-blue-400' :
                ext === 'ts' || ext === 'tsx' ? 'bg-cyan-500/10 text-cyan-400' :
                ext === 'json' ? 'bg-amber-500/10 text-amber-400' :
                ext === 'sql' ? 'bg-violet-500/10 text-violet-400' :
                ext === 'css' ? 'bg-pink-500/10 text-pink-400' :
                'bg-slate-500/10 text-slate-400'
              )}>
                .{ext}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white font-mono truncate">{fileName}</div>
                <div className="text-[10px] text-slate-600 font-mono truncate">{source.path}</div>
              </div>

              {/* Chunks & bar */}
              <div className="flex-none text-right">
                <div className="text-xs text-white font-mono">{source.chunks} chunks</div>
                <div className="w-20 h-1 rounded-full bg-slate-800 mt-1">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${Math.max(2, chunkPct)}%` }}
                  />
                </div>
              </div>

              {/* Time */}
              <div className="flex-none text-[10px] text-slate-600 font-mono hidden md:block w-24 text-right">
                <Clock className="w-3 h-3 inline-block mr-1 opacity-50" />
                {formatTime(source.lastModified)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// ==========================================
// Sub-Components
// ==========================================

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}> = ({ icon, label, value, sub, color }) => {
  const c = METRIC_COLORS[color] || METRIC_COLORS.cyan;
  return (
    <div
      className="p-3 rounded-xl border"
      style={{ background: c.bg, borderColor: c.border }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: c.text }}>{icon}</span>
        <span className="text-[10px] font-mono text-slate-500 uppercase">{label}</span>
      </div>
      <div className="text-xl font-mono" style={{ color: c.text }}>{value}</div>
      <div className="text-[9px] font-mono text-slate-600 mt-0.5">{sub}</div>
    </div>
  );
};

const QualityBar: React.FC<{ score: number }> = ({ score }) => {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-slate-800">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-mono text-white">{pct}%</span>
    </div>
  );
};

const FormatBadge: React.FC<{ format: string; count: number; total: number }> = ({ format, count, total }) => {
  const pct = total > 0 ? (count / total * 100).toFixed(1) : '0';
  const colors: Record<string, string> = {
    md: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ts: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    tsx: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    json: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    sql: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    css: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    txt: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  const colorClass = colors[format] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <span className={cn("text-[11px] font-mono px-2.5 py-1 rounded-lg border flex items-center gap-1.5", colorClass)}>
      .{format}
      <span className="opacity-50">{count}</span>
      <span className="opacity-30">({pct}%)</span>
    </span>
  );
};