import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data";
import fetch from "node-fetch";
import { Readable } from "stream";

// Utility: Turn a Buffer into a Readable Stream
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(req: NextRequest) {
  try {
    const { videoURL } = await req.json();
    
    if (!videoURL) {
      return NextResponse.json({ error: "Missing videoUrl" }, { status: 400 });
    }

    // Step 1: Download the video file from the given URL
    const fileRes = await fetch(videoURL);
    if (!fileRes.ok) throw new Error("Failed to download video file");

    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 2: Prepare FormData for OpenAI Whisper API
    const formData = new FormData();
    formData.append("file", bufferToStream(buffer), {
      filename: "video.mp4",
      contentType: "video/mp4",
    });
    formData.append("model", "whisper-1");

    // Step 3: Send to OpenAI Whisper API
    const whisperRes = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders?.(),
        },
        body: formData as any,
      }
    );

    const result = await whisperRes.json() as { text?: string; error?: { message: string } };

    if (!whisperRes.ok) {
      return NextResponse.json(
        { error: result.error?.message ||  "Whisper API failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ text: result.text });
  } catch (err: any) {
    console.error("❌ Transcription error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}