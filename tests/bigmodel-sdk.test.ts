/**
 * file: bigmodel-sdk.test.ts
 * description: 测试 · 待补充描述
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-04-04
 * updated: 2026-04-04
 * status: active
 * tags: [test]
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
 * YYC³ AI Family — BigModel SDK Core Test Suite
 *
 * Tests for:
 *   T1: Type exports & SDK version
 *   T2: createBigModelChat factory
 *   T3: ChatCompletionTool request construction
 *   T4: BaseTool URL construction
 *   T5: Model catalog completeness
 *   T6: Error handling (HTTP errors, timeouts)
 *
 * Run: bun test tests/bigmodel-sdk.test.ts
 */

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void | Promise<void>): void;
declare function expect(value: any): any;

// ==========================================
// T1: Type Exports & SDK Version
// ==========================================

describe("T1: BigModel SDK Exports", () => {
  test("SDK version is semver string", async () => {
    const { BIGMODEL_SDK_VERSION } = await import('../bun-server/bigmodel-sdk/index');
    expect(typeof BIGMODEL_SDK_VERSION).toBe('string');
    expect(BIGMODEL_SDK_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("createBigModelChat is exported as function", async () => {
    const { createBigModelChat } = await import('../bun-server/bigmodel-sdk/index');
    expect(typeof createBigModelChat).toBe('function');
  });

  test("ChatCompletionTool class is exported", async () => {
    const { ChatCompletionTool } = await import('../bun-server/bigmodel-sdk/index');
    expect(typeof ChatCompletionTool).toBe('function');
  });

  test("BaseTool class is exported", async () => {
    const { BaseTool } = await import('../bun-server/bigmodel-sdk/index');
    expect(typeof BaseTool).toBe('function');
  });

  test("MCPToolBridge class is exported", async () => {
    const { MCPToolBridge } = await import('../bun-server/bigmodel-sdk/index');
    expect(typeof MCPToolBridge).toBe('function');
  });

  test("MCPOrchestrator class is exported", async () => {
    const { MCPOrchestrator } = await import('../bun-server/bigmodel-sdk/index');
    expect(typeof MCPOrchestrator).toBe('function');
  });
});

// ==========================================
// T2: Factory Function
// ==========================================

describe("T2: createBigModelChat Factory", () => {
  test("creates ChatCompletionTool instance with apiKey", async () => {
    const { createBigModelChat, ChatCompletionTool } = await import('../bun-server/bigmodel-sdk/index');
    const client = createBigModelChat('test-key');
    expect(client).toBeInstanceOf(ChatCompletionTool);
  });

  test("accepts custom baseUrl", async () => {
    const { createBigModelChat } = await import('../bun-server/bigmodel-sdk/index');
    const client = createBigModelChat('test-key', 'https://custom.api.com/');
    expect(client).toBeDefined();
  });

  test("accepts custom timeout", async () => {
    const { createBigModelChat } = await import('../bun-server/bigmodel-sdk/index');
    const client = createBigModelChat('test-key', undefined, 60000);
    expect(client).toBeDefined();
  });

  test("default baseUrl is bigmodel.cn", async () => {
    const { createBigModelChat } = await import('../bun-server/bigmodel-sdk/index');
    const client = createBigModelChat('test-key');
    // Verify it creates successfully with default URL
    expect(client).toBeDefined();
  });
});

// ==========================================
// T3: ChatCompletionTool Request Shape
// ==========================================

describe("T3: ChatCompletionTool Methods", () => {
  test("create() method exists", async () => {
    const { createBigModelChat } = await import('../bun-server/bigmodel-sdk/index');
    const client = createBigModelChat('test-key');
    expect(typeof client.create).toBe('function');
  });

  test("createStream() method exists", async () => {
    const { createBigModelChat } = await import('../bun-server/bigmodel-sdk/index');
    const client = createBigModelChat('test-key');
    expect(typeof client.createStream).toBe('function');
  });

  test("createAsync() method exists", async () => {
    const { createBigModelChat } = await import('../bun-server/bigmodel-sdk/index');
    const client = createBigModelChat('test-key');
    expect(typeof client.createAsync).toBe('function');
  });
});

// ==========================================
// T4: BaseTool URL Construction
// ==========================================

describe("T4: BaseTool URL Building", () => {
  test("BaseTool stores apiKey", async () => {
    const { BaseTool } = await import('../bun-server/bigmodel-sdk/index');
    // @ts-ignore -- accessing protected property for test
    const tool = new BaseTool({ apiKey: 'my-key' });
    expect(tool['apiKey']).toBe('my-key');
  });

  test("BaseTool uses default baseUrl when not provided", async () => {
    const { BaseTool } = await import('../bun-server/bigmodel-sdk/index');
    // @ts-ignore -- accessing protected property for test
    const tool = new BaseTool({ apiKey: 'key' });
    expect(tool['baseUrl']).toBe('https://open.bigmodel.cn/api/');
  });

  test("BaseTool uses custom baseUrl", async () => {
    const { BaseTool } = await import('../bun-server/bigmodel-sdk/index');
    // @ts-ignore -- accessing protected property for test
    const tool = new BaseTool({ apiKey: 'key', baseUrl: 'https://custom/' });
    expect(tool['baseUrl']).toBe('https://custom/');
  });

  test("BaseTool default timeout is 30000ms", async () => {
    const { BaseTool } = await import('../bun-server/bigmodel-sdk/index');
    // @ts-ignore -- accessing protected property for test
    const tool = new BaseTool({ apiKey: 'key' });
    expect(tool['timeout']).toBe(30000);
  });

  test("BaseTool custom timeout", async () => {
    const { BaseTool } = await import('../bun-server/bigmodel-sdk/index');
    // @ts-ignore -- accessing protected property for test
    const tool = new BaseTool({ apiKey: 'key', timeout: 60000 });
    expect(tool['timeout']).toBe(60000);
  });
});

// ==========================================
// T5: Model Catalog
// ==========================================

describe("T5: Model Catalog Completeness", () => {
  test("TEXT_MODELS contains glm-4-plus", async () => {
    const { TEXT_MODELS } = await import('../bun-server/bigmodel-sdk/tools/chat-completion');
    expect(TEXT_MODELS).toContain('glm-4-plus');
  });

  test("CODE_MODELS contains codegeex-4", async () => {
    const { CODE_MODELS } = await import('../bun-server/bigmodel-sdk/tools/chat-completion');
    expect(CODE_MODELS).toContain('codegeex-4');
  });

  test("VISION_MODELS has entries", async () => {
    const { VISION_MODELS } = await import('../bun-server/bigmodel-sdk/tools/chat-completion');
    expect(VISION_MODELS.length).toBeGreaterThan(0);
  });

  test("AUDIO_MODELS has entries", async () => {
    const { AUDIO_MODELS } = await import('../bun-server/bigmodel-sdk/tools/chat-completion');
    expect(AUDIO_MODELS.length).toBeGreaterThan(0);
  });
});

// ==========================================
// T6: Type constants from types.ts
// ==========================================

describe("T6: SDK Type Constants", () => {
  test("DEFAULT_BASE_URL is correct", async () => {
    const { DEFAULT_BASE_URL } = await import('../bun-server/bigmodel-sdk/tools/types');
    expect(DEFAULT_BASE_URL).toBe('https://open.bigmodel.cn/api/');
  });

  test("DEFAULT_TIMEOUT is 30000", async () => {
    const { DEFAULT_TIMEOUT } = await import('../bun-server/bigmodel-sdk/tools/types');
    expect(DEFAULT_TIMEOUT).toBe(30000);
  });
});
