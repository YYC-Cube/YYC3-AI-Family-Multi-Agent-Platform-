/**
 * file: kb-types.ts
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
 * YYC³ AI Knowledge Base - Complete Type System (知识长河·万象类型)
 * 
 * Defines all types for the 6 knowledge base modules:
 *   M1: Local File Intelligent Management (本地文件智能管理)
 *   M2: Semantic Penetration Search (语义穿透检索)
 *   M3: Real-time Knowledge Sync (实时知识协同)
 *   M4: Creation Acceleration Engine (创作加速引擎)
 *   M5: Proactive Knowledge Push (主动知识推送)
 *   M6: Knowledge Graph (知识图谱)
 */

// ==========================================
// M0: Core / Shared Types
// ==========================================

/** Unique identifier for any knowledge entity */
export type KBEntityId = string;

/** Supported file formats — "全格式通吃" */
export type FileFormat =
  // Documents
  | "md" | "txt" | "pdf" | "docx" | "doc" | "xlsx" | "xls" | "csv"
  | "pptx" | "html" | "xml" | "json" | "yaml" | "toml"
  // Code
  | "ts" | "tsx" | "js" | "jsx" | "py" | "go" | "rs" | "java" | "css" | "sql"
  // Images (OCR)
  | "png" | "jpg" | "jpeg" | "gif" | "webp" | "svg" | "bmp" | "tiff"
  // Audio/Video (transcription)
  | "mp3" | "wav" | "m4a" | "ogg" | "mp4" | "webm" | "mkv"
  // Archives
  | "zip" | "tar" | "gz"
  // Other
  | "unknown";

/** Knowledge source type */
export type SourceType = "local_file" | "local_directory" | "manual_input" | "external_api" | "web_crawl" | "clipboard" | "ocr_scan";

/** Processing status for any async operation */
export type ProcessingStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";

/** Content modality */
export type ContentModality = "text" | "image" | "audio" | "video" | "structured_data" | "code" | "mixed";

/** Knowledge quality level */
export type QualityLevel = "authoritative" | "verified" | "unverified" | "outdated" | "deprecated";

// ==========================================
// M1: Local File Intelligent Management
// ==========================================

/** Metadata extracted from a file via AI analysis */
export interface FileMetadata {
  id: KBEntityId;
  filename: string;
  path: string;
  format: FileFormat;
  modality: ContentModality;
  sizeBytes: number;
  mimeType: string;

  // AI-extracted metadata
  title?: string;
  summary?: string;              // 100-char AI-generated summary
  keywords: string[];            // Extracted keywords
  entities: ExtractedEntity[];   // Named entities (people, orgs, dates, etc.)
  language: string;              // Detected language (zh/en/mixed)
  category: FileCategory;        // AI-classified category
  tags: string[];                // Auto-generated + user tags
  sentiment?: "positive" | "neutral" | "negative";

  // Temporal
  createdAt: number;
  modifiedAt: number;
  indexedAt: number;
  lastAccessedAt?: number;
  accessCount: number;

  // Version tracking
  version: number;
  previousVersionId?: KBEntityId;
  contentHash: string;           // SHA-256 of raw content

  // Processing state
  processingStatus: ProcessingStatus;
  processingError?: string;
  ocrApplied: boolean;
  transcriptionApplied: boolean;
}

/** Three-level file category — "智能分类" */
export interface FileCategory {
  level1: string;  // e.g., "工作", "学习", "个人"
  level2: string;  // e.g., "项目A", "课程笔记", "日记"
  level3: string;  // e.g., "预算文档", "第三章", "2024年"
  confidence: number; // 0-1, classification confidence
  isManualOverride: boolean;
}

/** Named entity extracted from content */
export interface ExtractedEntity {
  text: string;
  type: EntityType;
  startOffset: number;
  endOffset: number;
  confidence: number;
  normalizedValue?: string;  // e.g., date → ISO format
  linkedGraphNodeId?: KBEntityId;
}

