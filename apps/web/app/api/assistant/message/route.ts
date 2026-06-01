import { randomUUID } from "node:crypto";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_RESEARCH_API_BASE_URL ?? "http://127.0.0.1:8000";
const OPENCLAW_PROTOCOL_VERSION = 4;
const DEFAULT_GATEWAY_TIMEOUT_SECONDS = 120;
const DEFAULT_WS_OPEN_TIMEOUT_MS = 10_000;
const DEFAULT_WS_EVENT_TIMEOUT_MS = 10_000;
const DEFAULT_WS_REQUEST_TIMEOUT_MS = 15_000;
const UTF8_JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8"
} as const;

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantRequest = {
  projectId?: string;
  message?: string;
  history?: HistoryMessage[];
};

type ProjectContext = {
  project?: {
    topic: string;
    goal?: string | null;
    domain?: string | null;
    sources: string[];
  };
  papers?: Array<{
    title: string;
    year?: number | null;
    relevanceScore?: number | null;
  }>;
  report?: {
    summary: string;
    researchGaps: string[];
  };
  graph?: {
    nodes: Array<{ type: string; label: string }>;
    edges: Array<{ type: string }>;
  };
};

type GatewayEventFrame = {
  type: "event";
  event: string;
  payload?: unknown;
};

type GatewayResponseFrame = {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

type GatewayRequestFrame = {
  type: "req";
  id: string;
  method: string;
  params?: unknown;
};

type HelloOkPayload = {
  type: "hello-ok";
  features?: {
    methods?: string[];
    events?: string[];
  };
};

type GatewayAgentPayload = {
  text?: string;
  mediaUrl?: string | null;
  mediaUrls?: string[];
};

type GatewayAgentResult = {
  payloads?: GatewayAgentPayload[];
  deliveryStatus?: unknown;
  meta?: unknown;
};

type GatewayAgentResponse = {
  runId?: string;
  status?: string;
  summary?: string;
  result?: GatewayAgentResult;
};

type GatewayPendingResponse = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  expectFinal: boolean;
  acceptedSeen: boolean;
  onAccepted?: (payload: unknown) => void;
  cleanup: () => void;
};

type GatewayEventWaiter = {
  resolve: (frame: GatewayEventFrame) => void;
  reject: (error: Error) => void;
  cleanup: () => void;
};

type OpenClawDeviceIdentity = {
  version?: number;
  deviceId: string;
  publicKeyPem: string;
  privateKeyPem: string;
};

type OpenClawDeviceAuthState = {
  version?: number;
  deviceId?: string;
  tokens?: {
    operator?: {
      token?: string;
      role?: string;
      scopes?: string[];
      updatedAtMs?: number;
    };
  };
};

type OpenClawPairedDeviceEntry = {
  deviceId: string;
  clientId?: string;
  clientMode?: string;
  platform?: string;
  role?: string;
  approvedScopes?: string[];
  scopes?: string[];
};

type GatewayConnectAuthBundle = {
  clientId: string;
  clientMode: string;
  platform: string;
  auth: {
    token: string;
  };
  device: {
    id: string;
    publicKey: string;
    signature: string;
    signedAt: number;
    nonce: string;
  };
  scopes: string[];
  authSource: "device-token" | "shared-token";
};

class GatewayRequestError extends Error {
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "GatewayRequestError";
    this.code = code;
    this.details = details;
  }
}

