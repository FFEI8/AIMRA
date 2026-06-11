import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body as { text?: string };

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "A non-empty 'text' field is required." },
        { status: 400 }
      );
    }

    // Truncate to a maximum of 2000 characters
    const truncatedText = text.length > 2000 ? text.slice(0, 2000) : text;

    // Call the z-ai-web-dev-sdk TTS endpoint
    const zai = await ZAI.create();
    const audio = await zai.audio.tts.create({
      input: truncatedText,
      voice: "alloy",
    });

    // The SDK may return audio data in different formats
    let audioBuffer: Buffer | Uint8Array | null = null;

    if (audio instanceof Uint8Array) {
      audioBuffer = audio;
    } else if (audio instanceof ArrayBuffer) {
      audioBuffer = new Uint8Array(audio);
    } else if (Buffer.isBuffer(audio)) {
      audioBuffer = audio;
    } else if (audio?.data) {
      // Some SDK responses wrap the audio in a data property
      if (typeof audio.data === "string") {
        // Base64-encoded audio
        audioBuffer = Buffer.from(audio.data, "base64");
      } else if (audio.data instanceof Uint8Array) {
        audioBuffer = audio.data;
      } else if (audio.data instanceof ArrayBuffer) {
        audioBuffer = new Uint8Array(audio.data);
      } else if (Buffer.isBuffer(audio.data)) {
        audioBuffer = audio.data;
      }
    } else if (typeof audio === "string") {
      // Raw base64 response
      audioBuffer = Buffer.from(audio, "base64");
    }

    if (!audioBuffer) {
      return NextResponse.json(
        { error: "TTS returned no audio data." },
        { status: 500 }
      );
    }

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    console.error("[/api/tts] Error:", message);

    return NextResponse.json(
      { error: `Text-to-speech failed: ${message}` },
      { status: 500 }
    );
  }
}
