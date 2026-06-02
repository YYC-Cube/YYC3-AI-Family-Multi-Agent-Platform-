/**
 * file: kb-knowledge-graph.ts
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
 * YYC³ Knowledge Base — M6: Knowledge Graph (知识图谱引擎)
 * 
 * "自动识别实体及关系，构建可视化知识图谱"
 * 
 * Capabilities:
 *   - Entity node management (CRUD + merge + dedup)
 *   - Relationship edge management with typed relations
 *   - Graph traversal (BFS/DFS up to N depth)
 *   - Subgraph extraction for visualization
 *   - Entity linking (map text mentions → graph nodes)
 *   - Path finding between entities
 *   - Graph statistics and density metrics
 *   - Visualization data export (for frontend D3/AntV rendering)
 */

import type {
  KBEntityId, GraphNode, GraphEdge, EntityType, RelationType,
  ExtractedEntity, ExtractedRelation, GraphQuery, GraphVisualization,
} from "./kb-types";

// ==========================================
// Color Map for Entity Types
// ==========================================
const ENTITY_COLORS: Record<EntityType, string> = {
  PERSON: "#6366f1",      // Indigo
  ORGANIZATION: "#8b5cf6", // Purple
  LOCATION: "#14b8a6",    // Teal
  DATE: "#f59e0b",        // Amber
  TIME: "#f97316",        // Orange
  MONEY: "#22c55e",       // Green
  PERCENTAGE: "#10b981",  // Emerald
  EMAIL: "#3b82f6",       // Blue
  PHONE: "#6366f1",       // Indigo
  URL: "#0ea5e9",         // Sky
  PRODUCT: "#ec4899",     // Pink
  TECHNOLOGY: "#a855f7",  // Violet
  EVENT: "#f43f5e",       // Rose
  PROJECT: "#ef4444",     // Red
  CODE_SYMBOL: "#84cc16", // Lime
  FILE_PATH: "#64748b",   // Slate
  VERSION: "#78716c",     // Stone
  CUSTOM: "#94a3b8",      // Gray
};

// ==========================================
// In-Memory Graph Store
// ==========================================
export class KnowledgeGraph {
  private nodes: Map<KBEntityId, GraphNode> = new Map();
  private edges: Map<KBEntityId, GraphEdge> = new Map();
  private nodesByLabel: Map<string, Set<KBEntityId>> = new Map(); // label → nodeIds
  private adjacencyOut: Map<KBEntityId, Set<KBEntityId>> = new Map(); // nodeId → edge IDs outgoing
  private adjacencyIn: Map<KBEntityId, Set<KBEntityId>> = new Map();  // nodeId → edge IDs incoming

  constructor() {
    console.log("[KB:Graph] Knowledge graph initialized");
  }

  // ==========================================
  // Node Operations
  // ==========================================

  addNode(node: Omit<GraphNode, "id" | "createdAt" | "updatedAt">): GraphNode {
    // Check for existing node with same label + type
    const existing = this.findNode(node.label, node.type);
    if (existing) {
      // Merge: update weight and document references
      existing.weight += node.weight;
      for (const docId of node.documentIds) {
        if (!existing.documentIds.includes(docId)) {
          existing.documentIds.push(docId);
        }
      }
      Object.assign(existing.properties, node.properties);
      existing.updatedAt = Date.now();
      return existing;
    }

    const id: KBEntityId = `node:${crypto.randomUUID().substring(0, 8)}`;
    const newNode: GraphNode = {
      ...node,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.nodes.set(id, newNode);

    // Index by label
    const normalizedLabel = node.label.toLowerCase().trim();
    if (!this.nodesByLabel.has(normalizedLabel)) {
      this.nodesByLabel.set(normalizedLabel, new Set());
    }
    this.nodesByLabel.get(normalizedLabel)!.add(id);

    // Init adjacency
    this.adjacencyOut.set(id, new Set());
    this.adjacencyIn.set(id, new Set());

    return newNode;
  }

  getNode(id: KBEntityId): GraphNode | undefined {
    return this.nodes.get(id);
  }

  findNode(label: string, type?: EntityType): GraphNode | undefined {
    const normalizedLabel = label.toLowerCase().trim();
    const nodeIds = this.nodesByLabel.get(normalizedLabel);
    if (!nodeIds) return undefined;

    for (const id of nodeIds) {
      const node = this.nodes.get(id);
      if (node && (!type || node.type === type)) return node;
    }
    return undefined;
  }

  removeNode(id: KBEntityId): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;

    // Remove all connected edges
    const outEdges = this.adjacencyOut.get(id) || new Set();
    const inEdges = this.adjacencyIn.get(id) || new Set();
    for (const edgeId of [...outEdges, ...inEdges]) {
      this.edges.delete(edgeId);
    }

    // Clean up adjacency
    this.adjacencyOut.delete(id);
    this.adjacencyIn.delete(id);

    // Clean up label index
    const normalizedLabel = node.label.toLowerCase().trim();
    this.nodesByLabel.get(normalizedLabel)?.delete(id);

    this.nodes.delete(id);
    return true;
  }