class GatewayRpcClient {
  private readonly ws: WebSocket;
  private readonly openPromise: Promise<void>;
  private readonly pendingResponses = new Map<string, GatewayPendingResponse>();
  private readonly eventBacklog = new Map<string, GatewayEventFrame[]>();
  private readonly eventWaiters = new Map<string, GatewayEventWaiter[]>();
  private closedError: Error | null = null;
  private isOpen = false;

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.openPromise = new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        this.ws.removeEventListener("open", onOpen);
        this.ws.removeEventListener("error", onError);
        this.ws.removeEventListener("close", onClose);
      };

      const onOpen = () => {
        cleanup();
        this.isOpen = true;
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error("OpenClaw Gateway WebSocket connect error"));
      };

      const onClose = (event: CloseEvent) => {
        cleanup();
        reject(this.buildCloseError(event));
      };

      this.ws.addEventListener("open", onOpen);
      this.ws.addEventListener("error", onError);
      this.ws.addEventListener("close", onClose);
    });

    this.ws.addEventListener("message", (event) => {
      void this.handleMessage(event.data);
    });

    this.ws.addEventListener("close", (event) => {
      this.isOpen = false;
      const error = this.buildCloseError(event);
      this.closedError = error;
      this.rejectAll(error);
    });

    this.ws.addEventListener("error", () => {
      if (!this.closedError) {
        this.closedError = new Error("OpenClaw Gateway WebSocket error");
      }
    });
  }

  async waitUntilOpen(timeoutMs = DEFAULT_WS_OPEN_TIMEOUT_MS) {
    await withTimeout(
      this.openPromise,
      timeoutMs,
      `OpenClaw Gateway did not open within ${timeoutMs}ms`,
    );
  }

  async waitForEvent(eventName: string, timeoutMs = DEFAULT_WS_EVENT_TIMEOUT_MS) {
    const backlog = this.eventBacklog.get(eventName);
    if (backlog && backlog.length > 0) {
      const frame = backlog.shift();
      if (frame) {
        return frame;
      }
    }

    return await withTimeout(
      new Promise<GatewayEventFrame>((resolve, reject) => {
        const waiters = this.eventWaiters.get(eventName) ?? [];
        const waiter: GatewayEventWaiter = {
          resolve,
          reject,
          cleanup: () => {
            const nextWaiters = (this.eventWaiters.get(eventName) ?? []).filter(
              (entry) => entry !== waiter,
            );
            if (nextWaiters.length > 0) {
              this.eventWaiters.set(eventName, nextWaiters);
            } else {
              this.eventWaiters.delete(eventName);
            }
          }
        };
        waiters.push(waiter);
        this.eventWaiters.set(eventName, waiters);
      }),
      timeoutMs,
      `OpenClaw Gateway event "${eventName}" did not arrive within ${timeoutMs}ms`,
    );
  }

  async request<T>(
    method: string,
    params?: unknown,
    options?: {
      expectFinal?: boolean;
      timeoutMs?: number;
      onAccepted?: (payload: unknown) => void;
    },
  ): Promise<T> {
    await this.waitUntilOpen();

    if (this.closedError) {
      throw this.closedError;
    }
    if (this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("OpenClaw Gateway is not connected");
    }

    const frame: GatewayRequestFrame = {
      type: "req",
      id: randomUUID(),
      method,
      params
    };

    return await withTimeout(
      new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => {
          const pending = this.pendingResponses.get(frame.id);
          pending?.cleanup();
          this.pendingResponses.delete(frame.id);
          reject(new Error(`OpenClaw Gateway request "${method}" timed out`));
        }, options?.timeoutMs ?? DEFAULT_WS_REQUEST_TIMEOUT_MS);

        const cleanup = () => {
          clearTimeout(timeout);
        };

        this.pendingResponses.set(frame.id, {
          resolve: (value) => resolve(value as T),
          reject: (error) => reject(error),
          expectFinal: options?.expectFinal === true,
          acceptedSeen: false,
          onAccepted: options?.onAccepted,
          cleanup
        });

        this.ws.send(JSON.stringify(frame));
      }),
      (options?.timeoutMs ?? DEFAULT_WS_REQUEST_TIMEOUT_MS) + 1_000,
      `OpenClaw Gateway request "${method}" exceeded its timeout window`,
    );
  }

  async close() {
    if (
      this.ws.readyState === WebSocket.CLOSED ||
      this.ws.readyState === WebSocket.CLOSING
    ) {
      return;
    }

    const closed = new Promise<void>((resolve) => {
      const onClose = () => {
        this.ws.removeEventListener("close", onClose);
        resolve();
      };
      this.ws.addEventListener("close", onClose);
    });

    this.ws.close(1000, "done");
    await Promise.race([closed, sleep(500)]);
  }

  private async handleMessage(data: unknown) {
    const raw = await dataToString(data);
    if (!raw) {
      return;
    }

    let frame: unknown;
    try {
      frame = JSON.parse(raw);
    } catch {
      return;
    }

    if (isGatewayEventFrame(frame)) {
      this.dispatchEvent(frame);
      return;
    }

    if (isGatewayResponseFrame(frame)) {
      this.dispatchResponse(frame);
    }
  }

  private dispatchEvent(frame: GatewayEventFrame) {
    const waiters = this.eventWaiters.get(frame.event);
    if (waiters && waiters.length > 0) {
      const nextWaiter = waiters.shift();
      if (waiters.length > 0) {
        this.eventWaiters.set(frame.event, waiters);
      } else {
        this.eventWaiters.delete(frame.event);
      }
      nextWaiter?.cleanup();
      nextWaiter?.resolve(frame);
      return;
    }

    const backlog = this.eventBacklog.get(frame.event) ?? [];
    backlog.push(frame);
    this.eventBacklog.set(frame.event, backlog);
  }

  private dispatchResponse(frame: GatewayResponseFrame) {
    const pending = this.pendingResponses.get(frame.id);
    if (!pending) {
      return;
    }

    const status =
      frame.payload && typeof frame.payload === "object"
        ? (frame.payload as { status?: unknown }).status
        : undefined;

    if (pending.expectFinal && status === "accepted") {
      if (!pending.acceptedSeen) {
        pending.acceptedSeen = true;
        pending.onAccepted?.(frame.payload);
      }
      return;
    }

    this.pendingResponses.delete(frame.id);
    pending.cleanup();

    if (frame.ok) {
      pending.resolve(frame.payload);
      return;
    }

    pending.reject(
      new GatewayRequestError(
        frame.error?.message ?? `OpenClaw Gateway "${frame.id}" returned an error`,
        frame.error?.code,
        frame.error?.details,
      ),
    );
  }

  private rejectAll(error: Error) {
    for (const pending of this.pendingResponses.values()) {
      pending.cleanup();
      pending.reject(error);
    }
    this.pendingResponses.clear();

    for (const waiters of this.eventWaiters.values()) {
      for (const waiter of waiters) {
        waiter.cleanup();
        waiter.reject(error);
      }
    }
    this.eventWaiters.clear();
  }

  private buildCloseError(event: CloseEvent) {
    const reason = event.reason?.trim() || "no close reason";
    return new Error(`OpenClaw Gateway closed (${event.code}): ${reason}`);
  }
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as AssistantRequest;
  if (!payload.projectId || !payload.message?.trim()) {
    return jsonResponse({ error: "projectId and message are required." }, { status: 400 });
  }

  const context = await loadProjectContext(payload.projectId);
  const bridgeMode = resolveBridgeMode();

  try {
    if (bridgeMode === "gateway") {
      const gatewayResponse = await callOpenClawGateway({
        projectId: payload.projectId,
        message: payload.message,
        history: payload.history ?? [],
        context
      });

      return jsonResponse({
        mode: "gateway",
        reply: gatewayResponse.reply,
        runId: gatewayResponse.runId,
        status: gatewayResponse.status
      });
    }

    if (bridgeMode === "proxy" && process.env.OPENCLAW_BRIDGE_URL) {
      const headers: HeadersInit = {
        "Content-Type": "application/json"
      };
      if (process.env.OPENCLAW_BRIDGE_AUTH_TOKEN) {
        headers.Authorization = `Bearer ${process.env.OPENCLAW_BRIDGE_AUTH_TOKEN}`;
      }

      const upstreamResponse = await fetch(process.env.OPENCLAW_BRIDGE_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          projectId: payload.projectId,
          message: payload.message,
          history: payload.history ?? [],
          context
        }),
        cache: "no-store"
      });

      const contentType = upstreamResponse.headers.get("content-type") ?? "";
      const rawPayload = contentType.includes("application/json")
        ? await upstreamResponse.json()
        : { reply: await upstreamResponse.text() };

      const reply =
        rawPayload.reply ??
        rawPayload.message ??
        rawPayload.output ??
        "OpenClaw bridge replied without a supported reply field.";

      return jsonResponse({
        mode: "proxy",
        reply,
        raw: rawPayload
      });
    }

    const mockReply = buildMockReply(payload.message, context);
    return jsonResponse({
      mode: "mock",
      ...mockReply
    });
  } catch (error) {
    return jsonResponse(
      {
        error: formatBridgeError(error)
      },
      { status: 502 },
    );
  }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...UTF8_JSON_HEADERS,
      ...(init?.headers ?? {})
    }
  });
}

