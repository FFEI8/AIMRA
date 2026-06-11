import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: "An 'audio' file is required in the form data." },
        { status: 400 }
      );
    }

    // Convert the audio file to a base64 string
    const arrayBuffer = await audioFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64 = Buffer.from(uint8Array).toString("base64");

    // Call the z-ai-web-dev-sdk ASR endpoint
    const zai = await ZAI.create();
    const result = await zai.audio.asr.create({
      file_base64: base64,
    });

    // Extract the transcribed text from the result
    const text =
      result?.text ??
      result?.choices?.[0]?.text ??
      (typeof result === "string" ? result : null);

    if (!text) {
      return NextResponse.json(
        { error: "ASR returned no transcribed text." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    console.error("[/api/asr] Error:", message);

    return NextResponse.json(
      { error: `Speech-to-text failed: ${message}` },
      { status: 500 }
    );
  }
}