export type EntityType =
  | "PERSON" | "ORGANIZATION" | "LOCATION" | "DATE" | "TIME"
  | "MONEY" | "PERCENTAGE" | "EMAIL" | "PHONE" | "URL"
  | "PRODUCT" | "TECHNOLOGY" | "EVENT" | "PROJECT"
  | "CODE_SYMBOL" | "FILE_PATH" | "VERSION" | "CUSTOM";

/** File processing result from the ingestion pipeline */
export interface FileProcessingResult {
  fileId: KBEntityId;
  metadata: FileMetadata;
  extractedText: string;
  chunks: DocumentChunk[];
  entities: ExtractedEntity[];
  relations: ExtractedRelation[];
  ocrResults?: OCRResult[];
  transcriptionResult?: TranscriptionResult;
  processingTimeMs: number;
}

/** OCR result from image analysis */
export interface OCRResult {
  text: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  pageNumber?: number;
  sceneTag?: string;  // "会议板书", "报销单据", "手写笔记"
}

/** Transcription result from audio/video */
export interface TranscriptionResult {
  fullText: string;
  segments: {
    startTime: number;   // seconds
    endTime: number;
    text: string;
    speaker?: string;
    confidence: number;
    isKeyPoint: boolean; // AI-detected key moment
    keyPointLabel?: string; // e.g., "项目截止日期"
  }[];
  language: string;
  duration: number;
}

// ==========================================
// M2: Semantic Penetration Search
// ==========================================

/** Document chunk — the atomic unit of knowledge */
export interface DocumentChunk {
  id: KBEntityId;
  content: string;
  source: string;
  sourceType: SourceType;
  chunkIndex: number;
  totalChunks: number;

  metadata: {
    title?: string;
    section?: string;
    language?: string;
    format?: FileFormat;
    pageNumber?: number;
    lineRange?: { start: number; end: number };
    createdAt: number;
    updatedAt: number;
  };

  // Vector representation
  embedding?: number[];
  embeddingModel?: string;
  embeddingUpdatedAt?: number;

  // Entity references
  entityIds: KBEntityId[];

  // Quality
  qualityLevel: QualityLevel;
  credibilityScore: number;  // 0-1
}

/** Search query with full options */
export interface SearchQuery {
  text: string;
  mode: "semantic" | "keyword" | "hybrid";

  // Filters
  filters?: {
    sourceTypes?: SourceType[];
    formats?: FileFormat[];
    dateRange?: { from?: number; to?: number };
    categories?: string[];
    tags?: string[];
    qualityLevels?: QualityLevel[];
    modalities?: ContentModality[];
    language?: string;
  };

  // Pagination & ranking
  topK?: number;
  offset?: number;
  similarityThreshold?: number;
  rerank?: boolean;

  // Advanced
  includeHighlights?: boolean;
  includeEntityContext?: boolean;
  includeRelated?: boolean;
  boostRecent?: boolean;      // Boost recently accessed/modified
  boostFrequent?: boolean;    // Boost frequently accessed (自学习)
}

/** Search result with rich metadata */
export interface SearchResult {
  chunk: DocumentChunk;
  similarity: number;
  relevanceScore: number;      // Combined score (semantic + keyword + recency + frequency)
  highlights: SearchHighlight[];
  relatedChunks?: DocumentChunk[];
  entityContext?: ExtractedEntity[];
  sourcePreview?: string;       // Preview of the surrounding content
}

export interface SearchHighlight {
  text: string;
  startOffset: number;
  endOffset: number;
  matchType: "exact" | "semantic" | "entity";
}

/** Knowledge brief — generated from search results */
export interface KnowledgeBrief {
  id: KBEntityId;
  title: string;
  summary: string;
  sections: {
    heading: string;
    content: string;
    sources: { name: string; path: string; relevance: number }[];
  }[];
  generatedAt: number;
  format: "markdown" | "html" | "plain";
  totalSources: number;
}

// ==========================================
// M3: Real-time Knowledge Sync
// ==========================================