function resolveBridgeMode() {
  if (process.env.OPENCLAW_BRIDGE_MODE) {
    return process.env.OPENCLAW_BRIDGE_MODE;
  }

  if (process.env.OPENCLAW_GATEWAY_WS_URL) {
    return "gateway";
  }

  if (process.env.OPENCLAW_BRIDGE_URL) {
    return "proxy";
  }

  return "mock";
}

async function callOpenClawGateway(params: {
  projectId: string;
  message: string;
  history: HistoryMessage[];
  context: ProjectContext;
}) {
  const wsUrl = process.env.OPENCLAW_GATEWAY_WS_URL?.trim();
  const token = process.env.OPENCLAW_GATEWAY_TOKEN?.trim();

  if (!wsUrl) {
    throw new Error(
      "OPENCLAW_GATEWAY_WS_URL is missing. Set it to your local OpenClaw gateway, for example ws://127.0.0.1:18789.",
    );
  }
  if (!token) {
    throw new Error(
      "OPENCLAW_GATEWAY_TOKEN is missing. Add the gateway token to apps/web/.env.local before using gateway mode.",
    );
  }

  const agentId = process.env.OPENCLAW_GATEWAY_AGENT_ID?.trim() || "main";
  const sessionKey =
    process.env.OPENCLAW_GATEWAY_SESSION_KEY?.trim() ||
    buildProjectSessionKey(agentId, params.projectId);
  const timeoutSeconds = parsePositiveInteger(
    process.env.OPENCLAW_GATEWAY_TIMEOUT_SECONDS,
    DEFAULT_GATEWAY_TIMEOUT_SECONDS,
  );
  const thinking = normalizeOptionalString(process.env.OPENCLAW_GATEWAY_THINKING);
  const model = normalizeOptionalString(process.env.OPENCLAW_GATEWAY_MODEL);
  const scopes = parseScopes(process.env.OPENCLAW_GATEWAY_SCOPES);
  const client = new GatewayRpcClient(wsUrl);

  try {
    await client.waitUntilOpen();
    const challengeEvent = await client.waitForEvent("connect.challenge");
    const nonce = readConnectChallengeNonce(challengeEvent);
  const connectAuth = await resolveGatewayConnectAuth({
      fallbackToken: token,
      requestedScopes: scopes,
      nonce,
      defaultClientId: "gateway-client",
      defaultClientMode: "backend",
      defaultPlatform: "node",
      deviceFamily: undefined
    });

    const hello = await client.request<HelloOkPayload>(
      "connect",
      {
        minProtocol: OPENCLAW_PROTOCOL_VERSION,
        maxProtocol: OPENCLAW_PROTOCOL_VERSION,
        client: {
          id: connectAuth.clientId,
          displayName: "research-lineage-web",
          version: "0.1.0",
          platform: connectAuth.platform,
          mode: connectAuth.clientMode,
          instanceId: randomUUID()
        },
        caps: [],
        commands: [],
        role: "operator",
        scopes: connectAuth.scopes,
        auth: connectAuth.auth,
        device: connectAuth.device
      },
      {
        timeoutMs: DEFAULT_WS_REQUEST_TIMEOUT_MS
      },
    );

    const supportedMethods = new Set(hello.features?.methods ?? []);
    if (!supportedMethods.has("agent")) {
      throw new Error('The connected OpenClaw gateway does not expose the "agent" method.');
    }

    const finalResponse = await client.request<GatewayAgentResponse>(
      "agent",
      {
        message: buildGatewayUserPrompt(params),
        agentId,
        sessionKey,
        timeout: timeoutSeconds,
        idempotencyKey: randomUUID(),
        ...(thinking ? { thinking } : {}),
        ...(model ? { model } : {}),
        extraSystemPrompt: buildGatewaySystemPrompt()
      },
      {
        expectFinal: true,
        timeoutMs: Math.max(timeoutSeconds * 1_000 + 30_000, 60_000)
      },
    );

    return {
      reply: extractGatewayReply(finalResponse, params.context),
      runId: finalResponse.runId,
      status: finalResponse.status ?? "ok"
    };
  } finally {
    await client.close();
  }
}