  // ==========================================
  // Edge Operations
  // ==========================================

  addEdge(edge: Omit<GraphEdge, "id" | "createdAt">): GraphEdge {
    // Check for duplicate edge
    const existing = this.findEdge(edge.sourceId, edge.targetId, edge.relation);
    if (existing) {
      existing.weight += edge.weight;
      existing.confidence = Math.max(existing.confidence, edge.confidence);
      return existing;
    }

    const id: KBEntityId = `edge:${crypto.randomUUID().substring(0, 8)}`;
    const newEdge: GraphEdge = {
      ...edge,
      id,
      createdAt: Date.now(),
    };

    this.edges.set(id, newEdge);

    // Update adjacency
    if (!this.adjacencyOut.has(edge.sourceId)) this.adjacencyOut.set(edge.sourceId, new Set());
    if (!this.adjacencyIn.has(edge.targetId)) this.adjacencyIn.set(edge.targetId, new Set());
    this.adjacencyOut.get(edge.sourceId)!.add(id);
    this.adjacencyIn.get(edge.targetId)!.add(id);

    return newEdge;
  }

  findEdge(sourceId: KBEntityId, targetId: KBEntityId, relation?: RelationType): GraphEdge | undefined {
    const outEdges = this.adjacencyOut.get(sourceId);
    if (!outEdges) return undefined;

    for (const edgeId of outEdges) {
      const edge = this.edges.get(edgeId);
      if (edge && edge.targetId === targetId && (!relation || edge.relation === relation)) {
        return edge;
      }
    }
    return undefined;
  }

  // ==========================================
  // Ingest from Extracted Entities & Relations
  // ==========================================

  ingestFromExtraction(
    entities: ExtractedEntity[],
    relations: ExtractedRelation[],
    documentId: KBEntityId,
  ): { nodesCreated: number; edgesCreated: number } {
    let nodesCreated = 0;
    let edgesCreated = 0;

    // Create nodes from entities
    const entityNodeMap = new Map<string, KBEntityId>();

    for (const entity of entities) {
      const node = this.addNode({
        label: entity.text,
        type: entity.type,
        properties: {
          normalizedValue: entity.normalizedValue || entity.text,
          confidence: entity.confidence,
        },
        documentIds: [documentId],
        weight: 1,
      });
      entityNodeMap.set(entity.text, node.id);
      if (!this.nodes.has(node.id)) nodesCreated++;
    }

    // Create edges from relations
    for (const rel of relations) {
      const sourceId = entityNodeMap.get(rel.sourceEntity.text);
      const targetId = entityNodeMap.get(rel.targetEntity.text);
      if (sourceId && targetId && sourceId !== targetId) {
        const edge = this.addEdge({
          sourceId,
          targetId,
          relation: rel.relation,
          label: rel.label,
          weight: 1,
          confidence: rel.confidence,
          documentId,
        });
        if (edge) edgesCreated++;
      }
    }

    return { nodesCreated, edgesCreated };
  }

  // ==========================================
  // Graph Traversal
  // ==========================================

  /**
   * BFS traversal from a starting node, up to given depth.
   * Returns all reachable nodes and edges within depth.
   */
  traverse(query: GraphQuery): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const resultNodes = new Map<KBEntityId, GraphNode>();
    const resultEdges = new Map<KBEntityId, GraphEdge>();
    const maxDepth = query.depth ?? 2;
    const limit = query.limit ?? 100;

    // Find starting node
    let startId = query.startNodeId;
    if (!startId && query.startLabel) {
      const node = this.findNode(query.startLabel);
      startId = node?.id;
    }
    if (!startId) return { nodes: [], edges: [] };

    const startNode = this.nodes.get(startId);
    if (!startNode) return { nodes: [], edges: [] };

    // BFS
    const queue: { nodeId: KBEntityId; depth: number }[] = [{ nodeId: startId, depth: 0 }];
    const visited = new Set<KBEntityId>([startId]);
    resultNodes.set(startId, startNode);

    while (queue.length > 0 && resultNodes.size < limit) {
      const { nodeId, depth } = queue.shift()!;
      if (depth >= maxDepth) continue;

      // Outgoing edges
      const outEdges = this.adjacencyOut.get(nodeId) || new Set();
      for (const edgeId of outEdges) {
        const edge = this.edges.get(edgeId);
        if (!edge) continue;
        if (query.relation && edge.relation !== query.relation) continue;

        resultEdges.set(edgeId, edge);

        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          const targetNode = this.nodes.get(edge.targetId);
          if (targetNode) {
            resultNodes.set(edge.targetId, targetNode);
            queue.push({ nodeId: edge.targetId, depth: depth + 1 });
          }
        }
      }

