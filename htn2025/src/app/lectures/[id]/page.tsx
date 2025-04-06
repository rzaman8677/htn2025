'use client';

import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function LectureDetails({ params }: { params: Promise<{ id: string }> }) {
  const [lecture, setLecture] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
    const[transcript,setTranscript] = useState("");
  const [error, setError] = useState("");

  const handleBack = () => {
    router.push('/dashboard');
  };

  const [unwrappedParams, setUnwrappedParams] = useState<any>(null);

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setUnwrappedParams(resolvedParams);
    };
    fetchParams();
  }, [params]);

  useEffect(() => {
    if (!unwrappedParams) return; 

    const fetchLecture = async () => {
      const ref = doc(db, 'lectures', unwrappedParams.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setLecture({
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        });
        setTranscript(data.transcription);
      }
      setLoading(false);
    };
    fetchLecture();
  }, [unwrappedParams]);

  if (loading) return <p>Loading...</p>;
  if (!lecture) return <p>Lecture not found.</p>;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(lecture.createdAt);


  
  const askQuestion = async () => {
    setLoading(true);
    setError('');
    setAnswer('');

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

  if (loading) return <p>Loading...</p>;
  if (!lecture) return <p>Lecture not found.</p>;

  return (
    <div className="relative">
      {/* Back button on far left */}
      <div
        onClick={handleBack}
        className="absolute left-4 top-6 cursor-pointer text-black hover:underline"
      >
        ←
      </div>

      {/* Centered content */}
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">{lecture.title}</h1>

        <div className="aspect-video mb-6">
          {lecture.videoUrl ? (
            <video
              controls
              src={lecture.videoUrl}
              className="w-full h-full object-contain rounded-xl shadow"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-xl">
              <span className="text-gray-500">No video available</span>
            </div>
          )}
        </div>

        <p className="text-base font-mono text-gray-800 mb-2">
          <span className="font-semibold">Code:</span> {lecture.privateCode}
        </p>

        <p className="text-sm text-gray-500">Created on: {formattedDate}</p>

        {/* Display transcription if available */}
        {lecture.transcription && (
          <div className="mt-6 p-4 bg-gray-100 rounded-xl">
            <h2 className="text-xl font-semibold mb-2">Transcription</h2>
            <p className="text-base text-gray-700">{lecture.transcription}</p>
          </div>
        )}

<div className="mt-8 p-4 bg-gray-100 rounded-xl">
          <h2 className="text-xl font-semibold mb-2">Ask a Question about the Transcript</h2>

          <div className="mb-4">
            <label className="block text-gray-700">Your Question:</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Ask something..."
            />
          </div>

          <button
            className="w-full bg-blue-500 text-white p-2 rounded-lg"
            onClick={askQuestion}
            disabled={loading}
          >
            {loading ? "Asking..." : "Ask"}
          </button>

          {/* Display Answer */}
          {answer && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
              <h3 className="font-semibold text-gray-800">Answer:</h3>
              <p className="text-gray-700">{answer}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
            


      </div>
    </div>
  );
}
