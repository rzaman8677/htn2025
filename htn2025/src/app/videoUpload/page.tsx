"use client";

import { useState } from "react";
import styles from "./Video.module.css";

export default function VideoUploadPage() {
  const [videoURL, setVideoURL] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");
    setFileName(file.name);

    try {
      // 1) Request the presigned URL
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          type: file.type,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || `Server error: ${res.status}`);
      }

      const { uploadUrl, key } = await res.json();

      // 2) Upload file directly to S3 (no 'x-amz-acl' header!)
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!putRes.ok) {
        const errorText = await putRes.text();
        throw new Error(`S3 upload failed: ${putRes.status} - ${errorText}`);
      }

      // We can form the public URL, but it won't actually be publicly accessible
      // unless your bucket policy allows s3:GetObject for everyone.
      const finalURL = `https://video-raiyanzaman.s3.amazonaws.com/${key}`;
      setVideoURL(finalURL);
    } catch (err: any) {
      console.error("Upload error details:", err);
      setError(err.message || "Upload failed. Check console for details.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>🎥 Upload Video (No ACLs)</h1>

      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className={styles.input}
        disabled={isUploading}
      />

      {isUploading && <p className={styles.uploading}>Uploading...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {videoURL && (
        <div className={styles.videoContainer}>
          <h2 className={styles.subheading}>Preview: {fileName}</h2>
          <video controls src={videoURL} className={styles.video} />
          <p className={styles.link}>
            Potential URL:{" "}
            <a href={videoURL} target="_blank" rel="noreferrer">
              {videoURL}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