function buildProjectSessionKey(agentId: string, projectId: string) {
  const prefix =
    process.env.OPENCLAW_GATEWAY_SESSION_KEY_PREFIX?.trim() || "research-lineage";
  const safePrefix = prefix.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const safeProjectId = projectId.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `agent:${agentId}:${safePrefix}-${safeProjectId}`;
}

async function resolveGatewayConnectAuth(params: {
  fallbackToken: string;
  requestedScopes: string[];
  nonce: string;
  defaultClientId: string;
  defaultClientMode: string;
  defaultPlatform: string;
  deviceFamily?: string;
}): Promise<GatewayConnectAuthBundle> {
  const deviceIdentity = await loadOpenClawDeviceIdentity();
  const deviceTokenState = await loadOpenClawDeviceAuthState();
  const pairedDevice = deviceIdentity
    ? await loadOpenClawPairedDeviceEntry(deviceIdentity.deviceId)
    : null;
  const operatorToken = normalizeOptionalString(deviceTokenState?.tokens?.operator?.token);
  const operatorScopes = normalizeScopes(
    pairedDevice?.approvedScopes?.length
      ? pairedDevice.approvedScopes
      : pairedDevice?.scopes?.length
        ? pairedDevice.scopes
        : deviceTokenState?.tokens?.operator?.scopes,
  );
  const operatorRole = normalizeOptionalString(deviceTokenState?.tokens?.operator?.role) ?? "operator";
  const clientId =
    normalizeOptionalString(pairedDevice?.clientId) ?? params.defaultClientId;
  const clientMode =
    normalizeOptionalString(pairedDevice?.clientMode) ?? params.defaultClientMode;
  const platform =
    normalizeOptionalString(pairedDevice?.platform) ?? params.defaultPlatform;

  if (
    deviceIdentity &&
    operatorToken &&
    operatorRole === "operator" &&
    operatorScopes.length > 0
  ) {
    const signedAtMs = Date.now();
    const payload = buildDeviceAuthPayloadV3({
      deviceId: deviceIdentity.deviceId,
      clientId,
      clientMode,
      role: "operator",
      scopes: operatorScopes,
      signedAtMs,
      token: operatorToken,
      nonce: params.nonce,
      platform,
      deviceFamily: params.deviceFamily
    });

    return {
      clientId,
      clientMode,
      platform,
      auth: {
        token: operatorToken
      },
      device: {
        id: deviceIdentity.deviceId,
        publicKey: publicKeyRawBase64UrlFromPem(deviceIdentity.publicKeyPem),
        signature: signDevicePayload(deviceIdentity.privateKeyPem, payload),
        signedAt: signedAtMs,
        nonce: params.nonce
      },
      scopes: operatorScopes,
      authSource: "device-token"
    };
  }

  if (!deviceIdentity) {
    return {
      clientId: params.defaultClientId,
      clientMode: params.defaultClientMode,
      platform: params.defaultPlatform,
      auth: {
        token: params.fallbackToken
      },
      device: undefined as never,
      scopes: params.requestedScopes,
      authSource: "shared-token"
    };
  }

  const signedAtMs = Date.now();
  const payload = buildDeviceAuthPayloadV3({
    deviceId: deviceIdentity.deviceId,
    clientId,
    clientMode,
    role: "operator",
    scopes: params.requestedScopes,
    signedAtMs,
    token: params.fallbackToken,
    nonce: params.nonce,
    platform,
    deviceFamily: params.deviceFamily
  });

  return {
    clientId,
    clientMode,
    platform,
    auth: {
      token: params.fallbackToken
    },
    device: {
      id: deviceIdentity.deviceId,
      publicKey: publicKeyRawBase64UrlFromPem(deviceIdentity.publicKeyPem),
      signature: signDevicePayload(deviceIdentity.privateKeyPem, payload),
      signedAt: signedAtMs,
      nonce: params.nonce
    },
    scopes: params.requestedScopes,
    authSource: "shared-token"
  };
}

