/**
 * file: knowledge-base.ts
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
 * YYC³ AI Knowledge Base — Core Orchestrator (知识长河·万象归元)
 * 
 * "从被动存储到主动服务的知识管理范式升级"
 * 
 * Integrates all 6 knowledge base modules:
 *   M1: FileProcessor    — 本地文件智能管理 (20+格式, OCR, 转写, 智能分类)
 *   M2: VectorSearch     — 语义穿透检索 (混合检索, 知识简报, 溯源)
 *   M3: SyncEngine       — 实时知识协同 (文件监听, 外部源, 去重, 冲突)
 *   M4: CreationEngine   — 创作加速引擎 (素材提取, 风格生成, RAG增强)
 *   M5: PushService      — 主动知识推送 (场景推荐, 订阅, 冲突预警)
 *   M6: KnowledgeGraph   — 知识图谱 (实体识别, 关系抽取, 可视化)
 * 
 * The Knowledge Base enriches every agent_call with contextual information,
 * making family members aware of project docs, codebase, and history.
 */

import { kb as kbConfig, llm as llmConfig } from "./config";
import { FileProcessor, smartChunkDocument, detectFormat, detectModality } from "./kb-file-processor";
import { KnowledgeGraph } from "./kb-knowledge-graph";
import { SyncEngine } from "./kb-sync-engine";
import type {
  KBEntityId, DocumentChunk, SearchResult, SearchQuery,
  KnowledgeBrief, KBFullStats, FileProcessingResult,
  ContentGenerationRequest, ContentGenerationResult,
  GraphVisualization, GraphQuery,
} from "./kb-types";

// ==========================================
// Ollama API Response Types
// ==========================================
interface OllamaEmbedResponse {
  embeddings?: number[][];
}

interface OllamaEmbeddingsResponse {
  embedding?: number[];
}

interface OllamaTagsResponse {
  models?: { name: string }[];
}

interface OpenAIEmbeddingData {
  embedding?: number[];
}

interface OpenAIEmbedResponse {
  data?: OpenAIEmbeddingData[];
}

// ==========================================
// In-Memory Vector Store (enhanced)
// ==========================================
class VectorStore {
  private chunks: DocumentChunk[] = [];
  private searchCount = 0;
  private totalSearchLatency = 0;

  async upsert(chunk: DocumentChunk): Promise<void> {
    const existing = this.chunks.findIndex(c => c.id === chunk.id);
    if (existing >= 0) {
      this.chunks[existing] = chunk;
    } else {
      this.chunks.push(chunk);
    }
  }

  async search(queryEmbedding: number[], topK: number, threshold: number): Promise<SearchResult[]> {
    const start = Date.now();
    const results: SearchResult[] = [];

    for (const chunk of this.chunks) {
      if (!chunk.embedding) continue;
      const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      if (similarity >= threshold) {
        results.push({
          chunk,
          similarity,
          relevanceScore: similarity,
          highlights: [],
        });
      }
    }

    const sorted = results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);

    this.searchCount++;
    this.totalSearchLatency += Date.now() - start;

