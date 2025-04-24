export async function POST(req: NextRequest) {
  try {
    const { videoURL } = await req.json();
    console.log("🔗 Video URL received:", videoURL);

    if (!videoURL) {
      return NextResponse.json({ error: "Missing videoUrl" }, { status: 400 });
    }

    // Fetch the file
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const fileRes = await fetch(videoURL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!fileRes.ok) throw new Error("Failed to download video file");
    console.log("✅ Video downloaded successfully");

    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("📦 Video buffer size:", buffer.length / 1024 / 1024, "MB");

    const formData = new FormData();
    formData.append("file", bufferToStream(buffer), {
      filename: "video.mp4",
      contentType: "video/mp4",
    });
    formData.append("model", "whisper-1");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData as any,
    });

    const result = await whisperRes.json();
    console.log("🧠 Whisper API result:", result);

    if (!whisperRes.ok) {
      return NextResponse.json({ error: result.error?.message || "Whisper API failed" }, { status: 500 });
    }

    return NextResponse.json({ text: result.text });
  } catch (err: any) {
    console.error("❌ Transcription error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}

export const config = {
  runtime: "nodejs",
};