async function loadOpenClawDeviceIdentity(): Promise<OpenClawDeviceIdentity | null> {
  const filePath = process.env.OPENCLAW_DEVICE_IDENTITY_PATH?.trim()
    ? process.env.OPENCLAW_DEVICE_IDENTITY_PATH.trim()
    : path.join(resolveOpenClawStateConfigDir(), "identity", "device.json");

  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf-8")) as OpenClawDeviceIdentity;
    if (
      typeof parsed.deviceId === "string" &&
      typeof parsed.publicKeyPem === "string" &&
      typeof parsed.privateKeyPem === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

async function loadOpenClawPairedDeviceEntry(
  deviceId: string,
): Promise<OpenClawPairedDeviceEntry | null> {
  const filePath = process.env.OPENCLAW_PAIRED_DEVICES_PATH?.trim()
    ? process.env.OPENCLAW_PAIRED_DEVICES_PATH.trim()
    : path.join(resolveOpenClawStateConfigDir(), "devices", "paired.json");

  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf-8")) as Record<
      string,
      OpenClawPairedDeviceEntry
    >;
    const entry = parsed?.[deviceId];
    return entry && typeof entry === "object" ? entry : null;
  } catch {
    return null;
  }
}

async function loadOpenClawDeviceAuthState(): Promise<OpenClawDeviceAuthState | null> {
  const filePath = process.env.OPENCLAW_DEVICE_AUTH_PATH?.trim()
    ? process.env.OPENCLAW_DEVICE_AUTH_PATH.trim()
    : path.join(resolveOpenClawStateConfigDir(), "identity", "device-auth.json");

  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf-8")) as OpenClawDeviceAuthState;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function resolveOpenClawStateConfigDir() {
  const explicitConfigDir = normalizeOptionalString(process.env.OPENCLAW_STATE_CONFIG_DIR);
  if (explicitConfigDir) {
    return explicitConfigDir;
  }

  const stateDir = normalizeOptionalString(process.env.OPENCLAW_STATE_DIR);
  if (stateDir) {
    return path.join(stateDir, "config");
  }

  return "D:\\RearchAgent\\openclaw-state\\config";
}

function normalizeScopes(scopes: string[] | undefined) {
  return (Array.isArray(scopes) ? scopes : [])
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function readConnectChallengeNonce(event: GatewayEventFrame) {
  const payload =
    event.payload && typeof event.payload === "object"
      ? (event.payload as { nonce?: unknown })
      : undefined;
  const nonce = typeof payload?.nonce === "string" ? payload.nonce.trim() : "";
  if (!nonce) {
    throw new Error("OpenClaw Gateway connect challenge did not include a nonce");
  }
  return nonce;
}

function buildDeviceAuthPayloadV3(params: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token?: string | null;
  nonce: string;
  platform?: string | null;
  deviceFamily?: string | null;
}) {
  const scopes = params.scopes.join(",");
  const token = params.token ?? "";
  const platform = normalizeDeviceMetadataForAuth(params.platform);
  const deviceFamily = normalizeDeviceMetadataForAuth(params.deviceFamily);
  return [
    "v3",
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    scopes,
    String(params.signedAtMs),
    token,
    params.nonce,
    platform,
    deviceFamily
  ].join("|");
}

function normalizeDeviceMetadataForAuth(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : "";
}

function signDevicePayload(privateKeyPem: string, payload: string) {
  const key = crypto.createPrivateKey(privateKeyPem);
  const signature = crypto.sign(null, Buffer.from(payload, "utf8"), key);
  return base64UrlEncode(signature);
}

function publicKeyRawBase64UrlFromPem(publicKeyPem: string) {
  return base64UrlEncode(derivePublicKeyRaw(publicKeyPem));
}

function derivePublicKeyRaw(publicKeyPem: string) {
  const ed25519SpkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
  const key = crypto.createPublicKey(publicKeyPem);
  const spki = key.export({ type: "spki", format: "der" }) as Buffer;
  if (
    spki.length === ed25519SpkiPrefix.length + 32 &&
    spki.subarray(0, ed25519SpkiPrefix.length).equals(ed25519SpkiPrefix)
  ) {
    return spki.subarray(ed25519SpkiPrefix.length);
  }
  return spki;
}

function base64UrlEncode(buffer: Buffer) {
  return buffer.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function buildGatewaySystemPrompt() {
  return [
    "你是 Research Lineage 网站中的科研助手。",
    "默认使用简体中文回答，除非用户明确要求其他语言。",
    "优先基于当前项目上下文回答，不要忽略页面里已有的论文、图谱和报告信息。",
    "保留用户问题和项目上下文中的中文原文，不要把中文改写成乱码、问号或占位符。",
    "如果你发现上下文里仍有疑似乱码，请明确指出具体字段，而不是自行猜测其含义。",
    "如果本地上下文不完整，就直接说明缺了什么，不要编造事实。",
    "如果 OpenClaw 已启用项目工具或 research-lineage skill，请在合适时使用。"
  ].join("\n");
}

function buildGatewayUserPrompt(params: {
  projectId: string;
  message: string;
  history: HistoryMessage[];
  context: ProjectContext;
}) {
  const project = params.context.project;
  const papers = (params.context.papers ?? []).slice(0, 10);
  const graphNodes = params.context.graph?.nodes ?? [];
  const graphEdges = params.context.graph?.edges ?? [];
  const methods = graphNodes
    .filter((node) => node.type === "Method")
    .map((node) => node.label)
    .slice(0, 6);
  const metrics = graphNodes
    .filter((node) => node.type === "Metric")
    .map((node) => node.label)
    .slice(0, 6);
  const recentHistory = params.history.slice(-6);

  const lines = [
    "当前网站项目上下文：",
    `- 项目 ID：${params.projectId}`,
    `- 研究主题：${project?.topic ?? "未知"}`,
    `- 研究目标：${project?.goal ?? "未提供"}`,
    `- 学科领域：${project?.domain ?? "未提供"}`,
    `- 数据源：${(project?.sources ?? []).join(", ") || "无"}`,
    "",
    `论文候选列表（当前展示 ${papers.length} 篇）：`
  ];

  if (papers.length === 0) {
    lines.push("- 还没有加载论文。");
  } else {
    for (const paper of papers) {
      const parts = [paper.title];
      if (paper.year) {
        parts.push(String(paper.year));
      }
      if (typeof paper.relevanceScore === "number") {
        parts.push(`相关度 ${paper.relevanceScore.toFixed(2)}`);
      }
      lines.push(`- ${parts.join(" | ")}`);
    }
  }

  lines.push("");
  lines.push("图谱快照：");
  lines.push(`- 节点数：${graphNodes.length}`);
  lines.push(`- 边数：${graphEdges.length}`);
  lines.push(`- 方法节点：${methods.join(", ") || "无"}`);
  lines.push(`- 指标节点：${metrics.join(", ") || "无"}`);
  lines.push("");
  lines.push("报告快照：");
  lines.push(`- 摘要：${params.context.report?.summary ?? "尚未生成"}`);
  lines.push(
    `- 研究空白：${
      params.context.report?.researchGaps.join(" | ") || "尚未生成"
    }`,
  );
  lines.push("");
  lines.push("最近网页对话历史：");

  if (recentHistory.length === 0) {
    lines.push("- 暂无历史对话。");
  } else {
    for (const message of recentHistory) {
      lines.push(`- ${message.role === "user" ? "用户" : "助手"}：${message.content}`);
    }
  }

  lines.push("");
  lines.push("用户当前请求：");
  lines.push(params.message.trim());
  lines.push("");
  lines.push("请直接回答，并尽量给出可执行的下一步建议。");

  return lines.join("\n");
}

function extractGatewayReply(response: GatewayAgentResponse, context: ProjectContext) {
  const payloads = response.result?.payloads ?? [];
  const textBlocks = payloads
    .map((payload) => normalizeOptionalString(payload.text))
    .filter((text): text is string => Boolean(text));

  if (textBlocks.length > 0) {
    return textBlocks.join("\n\n");
  }

  if (response.status === "in_flight") {
    return "OpenClaw reports that this session already has an in-flight run. Please wait a moment and try again.";
  }

  if (response.summary?.trim()) {
    return response.summary.trim();
  }

  const paperCount = context.papers?.length ?? 0;
  return `OpenClaw finished the request but returned no text payload. The current project context still includes ${paperCount} papers.`;
}

async function loadProjectContext(projectId: string): Promise<ProjectContext> {
  const [project, papers, report, graph] = await Promise.all([
    fetchJson(`/api/projects/${projectId}`),
    fetchJson(`/api/projects/${projectId}/papers`),
    fetchJson(`/api/projects/${projectId}/report`),
    fetchJson(`/api/projects/${projectId}/graph`)
  ]);

  return { project, papers, report, graph };
}

async function fetchJson(path: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return undefined;
    }
    return await response.json();
  } catch {
    return undefined;
  }
}