      // Incoming edges
      const inEdges = this.adjacencyIn.get(nodeId) || new Set();
      for (const edgeId of inEdges) {
        const edge = this.edges.get(edgeId);
        if (!edge) continue;
        if (query.relation && edge.relation !== query.relation) continue;

        resultEdges.set(edgeId, edge);

        if (!visited.has(edge.sourceId)) {
          visited.add(edge.sourceId);
          const sourceNode = this.nodes.get(edge.sourceId);
          if (sourceNode) {
            resultNodes.set(edge.sourceId, sourceNode);
            queue.push({ nodeId: edge.sourceId, depth: depth + 1 });
          }
        }
      }
    }

    return {
      nodes: Array.from(resultNodes.values()),
      edges: Array.from(resultEdges.values()),
    };
  }

  /**
   * Find shortest path between two nodes
   */
  findPath(fromId: KBEntityId, toId: KBEntityId, maxDepth: number = 5): GraphNode[] | null {
    if (fromId === toId) return [this.nodes.get(fromId)!].filter(Boolean);

    const queue: { nodeId: KBEntityId; path: KBEntityId[] }[] = [{ nodeId: fromId, path: [fromId] }];
    const visited = new Set<KBEntityId>([fromId]);

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;
      if (path.length > maxDepth) continue;

      const outEdges = this.adjacencyOut.get(nodeId) || new Set();
      const inEdges = this.adjacencyIn.get(nodeId) || new Set();

      const neighborIds = new Set<KBEntityId>();
      for (const edgeId of outEdges) {
        const edge = this.edges.get(edgeId);
        if (edge) neighborIds.add(edge.targetId);
      }
      for (const edgeId of inEdges) {
        const edge = this.edges.get(edgeId);
        if (edge) neighborIds.add(edge.sourceId);
      }

      for (const neighborId of neighborIds) {
        if (neighborId === toId) {
          return [...path, neighborId].map(id => this.nodes.get(id)!).filter(Boolean);
        }
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ nodeId: neighborId, path: [...path, neighborId] });
        }
      }
    }

    return null;
  }

  // ==========================================
  // Visualization Export
  // ==========================================

  /**
   * Generate visualization data for frontend rendering (D3/AntV/Cytoscape)
   */
  getVisualization(centerNodeId?: KBEntityId, depth: number = 2, limit: number = 100): GraphVisualization {
    let nodes: GraphNode[];
    let edges: GraphEdge[];

    if (centerNodeId) {
      const result = this.traverse({ startNodeId: centerNodeId, depth, limit });
      nodes = result.nodes;
      edges = result.edges;
    } else {
      // Return top nodes by weight
      nodes = Array.from(this.nodes.values())
        .sort((a, b) => b.weight - a.weight)
        .slice(0, limit);
      const nodeIds = new Set(nodes.map(n => n.id));
      edges = Array.from(this.edges.values())
        .filter(e => nodeIds.has(e.sourceId) && nodeIds.has(e.targetId));
    }

    // Calculate graph density
    const n = nodes.length;
    const e = edges.length;
    const maxEdges = n * (n - 1);
    const density = maxEdges > 0 ? e / maxEdges : 0;

    // Find connected components (simplified)
    const visited = new Set<string>();
    let components = 0;
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        components++;
        // Simple BFS to mark component
        const queue = [node.id];
        while (queue.length > 0) {
          const current = queue.shift()!;
          if (visited.has(current)) continue;
          visited.add(current);
          for (const edge of edges) {
            if (edge.sourceId === current && !visited.has(edge.targetId)) queue.push(edge.targetId);
            if (edge.targetId === current && !visited.has(edge.sourceId)) queue.push(edge.sourceId);
          }
        }
      }
    }

    return {
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.label,
        type: n.type,
        size: Math.min(5 + n.weight * 2, 30),
        color: ENTITY_COLORS[n.type] || "#94a3b8",
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.sourceId,
        target: e.targetId,
        label: e.relation,
        weight: e.weight,
      })),
      stats: {
        totalNodes: n,
        totalEdges: e,
        components,
        density,
      },
    };
  }

  // ==========================================
  // Statistics
  // ==========================================

  getStats(): {
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<string, number>;
    edgesByRelation: Record<string, number>;
    topNodes: { label: string; type: EntityType; weight: number }[];
    density: number;
  } {
    const nodesByType: Record<string, number> = {};
    for (const node of this.nodes.values()) {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    }

    const edgesByRelation: Record<string, number> = {};
    for (const edge of this.edges.values()) {
      edgesByRelation[edge.relation] = (edgesByRelation[edge.relation] || 0) + 1;
    }

    const topNodes = Array.from(this.nodes.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 20)
      .map(n => ({ label: n.label, type: n.type, weight: n.weight }));

    const n = this.nodes.size;
    const maxEdges = n * (n - 1);

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      nodesByType,
      edgesByRelation,
      topNodes,
      density: maxEdges > 0 ? this.edges.size / maxEdges : 0,
    };
  }

  // ==========================================
  // Clear
  // ==========================================

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.nodesByLabel.clear();
    this.adjacencyOut.clear();
    this.adjacencyIn.clear();
  }
}