    return sorted;
  }

  async hybridSearch(
    queryEmbedding: number[],
    queryText: string,
    topK: number,
    threshold: number,
    boostRecent: boolean = false,
    boostFrequent: boolean = false,
  ): Promise<SearchResult[]> {
    const start = Date.now();
    const queryTerms = queryText.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    const results: SearchResult[] = [];

    for (const chunk of this.chunks) {
      // Semantic score
      let semanticScore = 0;
      if (chunk.embedding) {
        semanticScore = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      }

      // Keyword score (BM25-like)
      const contentLower = chunk.content.toLowerCase();
      let keywordHits = 0;
      const highlights: SearchResult["highlights"] = [];

      for (const term of queryTerms) {
        const idx = contentLower.indexOf(term);
        if (idx >= 0) {
          keywordHits++;
          highlights.push({
            text: chunk.content.substring(idx, idx + term.length),
            startOffset: idx,
            endOffset: idx + term.length,
            matchType: "exact",
          });
        }
      }
      const keywordScore = queryTerms.length > 0 ? keywordHits / queryTerms.length : 0;

      // Combined score (70% semantic + 30% keyword)
      let relevanceScore = semanticScore * 0.7 + keywordScore * 0.3;

      // Recency boost
      if (boostRecent) {
        const ageMs = Date.now() - chunk.metadata.updatedAt;
        const recencyBoost = Math.max(0, 1 - ageMs / (30 * 86400000)); // Decay over 30 days
        relevanceScore += recencyBoost * 0.1;
      }

      if (relevanceScore >= threshold * 0.7) { // Lower threshold for hybrid
        results.push({
          chunk,
          similarity: semanticScore,
          relevanceScore,
          highlights,
          sourcePreview: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? "..." : ""),
        });
      }
    }

    const sorted = results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, topK);

    this.searchCount++;
    this.totalSearchLatency += Date.now() - start;

    return sorted;
  }

  getAllChunks(): DocumentChunk[] {
    return [...this.chunks];
  }

  async remove(chunkId: KBEntityId): Promise<boolean> {
    const idx = this.chunks.findIndex(c => c.id === chunkId);
    if (idx >= 0) {
      this.chunks.splice(idx, 1);
      return true;
    }
    return false;
  }

  async clear(): Promise<void> {
    this.chunks = [];
  }

  get size(): number { return this.chunks.length; }

  get avgSearchLatency(): number {
    return this.searchCount > 0 ? this.totalSearchLatency / this.searchCount : 0;
  }

  get totalSearches(): number { return this.searchCount; }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }
}

// ==========================================
// Embedding Providers (v2 — Production-Grade)
// ==========================================

/** Runtime embedding state — tracks provider health & auto-detected dimensions */
const embeddingState = {
  /** Actually resolved dimensions (auto-detected on first call) */
  resolvedDimensions: 0,
  /** Provider that was used to generate current embeddings */
  activeProvider: "" as string,
  /** Total embedding calls made */
  callCount: 0,
  /** Total embedding errors */
  errorCount: 0,
  /** Whether Ollama embedding model is confirmed available */
  ollamaModelVerified: false,
  /** Ollama API version: "new" = /api/embed, "legacy" = /api/embeddings */
  ollamaApiVersion: "new" as "new" | "legacy",
};

/**
 * Get effective embedding dimensions for current provider.
 * If KB_EMBEDDING_DIMENSIONS is set (non-zero), use that.
 * Otherwise, use per-provider defaults.
 */
function getEffectiveDimensions(): number {
  if (embeddingState.resolvedDimensions > 0) return embeddingState.resolvedDimensions;
  if (kbConfig.embedding.dimensions > 0) return kbConfig.embedding.dimensions;
  return kbConfig.embedding.defaultDimensions[kbConfig.embedding.provider] ?? 512;
}

/**
 * Validate Ollama has the embedding model available.
 * Called once on startup when provider=ollama.
 */
