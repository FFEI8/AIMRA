import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// ── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ModelConfig {
  provider: string;
  endpoint?: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  [key: string]: unknown;
}

interface ChatRequestBody {
  message: string;
  systemPrompt?: string;
  context?: string;
  history?: ChatMessage[];
  stream?: boolean;
  modelConfig?: ModelConfig;
}

// ── Custom OpenAI-compatible provider handler ────────────────────────────────

async function handleCustomProvider(
  body: ChatRequestBody,
  modelConfig: ModelConfig
) {
  const messages: ChatMessage[] = [];

  if (body.systemPrompt) {
    messages.push({ role: "system", content: body.systemPrompt });
  }

  if (body.context) {
    messages.push({ role: "system", content: body.context });
  }

  if (body.history && body.history.length > 0) {
    messages.push(...body.history);
  }

  messages.push({ role: "user", content: body.message });

  const requestPayload: Record<string, unknown> = {
    model: modelConfig.model || "gpt-3.5-turbo",
    messages,
    stream: body.stream ?? false,
  };

  if (modelConfig.temperature !== undefined) {
    requestPayload.temperature = modelConfig.temperature;
  }
  if (modelConfig.max_tokens !== undefined) {
    requestPayload.max_tokens = modelConfig.max_tokens;
  }

  const endpoint = modelConfig.endpoint!;
  const url = endpoint.endsWith("/chat/completions")
    ? endpoint
    : `${endpoint.replace(/\/+$/, "")}/chat/completions`;

  if (body.stream) {
    // ── Streaming with custom provider ─────────────────────────────────────
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${modelConfig.apiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Custom provider error (${response.status}): ${errorText}`
      );
    }

    if (!response.body) {
      throw new Error("Custom provider returned no response body for streaming");
    }

    // Forward the SSE stream from the custom provider
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") {
              if (trimmed === "data: [DONE]") {
                controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
              }
              continue;
            }

            if (trimmed.startsWith("data: ")) {
              const jsonStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(jsonStr);
                const content =
                  parsed.choices?.[0]?.delta?.content ??
                  parsed.choices?.[0]?.text ??
                  "";
                if (content) {
                  const data = JSON.stringify({
                    choices: [{ delta: { content } }],
                  });
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${data}\n\n`)
                  );
                }
              } catch {
                // If we can't parse the JSON, forward the raw chunk
                controller.enqueue(
                  new TextEncoder().encode(`data: ${jsonStr}\n\n`)
                );
              }
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
      cancel() {
        reader.cancel();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } else {
    // ── Non-streaming with custom provider ─────────────────────────────────
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${modelConfig.apiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Custom provider error (${response.status}): ${errorText}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  }
}

// ── Default provider handler (z-ai-web-dev-sdk) ──────────────────────────────

async function handleDefaultProvider(body: ChatRequestBody) {
  const zai = await ZAI.create();

  const messages: ChatMessage[] = [];

  if (body.systemPrompt) {
    messages.push({ role: "system", content: body.systemPrompt });
  }

  if (body.context) {
    messages.push({ role: "system", content: body.context });
  }

  if (body.history && body.history.length > 0) {
    messages.push(...body.history);
  }

  messages.push({ role: "user", content: body.message });

  const completion = await zai.chat.completions.create({
    messages,
    stream: body.stream ?? false,
  });

  if (body.stream) {
    // ── Streaming with z-ai-web-dev-sdk ────────────────────────────────────
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            let content = "";

            if (typeof chunk === "object" && chunk !== null) {
              // Parsed JSON object format
              content =
                chunk.choices?.[0]?.delta?.content ??
                chunk.choices?.[0]?.text ??
                "";
            } else if (chunk instanceof Uint8Array) {
              // Raw SSE byte array – decode and parse
              const text = new TextDecoder().decode(chunk, { stream: true });
              const lines = text.split("\n");

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === "data: [DONE]") {
                  if (trimmed === "data: [DONE]") {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  }
                  continue;
                }

                if (trimmed.startsWith("data: ")) {
                  const jsonStr = trimmed.slice(6);
                  try {
                    const parsed = JSON.parse(jsonStr);
                    const c =
                      parsed.choices?.[0]?.delta?.content ??
                      parsed.choices?.[0]?.text ??
                      "";
                    if (c) content += c;
                  } catch {
                    // Forward unparseable SSE lines as-is
                    controller.enqueue(encoder.encode(`${trimmed}\n\n`));
                  }
                }
              }
            }

            if (content) {
              const data = JSON.stringify({
                choices: [{ delta: { content } }],
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } else {
    // ── Non-streaming with z-ai-web-dev-sdk ────────────────────────────────
    return NextResponse.json(completion);
  }
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();

    const { message, modelConfig } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "A non-empty 'message' field is required." },
        { status: 400 }
      );
    }

    // Decide which provider to use
    const useCustomProvider =
      modelConfig &&
      modelConfig.provider !== "default" &&
      modelConfig.endpoint &&
      modelConfig.apiKey;

    if (useCustomProvider) {
      return await handleCustomProvider(body, modelConfig!);
    } else {
      return await handleDefaultProvider(body);
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    console.error("[/api/chat] Error:", message);

    return NextResponse.json(
      { error: `Chat completion failed: ${message}` },
      { status: 500 }
    );
  }
}
