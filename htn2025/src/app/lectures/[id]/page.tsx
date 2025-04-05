// app/lectures/[id]/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function LectureDetails({ params }: { params: { id: string } }) {
  const [lecture, setLecture] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLecture = async () => {
      const ref = doc(db, 'lectures', params.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setLecture({
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        });
      }
      setLoading(false);
    };
    fetchLecture();
  }, [params.id]);

  if (loading) return <p>Loading...</p>;
  if (!lecture) return <p>Lecture not found.</p>;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(lecture.createdAt);

  return (
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
      <p className="text-sm text-gray-500">Created on: {formattedDate}</p>
    </div>
  );
}