async function validateOllamaEmbeddingModel(): Promise<boolean> {
  const model = kbConfig.embedding.ollamaModel;
  const baseUrl = llmConfig.ollama.baseUrl;

  try {
    // Check if model exists via Ollama API
    const res = await fetch(`${baseUrl}/api/show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: model }),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      console.log(`[KB:Embed] ✓ Ollama model "${model}" verified available`);
      embeddingState.ollamaModelVerified = true;
      return true;
    }

    console.warn(`[KB:Embed] ✗ Ollama model "${model}" not found! Run: ollama pull ${model}`);
    return false;
  } catch (err: unknown) {
    const error = err as Error;
    console.warn(`[KB:Embed] ✗ Cannot reach Ollama at ${baseUrl}: ${error.message}`);
    console.warn(`[KB:Embed]   Falling back to local TF-IDF embedding`);
    return false;
  }
}

/**
 * Call Ollama embedding API (new /api/embed endpoint, with /api/embeddings fallback)
 */
async function callOllamaEmbed(text: string): Promise<number[] | null> {
  const model = kbConfig.embedding.ollamaModel;
  const baseUrl = llmConfig.ollama.baseUrl;
  const input = text.substring(0, 8192); // nomic-embed-text max context

  // Try new API first (/api/embed — Ollama >= 0.1.44)
  if (embeddingState.ollamaApiVersion === "new") {
    try {
      const res = await fetch(`${baseUrl}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, input }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data: OllamaEmbedResponse = await res.json();
        if (data.embeddings && data.embeddings[0] && data.embeddings[0].length > 0) {
          return data.embeddings[0];
        }
      }

      // If new API returns 404, fallback to legacy
      if (res.status === 404) {
        console.log(`[KB:Embed] Ollama /api/embed not available, using legacy /api/embeddings`);
        embeddingState.ollamaApiVersion = "legacy";
      }
    } catch {
      // Network error on new API, try legacy
      embeddingState.ollamaApiVersion = "legacy";
    }
  }

  // Legacy API fallback (/api/embeddings)
  try {
    const res = await fetch(`${baseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: input }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data: OllamaEmbeddingsResponse = await res.json();
      if (data.embedding && data.embedding.length > 0) {
        return data.embedding;
      }
    }
  } catch {
    // Both APIs failed
  }

  return null;
}

/**
 * Core embedding function — routes to the configured provider
 * with graceful fallback to local TF-IDF on any failure.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const provider = kbConfig.embedding.provider;
  const dims = getEffectiveDimensions();

  embeddingState.callCount++;

  switch (provider) {
    case "openai": {
      if (!llmConfig.openai.apiKey) return simpleHashEmbedding(text, dims);
      try {
        const response = await fetch(`${llmConfig.openai.baseUrl}/embeddings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${llmConfig.openai.apiKey}`,
          },
          body: JSON.stringify({ input: text.substring(0, 8000), model: kbConfig.embedding.model }),
        });
        const data: OpenAIEmbedResponse = await response.json();
        const dataArray = data.data;
        const embedding = dataArray && dataArray[0] && dataArray[0].embedding;
        if (embedding && embedding.length > 0) {
          // Auto-detect dimensions from first successful call
          if (embeddingState.resolvedDimensions === 0) {
            embeddingState.resolvedDimensions = embedding.length;
            embeddingState.activeProvider = "openai";
            console.log(`[KB:Embed] OpenAI dimensions auto-detected: ${embedding.length}`);
          }
          return embedding;
        }
        return simpleHashEmbedding(text, dims);
      } catch {
        embeddingState.errorCount++;
        return simpleHashEmbedding(text, dims);
      }
    }

    case "ollama": {
      // Validate model on first call if not yet verified
      if (!embeddingState.ollamaModelVerified) {
        const available = await validateOllamaEmbeddingModel();
        if (!available) {
          // Permanent fallback to local for this session
          console.warn(`[KB:Embed] Ollama embedding unavailable — using local TF-IDF for this session`);
          return simpleHashEmbedding(text, dims);
        }
      }

      const embedding = await callOllamaEmbed(text);
      if (embedding) {
        // Auto-detect dimensions from first successful call
        if (embeddingState.resolvedDimensions === 0) {
          embeddingState.resolvedDimensions = embedding.length;
          embeddingState.activeProvider = "ollama";
          console.log(`[KB:Embed] Ollama (${kbConfig.embedding.ollamaModel}) dimensions auto-detected: ${embedding.length}`);
        }
        return embedding;
      }

      embeddingState.errorCount++;
      return simpleHashEmbedding(text, dims);
    }

    default:
      // "local" provider — deterministic TF-IDF hash embedding
      if (embeddingState.resolvedDimensions === 0) {
        embeddingState.resolvedDimensions = dims;
        embeddingState.activeProvider = "local";
      }
      return simpleHashEmbedding(text, dims);
  }
}

/**
 * Batch embedding — efficient for bulk indexing.
 * For Ollama, uses single-call batch via /api/embed.
 * For others, runs in parallel with concurrency limit.
 */
async function generateEmbeddingBatch(texts: string[], concurrency: number = 5): Promise<number[][]> {
  const provider = kbConfig.embedding.provider;

  // Ollama new API supports batch natively
  if (provider === "ollama" && embeddingState.ollamaApiVersion === "new" && embeddingState.ollamaModelVerified) {
    try {
      const res = await fetch(`${llmConfig.ollama.baseUrl}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: kbConfig.embedding.ollamaModel,
          input: texts.map(t => t.substring(0, 8192)),
        }),
        signal: AbortSignal.timeout(60000), // Longer timeout for batch
      });

      if (res.ok) {
        const data: OllamaEmbedResponse = await res.json();
        if (data.embeddings?.length === texts.length) {
          if (embeddingState.resolvedDimensions === 0 && data.embeddings[0]) {
            embeddingState.resolvedDimensions = data.embeddings[0].length;
            embeddingState.activeProvider = "ollama";
            console.log(`[KB:Embed] Ollama batch dimensions: ${data.embeddings[0].length}`);
          }
          return data.embeddings;
        }
      }
    } catch {
      // Fallback to sequential
    }
  }

  // Sequential with concurrency limit for other providers
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += concurrency) {
    const batch = texts.slice(i, i + concurrency);
    const embeddings = await Promise.all(batch.map(t => generateEmbedding(t)));
    results.push(...embeddings);
  }
  return results;
}

