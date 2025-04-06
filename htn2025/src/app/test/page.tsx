"use client";

import { useState } from "react";

export default function VideoLinkTranscriber() {
  const [videoUrl, setVideoUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTranscribe = async () => {
    setLoading(true);
    setError("");
    setTranscript("");

    try {
      const res = await fetch("../api/speechrand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Transcription failed");

      setTranscript(data.text);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-2">Transcribe a Video by URL</h1>
      <input
        type="text"
        placeholder="Paste MP4 video URL"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        className="w-full border p-2 mb-2"
      />
      <button
        onClick={handleTranscribe}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Transcribing..." : "Submit"}
      </button>

      {error && <p className="text-red-600 mt-2">Error: {error}</p>}

      {transcript && (
        <div className="mt-4 bg-gray-100 p-3 rounded border">
          <h2 className="text-lg font-medium">Transcript:</h2>
          <p className="whitespace-pre-wrap">{transcript}</p>
        </div>
      )}
    </div>
  );
}