function buildMockReply(message: string, context: ProjectContext) {
  const lower = message.toLowerCase();
  const topic = context.project?.topic ?? "当前项目";
  const paperCount = context.papers?.length ?? 0;
  const topPapers = (context.papers ?? []).slice(0, 3).map((paper) => paper.title);
  const graphMethods = (context.graph?.nodes ?? [])
    .filter((node) => node.type === "Method")
    .map((node) => node.label)
    .slice(0, 3);
  const reportGaps = (context.report?.researchGaps ?? []).slice(0, 3);

  if (lower.includes("图谱")) {
    return {
      reply: `图谱里目前最值得优先检查的方法节点有：${
        graphMethods.join("、") || "暂时还没有提取到方法节点"
      }。建议先沿着这些节点去看它们分别连接了哪些论文和指标，再决定哪些关系需要人工校正。`,
      citations: topPapers
    };
  }

  if (lower.includes("报告") || lower.includes("总结")) {
    return {
      reply: `${
        context.report?.summary ?? `当前已整理 ${paperCount} 篇论文。`
      } 如果你现在要继续往下做，我会先人工复核“技术路线”和“研究空白”两部分，再决定是否需要补检索式。`,
      citations: topPapers
    };
  }

  if (lower.includes("下一步") || lower.includes("怎么做")) {
    return {
      reply: `围绕“${topic}”，我建议下一步按这个顺序推进：1. 在论文池里保留最关键的 5 到 10 篇；2. 在图谱页检查方法到指标的关系；3. 在报告页依据这些关系修正文案；4. 最后再把桥接模式切到真实的 OpenClaw。`,
      citations: topPapers
    };
  }

  if (lower.includes("论文")) {
    return {
      reply: `当前论文池里最靠前的几篇是：${
        topPapers.join("、") || "还没有论文"
      }。你可以先保留最有代表性的综述或总览论文，再补两到三篇具体方法论文，这样图谱会更稳定。`,
      citations: topPapers
    };
  }

  return {
    reply: `我已经拿到这个项目的网站上下文了。当前项目“${topic}”有 ${paperCount} 篇论文，报告里提到的研究空白包括：${
      reportGaps.join("、") || "还没有生成研究空白"
    }。现在这条回复来自 Web 侧 mock bridge，等你把环境变量切到 gateway 或 proxy 模式后，就能把同样的上下文转发给真正的 OpenClaw。`,
    citations: topPapers
  };
}

function parseScopes(rawValue?: string) {
  const scopes = rawValue
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return scopes && scopes.length > 0 ? scopes : ["operator.admin"];
}

function parsePositiveInteger(rawValue: string | undefined, fallbackValue: number) {
  if (!rawValue?.trim()) {
    return fallbackValue;
  }
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function normalizeOptionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function formatBridgeError(error: unknown) {
  if (error instanceof GatewayRequestError) {
    return `OpenClaw Gateway request failed${error.code ? ` (${error.code})` : ""}: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown bridge error";
}

function isGatewayEventFrame(value: unknown): value is GatewayEventFrame {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const frame = value as Record<string, unknown>;
  return frame.type === "event" && typeof frame.event === "string";
}

function isGatewayResponseFrame(value: unknown): value is GatewayResponseFrame {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const frame = value as Record<string, unknown>;
  return frame.type === "res" && typeof frame.id === "string" && typeof frame.ok === "boolean";
}

async function dataToString(data: unknown) {
  if (typeof data === "string") {
    return data;
  }

  if (data instanceof Blob) {
    return await data.text();
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString("utf-8");
  }

  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString("utf-8");
  }

  return String(data);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(message));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function sleep(timeoutMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, timeoutMs);
  });
}