function simpleHashEmbedding(text: string, dimensions: number): number[] {
  const vec = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase().replace(/\s+/g, " ");
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    vec[(code * (i + 1) * 31) % dimensions] += 1;
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return mag > 0 ? vec.map(v => v / mag) : vec;
}

/** Get current embedding provider status (for /api/kb/stats) */
export function getEmbeddingStatus() {
  return {
    provider: kbConfig.embedding.provider,
    activeProvider: embeddingState.activeProvider || kbConfig.embedding.provider,
    model: kbConfig.embedding.provider === "ollama"
      ? kbConfig.embedding.ollamaModel
      : kbConfig.embedding.model,
    dimensions: embeddingState.resolvedDimensions || getEffectiveDimensions(),
    autoDetected: embeddingState.resolvedDimensions > 0,
    totalCalls: embeddingState.callCount,
    totalErrors: embeddingState.errorCount,
    errorRate: embeddingState.callCount > 0
      ? (embeddingState.errorCount / embeddingState.callCount * 100).toFixed(1) + "%"
      : "0%",
    ollamaModelVerified: kbConfig.embedding.provider === "ollama"
      ? embeddingState.ollamaModelVerified
      : undefined,
  };
}

// ==========================================
// Main Knowledge Base (Orchestrator)
// ==========================================
export class KnowledgeBase {
  // Sub-modules
  readonly fileProcessor: FileProcessor;
  readonly graph: KnowledgeGraph;
  readonly sync: SyncEngine;

  // Core storage
  private store: VectorStore;
  private indexedSources: Map<string, { chunks: number; lastModified: number; fileId?: KBEntityId }> = new Map();
  private fileMetadata: Map<KBEntityId, FileProcessingResult> = new Map();
  private indexTimer: ReturnType<typeof setInterval> | null = null;

  // Search analytics (自学习)
  private searchQueryLog: { query: string; count: number; lastSearched: number }[] = [];

  constructor() {
    this.store = new VectorStore();
    this.fileProcessor = new FileProcessor();
    this.graph = new KnowledgeGraph();
    this.sync = new SyncEngine();

    if (!kbConfig.enabled) {
      console.log("[KB] Knowledge base disabled");
      return;
    }

    console.log(`[KB] Initialized: vectorDb=${kbConfig.vectorDb} | embedding=${kbConfig.embedding.provider}(${kbConfig.embedding.model}) | chunkSize=${kbConfig.rag.chunkSize}`);
    console.log(`[KB] Modules: FileProcessor + VectorSearch + SyncEngine + KnowledgeGraph + PushService`);

    // Wire up file watcher → auto-ingest
    this.sync.fileWatcher.onFileChange(async (event) => {
      if (event.type === "delete") {
        await this.removeSource(event.path);
      } else {
        await this.indexFile(event.path);
      }
    });

    // Start auto-indexing
    if (kbConfig.autoIndex.enabled) {
      this.startAutoIndex();
    }
  }

  // ==========================================
  // M1: Document Ingestion (Enhanced)
  // ==========================================