/** External knowledge source configuration */
export interface ExternalSource {
  id: KBEntityId;
  name: string;
  type: "api" | "rss" | "webhook" | "file_share" | "database";
  endpoint: string;
  auth?: {
    type: "api_key" | "bearer" | "basic" | "oauth2";
    credentials: string; // Encrypted reference, never plain
  };

  // Sync schedule
  syncSchedule: "realtime" | "hourly" | "daily" | "weekly" | "manual";
  lastSyncAt?: number;
  nextSyncAt?: number;

  // Quality & trust
  credibility: "high" | "medium" | "low";
  categories: string[];

  enabled: boolean;
  syncStatus: ProcessingStatus;
  errorMessage?: string;
}

/** File system watch event */
export interface FSWatchEvent {
  type: "create" | "modify" | "delete" | "rename";
  path: string;
  oldPath?: string;  // For rename events
  timestamp: number;
  fileSize?: number;
}

/** Deduplication result */
export interface DeduplicationResult {
  duplicateGroups: {
    canonical: KBEntityId;   // The "best" version
    duplicates: {
      id: KBEntityId;
      similarity: number;
      reason: "exact_content" | "near_duplicate" | "superseded_version";
    }[];
  }[];
  totalDuplicatesFound: number;
  totalSpaceSavedBytes: number;
}

/** Knowledge conflict between local and external sources */
export interface KnowledgeConflict {
  id: KBEntityId;
  localChunkId: KBEntityId;
  externalChunkId: KBEntityId;
  localContent: string;
  externalContent: string;
  conflictType: "data_mismatch" | "version_newer" | "content_contradiction";
  severity: "low" | "medium" | "high";
  suggestedResolution: string;
  detectedAt: number;
  resolved: boolean;
  resolvedBy?: "user" | "auto";
}

// ==========================================
// M4: Creation Acceleration Engine
// ==========================================

/** Material extracted for content creation */
export interface CreationMaterial {
  id: KBEntityId;
  type: "text_snippet" | "data_table" | "chart_data" | "quote" | "reference" | "template";
  content: string;
  source: string;
  relevanceScore: number;
  metadata: {
    title?: string;
    dateRange?: string;
    dataType?: string;
  };
}

/** Content generation request */
export interface ContentGenerationRequest {
  type: "draft" | "summary" | "outline" | "continuation" | "rewrite" | "brief";
  topic: string;
  context?: string;          // Existing content to build upon
  style?: string;            // User's writing style profile
  format: "markdown" | "html" | "plain" | "email" | "report" | "memo";
  maxLength?: number;
  includeReferences?: boolean;
  language?: string;

  // Material hints
  materialHints?: string[];  // e.g., "项目A的成本数据", "2025年市场趋势"
  useMaterials?: KBEntityId[];
}

/** Content generation result */
export interface ContentGenerationResult {
  content: string;
  format: string;
  materials: CreationMaterial[];   // Materials used in generation
  references: { source: string; snippet: string; relevance: number }[];
  suggestions: string[];           // Further improvement suggestions
  duplicateWarnings?: { existingSource: string; overlap: number }[];
  generatedAt: number;
  model: string;
  tokenUsage?: { input: number; output: number };
}

/** User writing style profile (自学习) */
export interface WritingStyleProfile {
  userId: string;
  sampleCount: number;
  avgSentenceLength: number;
  vocabularyRichness: number;
  formalityLevel: number;       // 0-1 (casual → formal)
  preferredStructure: string;   // "bullet_points" | "paragraphs" | "mixed"
  commonPhrases: string[];
  topicPreferences: string[];
  updatedAt: number;
}

// ==========================================
// M5: Proactive Knowledge Push
// ==========================================

/** Knowledge subscription */
export interface KnowledgeSubscription {
  id: KBEntityId;
  topic: string;
  keywords: string[];
  categories: string[];
  schedule: "realtime" | "daily" | "weekly";
  format: "notification" | "email_digest" | "sidebar_card";
  enabled: boolean;
  createdAt: number;
  lastPushedAt?: number;
}

/** Context-aware push recommendation */
export interface KnowledgePush {
  id: KBEntityId;
  trigger: PushTrigger;
  recommendations: PushRecommendation[];
  context: string;
  generatedAt: number;
}

