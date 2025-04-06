"use client";
import { useState } from "react";
import styles from "./ask.module.css";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handles file input change
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTranscript(text);
    };
    reader.readAsText(file);
  };

  const askQuestion = async () => {
    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript, question }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAnswer(data.answer);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Ask a Question about Your Transcript</h1>

      {/* File Upload */}
      <div className={styles.fileUpload}>
        <label htmlFor="fileInput">Upload Transcript (.txt):</label>
        <input
          type="file"
          id="fileInput"
          accept=".txt"
          onChange={handleFileUpload}
        />
      </div>

      {/* Transcript Preview */}
      {transcript && (
        <div className={styles.transcriptPreview}>
          <h3>Transcript Preview:</h3>
          <p>{transcript.slice(0, 300)}...</p>
        </div>
      )}

      {/* Question Input */}
      <div className={styles.questionInput}>
        <label htmlFor="questionInput">Your Question:</label>
        <input
          type="text"
          id="questionInput"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something..."
        />
      </div>

      {/* Ask Button */}
      <button
        className={styles.askButton}
        onClick={askQuestion}
        disabled={loading}
      >
        {loading ? "Asking..." : "Ask"}
      </button>

      {/* Error Message */}
      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Answer Display */}
      {answer && (
        <div className={styles.answerContainer}>
          <h3>Answer:</h3>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