  /**
   * Index a file through the full AI processing pipeline:
   *   Detect → Extract → Analyze → Chunk → Embed → Graph → Store
   */
  async indexFile(filePath: string): Promise<number> {
    try {
      // Run full AI processing pipeline
      const result = await this.fileProcessor.processFile(filePath);
      if (!result || result.chunks.length === 0) return 0;

      // Store file metadata
      this.fileMetadata.set(result.fileId, result);

      // Generate embeddings and store chunks
      for (const chunk of result.chunks) {
        chunk.embedding = await generateEmbedding(chunk.content);
        chunk.embeddingModel = kbConfig.embedding.model;
        chunk.embeddingUpdatedAt = Date.now();
        await this.store.upsert(chunk);

        // Register for deduplication
        const hash = await this.hashContent(chunk.content);
        this.sync.dedup.register(chunk.id, hash);
      }

      // Ingest entities & relations into knowledge graph
      if (result.entities.length > 0 || result.relations.length > 0) {
        const graphResult = this.graph.ingestFromExtraction(
          result.entities, result.relations, result.fileId,
        );
        console.log(`[KB] Graph enriched: +${graphResult.nodesCreated} nodes, +${graphResult.edgesCreated} edges`);
      }

      // Record access for push service
      this.sync.push.recordAccess(filePath);

      this.indexedSources.set(filePath, {
        chunks: result.chunks.length,
        lastModified: Date.now(),
        fileId: result.fileId,
      });

      console.log(`[KB] Indexed: ${filePath} → ${result.chunks.length} chunks, ${result.entities.length} entities (${result.processingTimeMs}ms)`);
      return result.chunks.length;

    } catch (err: unknown) {
      const error = err as Error;
      console.warn(`[KB] Failed to index ${filePath}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Index raw text content (for manual input, clipboard, API data)
   */
  async indexDocument(source: string, content: string, sourceType: string = "manual_input"): Promise<number> {
    const format = detectFormat(source);
    const chunks = smartChunkDocument(content, source, format, kbConfig.rag.chunkSize, kbConfig.rag.chunkOverlap);

    for (const chunk of chunks) {
      chunk.sourceType = sourceType as 'local_file' | 'local_directory' | 'manual_input' | 'external_api' | 'web_crawl' | 'clipboard' | 'ocr_scan';
      chunk.embedding = await generateEmbedding(chunk.content);
      chunk.embeddingModel = kbConfig.embedding.model;
      chunk.embeddingUpdatedAt = Date.now();
      await this.store.upsert(chunk);
    }

    this.indexedSources.set(source, { chunks: chunks.length, lastModified: Date.now() });
    console.log(`[KB] Indexed document: ${source} → ${chunks.length} chunks`);
    return chunks.length;
  }

  /**
   * Index a directory recursively
   */
  async indexDirectory(dirPath: string): Promise<number> {
    let totalChunks = 0;
    const extensions = [".md", ".txt", ".ts", ".tsx", ".js", ".json", ".py", ".yaml", ".html", ".css", ".sql"];

    try {
      const glob = new Bun.Glob(`**/*{${extensions.join(",")}}`);
      for await (const file of glob.scan({ cwd: dirPath, absolute: true })) {
        // Skip ignored paths
        if (file.includes("node_modules") || file.includes(".git") || file.includes("dist")) continue;
        totalChunks += await this.indexFile(file);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.warn(`[KB] Failed to scan directory ${dirPath}: ${error.message}`);
    }

    return totalChunks;
  }

  /**
   * Remove a source and all its chunks
   */
  async removeSource(source: string): Promise<number> {
    const allChunks = this.store.getAllChunks();
    let removed = 0;
    for (const chunk of allChunks) {
      if (chunk.source === source) {
        await this.store.remove(chunk.id);
        removed++;
      }
    }
    this.indexedSources.delete(source);
    if (removed > 0) console.log(`[KB] Removed source: ${source} (${removed} chunks)`);
    return removed;
  }

  // ==========================================
  // M2: Semantic Penetration Search
  // ==========================================

  /**
   * Basic semantic search
   */
  async search(query: string, topK?: number, threshold?: number): Promise<SearchResult[]> {
    const queryEmbedding = await generateEmbedding(query);
    this.logSearchQuery(query);
    return this.store.search(
      queryEmbedding,
      topK ?? kbConfig.rag.topK,
      threshold ?? kbConfig.rag.similarityThreshold,
    );
  }

  /**
   * Advanced hybrid search (semantic + keyword + filters)
   * "自然语言直搜" + "结果精准呈现"
   */
  async advancedSearch(query: SearchQuery): Promise<{
    results: SearchResult[];
    totalMatches: number;
    searchTimeMs: number;
    relatedSuggestions: string[];
  }> {
    const start = Date.now();
    const queryEmbedding = await generateEmbedding(query.text);

    this.logSearchQuery(query.text);

    // Hybrid search
    let results = await this.store.hybridSearch(
      queryEmbedding,
      query.text,
      query.topK ?? kbConfig.rag.topK,
      query.similarityThreshold ?? kbConfig.rag.similarityThreshold,
      query.boostRecent,
      query.boostFrequent,
    );

    // Apply filters
    if (query.filters) {
      results = results.filter(r => {
        if (query.filters!.formats && !query.filters!.formats.includes(r.chunk.metadata.format as any)) return false;
        if (query.filters!.sourceTypes && !query.filters!.sourceTypes.includes(r.chunk.sourceType)) return false;
        if (query.filters!.dateRange) {
          if (query.filters!.dateRange.from && r.chunk.metadata.updatedAt < query.filters!.dateRange.from) return false;
          if (query.filters!.dateRange.to && r.chunk.metadata.updatedAt > query.filters!.dateRange.to) return false;
        }
        if (query.filters!.qualityLevels && !query.filters!.qualityLevels.includes(r.chunk.qualityLevel)) return false;
        return true;
      });
    }

    // Add entity context if requested
    if (query.includeEntityContext) {
      for (const result of results) {
        const graphNode = this.graph.getVisualization(undefined, 1, 5);
        result.entityContext = [];
      }
    }

    // Generate related search suggestions
    const relatedSuggestions = this.generateRelatedSuggestions(query.text);

    return {
      results,
      totalMatches: results.length,
      searchTimeMs: Date.now() - start,
      relatedSuggestions,
    };
  }

  /**
   * Generate a Knowledge Brief from search results
   * "一键生成知识简报"
   */
  async generateBrief(query: string, maxSections: number = 5): Promise<KnowledgeBrief> {
    const results = await this.search(query, maxSections * 2);

    const sections = results.slice(0, maxSections).map((r, i) => ({
      heading: r.chunk.metadata.section || `相关知识 #${i + 1}`,
      content: r.chunk.content.substring(0, 500),
      sources: [{
        name: r.chunk.source.split("/").pop() || r.chunk.source,
        path: r.chunk.source,
        relevance: r.similarity,
      }],
    }));

    return {
      id: `brief:${crypto.randomUUID().substring(0, 8)}`,
      title: `知识简报: ${query}`,
      summary: `基于"${query}"在知识库中检索到${results.length}条相关知识，整理为${sections.length}个部分。`,
      sections,
      generatedAt: Date.now(),
      format: "markdown",
      totalSources: results.length,
    };
  }

  // ==========================================
  // M4: RAG & Creation Engine
  // ==========================================

  /**
   * RAG: Augment a prompt with relevant knowledge context
   * Used automatically in every agent_call
   */
  async augmentPrompt(prompt: string, maxChunks: number = 3): Promise<string> {
    if (!kbConfig.enabled || this.store.size === 0) return prompt;

    const results = await this.search(prompt, maxChunks);
    if (results.length === 0) return prompt;

    const context = results
      .map((r, i) => `[知识库 ${i + 1}] (${r.chunk.source.split("/").pop()}, 相似度: ${(r.similarity * 100).toFixed(1)}%)\n${r.chunk.content.substring(0, 300)}`)
      .join("\n\n");

    return `以下是从知识库中检索到的相关上下文：\n\n${context}\n\n---\n\n用户问题：${prompt}`;
  }

  /**
   * Extract materials for content creation
   * "素材一键提取"
   */
  async extractMaterials(topic: string, maxMaterials: number = 10): Promise<{
    materials: { type: string; content: string; source: string; relevance: number }[];
    graph: GraphVisualization;
  }> {
    const results = await this.search(topic, maxMaterials);

    const materials = results.map(r => ({
      type: r.chunk.metadata.format === "xlsx" || r.chunk.metadata.format === "csv" ? "data_table" : "text_snippet",
      content: r.chunk.content.substring(0, 500),
      source: r.chunk.source,
      relevance: r.similarity,
    }));

    // Get related knowledge graph subgraph
    const topEntity = this.graph.getVisualization(undefined, 1, 20);

    return { materials, graph: topEntity };
  }

  /**
   * Generate content with RAG enhancement
   * "创作加速引擎"
   */
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    const start = Date.now();

    // 1. Find relevant materials
    const searchQuery = request.materialHints?.join(" ") || request.topic;
    const results = await this.search(searchQuery, 5);

    const materials = results.map(r => ({
      id: r.chunk.id,
      type: "text_snippet" as const,
      content: r.chunk.content.substring(0, 300),
      source: r.chunk.source,
      relevanceScore: r.similarity,
      metadata: {
        title: r.chunk.metadata.section,
      },
    }));

    const references = results.map(r => ({
      source: r.chunk.source,
      snippet: r.chunk.content.substring(0, 100),
      relevance: r.similarity,
    }));

    // 2. Build augmented prompt (would call LLM in production)
    let content = "";
    switch (request.type) {
      case "summary":
        content = `## ${request.topic} 摘要\n\n`;
        for (const m of materials.slice(0, 3)) {
          content += `- ${m.content.substring(0, 150)}\n`;
        }
        content += `\n来源: ${materials.length}个相关文档`;
        break;

      case "outline":
        content = `## ${request.topic} 大纲\n\n`;
        content += `1. 背景概述\n2. 核心内容\n3. 关键数据\n4. 分析与建议\n5. 总结\n\n`;
        content += `[基于${materials.length}个知识库文档生成]`;
        break;

      case "continuation":
        content = request.context || "";
        content += `\n\n基于知识库分析，以下是可能的延续内容：\n`;
        for (const m of materials.slice(0, 2)) {
          content += `\n${m.content.substring(0, 200)}`;
        }
        break;

      case "brief":
        const brief = await this.generateBrief(request.topic);
        content = `# ${brief.title}\n\n${brief.summary}\n\n`;
        for (const section of brief.sections) {
          content += `## ${section.heading}\n${section.content}\n\n`;
        }
        break;

      default:
        content = `## ${request.topic}\n\n[Draft generated from ${materials.length} knowledge base sources]`;
    }

    // 3. Check for duplicate content
    const duplicateWarnings: ContentGenerationResult["duplicateWarnings"] = [];
    const nearDups = this.sync.dedup.findNearDuplicates(content, this.store.getAllChunks().slice(0, 100), 0.6);
    for (const dup of nearDups.slice(0, 3)) {
      const chunk = this.store.getAllChunks().find(c => c.id === dup.chunkId);
      if (chunk) {
        duplicateWarnings.push({
          existingSource: chunk.source,
          overlap: Math.round(dup.similarity * 100),
        });
      }
    }

    return {
      content,
      format: request.format,
      materials,
      references,
      suggestions: [
        "可以添加具体数据支撑论点",
        "建议引用知识图谱中的关联实体丰富内容",
        "检查是否有更新的外部知识源可供参考",
      ],
      duplicateWarnings: duplicateWarnings.length > 0 ? duplicateWarnings : undefined,
      generatedAt: Date.now(),
      model: "local-rag",
      tokenUsage: undefined,
    };
  }

  // ==========================================
  // M6: Knowledge Graph (delegated)
  // ==========================================

  getGraphVisualization(centerNodeId?: KBEntityId, depth?: number, limit?: number): GraphVisualization {
    return this.graph.getVisualization(centerNodeId, depth, limit);
  }

  queryGraph(query: GraphQuery) {
    return this.graph.traverse(query);
  }

  // ==========================================
  // M5: Recommendations & Push (delegated)
  // ==========================================

  getRecommendations(currentActivity: string): ReturnType<typeof this.sync.push.generateRecommendations> {
    const recentChunks = this.store.getAllChunks().slice(-20);
    return this.sync.push.generateRecommendations(currentActivity, recentChunks, this.store.getAllChunks());
  }

  generateDigest(period: "daily" | "weekly") {
    return this.sync.push.generateDigest(period, this.store.getAllChunks());
  }

  // ==========================================
  // Statistics
  // ==========================================

  getStats(): KBFullStats {
    const allChunks = this.store.getAllChunks();
    const graphStats = this.graph.getStats();

    // Count by modality
    const byModality: Record<string, number> = {};
    const byFormat: Record<string, number> = {};
    let totalSize = 0;

    for (const chunk of allChunks) {
      const mod = chunk.metadata.format ? detectModality(chunk.metadata.format as any) : "text";
      byModality[mod] = (byModality[mod] || 0) + 1;
      if (chunk.metadata.format) {
        byFormat[chunk.metadata.format] = (byFormat[chunk.metadata.format] || 0) + 1;
      }
      totalSize += chunk.content.length;
    }

    return {
      totalDocuments: this.indexedSources.size,
      totalChunks: this.store.size,
      totalSizeBytes: totalSize,
      vectorDimensions: embeddingState.resolvedDimensions || getEffectiveDimensions(),
      byModality: byModality as any,
      byFormat: byFormat as any,
      totalSearches: this.store.totalSearches,
      avgSearchLatencyMs: Math.round(this.store.avgSearchLatency),
      graphNodes: graphStats.totalNodes,
      graphEdges: graphStats.totalEdges,
      graphDensity: graphStats.density,
      externalSources: this.sync.listExternalSources().length,
      lastSyncAt: Math.max(...this.sync.listExternalSources().map(s => s.lastSyncAt || 0), 0),
      conflictsUnresolved: this.sync.conflicts.getUnresolvedConflicts().length,
      duplicatesDetected: this.sync.dedup.runDeduplication().totalDuplicatesFound,
      avgQualityScore: allChunks.length > 0
        ? allChunks.reduce((sum, c) => sum + (c.credibilityScore || 0.5), 0) / allChunks.length
        : 0,
      topAccessedDocuments: this.sync.push.getUserPreferences().slice(0, 10).map(p => ({
        source: p.source, count: p.count,
      })),
      topSearchQueries: this.searchQueryLog.slice(0, 10),
      userPreferences: [],
      lastIndexedAt: Math.max(...Array.from(this.indexedSources.values()).map(s => s.lastModified), 0),
      indexedSources: Array.from(this.indexedSources.entries()).map(([path, info]) => ({
        path, chunks: info.chunks, lastModified: info.lastModified,
      })),
      uptime: process.uptime ? process.uptime() * 1000 : 0,
    };
  }

  // ==========================================
  // Auto-Index & Lifecycle
  // ==========================================

  private startAutoIndex(): void {
    setTimeout(() => this.runAutoIndex(), 2000);
    this.indexTimer = setInterval(() => this.runAutoIndex(), kbConfig.autoIndex.interval);
  }

  private async runAutoIndex(): Promise<void> {
    let totalChunks = 0;
    for (const source of kbConfig.docSources) {
      try {
        const path = require("path").resolve(source);
        const fileExists = await Bun.file(path).exists().catch(() => false);

        if (fileExists) {
          totalChunks += await this.indexFile(path);
        } else {
          totalChunks += await this.indexDirectory(path);
        }
      } catch {
        // Silent fail for non-existent sources
      }
    }

    if (totalChunks > 0) {
      console.log(`[KB] Auto-index: ${totalChunks} chunks across ${this.indexedSources.size} sources`);
    }
  }

  private logSearchQuery(query: string): void {
    const existing = this.searchQueryLog.find(q => q.query === query);
    if (existing) {
      existing.count++;
      existing.lastSearched = Date.now();
    } else {
      this.searchQueryLog.push({ query, count: 1, lastSearched: Date.now() });
      // Keep only top 100
      if (this.searchQueryLog.length > 100) {
        this.searchQueryLog.sort((a, b) => b.count - a.count);
        this.searchQueryLog = this.searchQueryLog.slice(0, 100);
      }
    }
  }

  private generateRelatedSuggestions(query: string): string[] {
    // Find similar past queries
    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();
    for (const log of this.searchQueryLog) {
      if (log.query.toLowerCase() !== queryLower && log.query.toLowerCase().includes(queryLower.split(" ")[0])) {
        suggestions.push(log.query);
      }
    }
    return suggestions.slice(0, 5);
  }

  private async hashContent(content: string): Promise<string> {
    const data = new TextEncoder().encode(content);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
  }

  destroy(): void {
    if (this.indexTimer) { clearInterval(this.indexTimer); this.indexTimer = null; }
    this.sync.destroy();
  }
}

// Singleton
let _kb: KnowledgeBase | null = null;
export function getKnowledgeBase(): KnowledgeBase {
  if (!_kb) { _kb = new KnowledgeBase(); }
  return _kb;
}