export type PushTrigger =
  | { type: "user_activity"; activity: string; file?: string }
  | { type: "schedule"; subscription: KBEntityId }
  | { type: "content_update"; source: string; changeType: string }
  | { type: "conflict_detected"; conflict: KBEntityId };

export interface PushRecommendation {
  type: "related_document" | "updated_data" | "conflict_alert" | "trending_topic" | "material_suggestion";
  title: string;
  summary: string;
  source: string;
  relevanceScore: number;
  actionUrl?: string;
  priority: "low" | "normal" | "high";
}

/** Knowledge digest — weekly/daily compilation */
export interface KnowledgeDigest {
  id: KBEntityId;
  period: "daily" | "weekly";
  startDate: number;
  endDate: number;
  sections: {
    title: string;
    items: {
      title: string;
      summary: string;
      source: string;
      isNew: boolean;
      importance: number;
    }[];
  }[];
  totalNewDocuments: number;
  totalUpdated: number;
  generatedAt: number;
}

// ==========================================
// M6: Knowledge Graph
// ==========================================

/** Knowledge graph node */
export interface GraphNode {
  id: KBEntityId;
  label: string;
  type: EntityType;
  properties: Record<string, string | number | boolean>;
  documentIds: KBEntityId[];    // Source documents
  weight: number;               // Importance (based on connections + access)
  createdAt: number;
  updatedAt: number;
}

/** Knowledge graph edge (relationship) */
export interface GraphEdge {
  id: KBEntityId;
  sourceId: KBEntityId;
  targetId: KBEntityId;
  relation: RelationType;
  label: string;
  weight: number;
  confidence: number;
  documentId: KBEntityId;       // Source document where this was extracted
  createdAt: number;
}

export type RelationType =
  | "RELATED_TO" | "PART_OF" | "DEPENDS_ON" | "CREATED_BY" | "LOCATED_IN"
  | "BELONGS_TO" | "MENTIONS" | "CAUSED_BY" | "FOLLOWS" | "CONTRADICTS"
  | "SUPERSEDES" | "REFERENCES" | "COLLABORATES_WITH" | "REPORTS_TO"
  | "IMPLEMENTS" | "EXTENDS" | "USES" | "GENERATES" | "CUSTOM";

/** Extracted relation from text */
export interface ExtractedRelation {
  sourceEntity: ExtractedEntity;
  targetEntity: ExtractedEntity;
  relation: RelationType;
  label: string;
  confidence: number;
  sentence: string;    // The sentence where this was found
}

/** Graph query for traversal */
export interface GraphQuery {
  startNodeId?: KBEntityId;
  startLabel?: string;
  relation?: RelationType;
  depth?: number;        // Max traversal depth
  limit?: number;
  includeProperties?: boolean;
}

/** Graph visualization data (for frontend rendering) */
export interface GraphVisualization {
  nodes: {
    id: string;
    label: string;
    type: EntityType;
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
// Aggregate Stats
// ==========================================

/** Complete knowledge base statistics */
export interface KBFullStats {
  // Core storage
  totalDocuments: number;
  totalChunks: number;
  totalSizeBytes: number;
  vectorDimensions: number;

  // By modality
  byModality: Record<ContentModality, number>;

  // By format
  byFormat: Partial<Record<FileFormat, number>>;

  // Search
  totalSearches: number;
  avgSearchLatencyMs: number;

  // Knowledge graph
  graphNodes: number;
  graphEdges: number;
  graphDensity: number;

  // Sync
  externalSources: number;
  lastSyncAt: number;
  conflictsUnresolved: number;

  // Quality
  duplicatesDetected: number;
  avgQualityScore: number;

  // Usage (自学习)
  topAccessedDocuments: { source: string; count: number }[];
  topSearchQueries: { query: string; count: number }[];
  userPreferences: { category: string; weight: number }[];

  // Temporal
  lastIndexedAt: number;
  indexedSources: { path: string; chunks: number; lastModified: number }[];
  uptime: number;
}
