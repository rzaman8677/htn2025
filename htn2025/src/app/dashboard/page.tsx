'use client';

import { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Trash2 } from 'lucide-react';

type Lecture = {
  id: string;
  title: string;
  text?: string;
  videoUrl?: string;
  createdAt: Date;
  visibility: 'public' | 'private';
  privateCode?: string; // Add privateCode field for private lectures
};

export default function DashboardPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null); // Track lecture being deleted
  const [confirmDelete, setConfirmDelete] = useState(false); // Confirm deletion modal state
  const [showModal, setShowModal] = useState(false); // Control modal visibility
  const [newTitle, setNewTitle] = useState(''); // Store new lecture title
  const [searchTerm, setSearchTerm] = useState(''); // Search term for Discover tab
  const [activeTab, setActiveTab] = useState('lectures'); // Manage active tab (lectures or discover)
  const [visibility, setVisibility] = useState<'public' | 'private'>('public'); // Track visibility state
  const [privateCode, setPrivateCode] = useState<string>(''); // Store private code for private lectures
  const [codeSearchTerm, setCodeSearchTerm] = useState(''); // Store private code search term


  const generateRandomCode = async (): Promise<string> => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    let isUnique = false;

    while (!isUnique) {
      // Generate a random 6-character code
      code = '';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // Check if this code already exists in the database
      const lectureQuery = query(collection(db, 'lectures'), where('privateCode', '==', code));
      const querySnapshot = await getDocs(lectureQuery);

      // If no lectures have this code, it is unique
      if (querySnapshot.empty) {
        isUnique = true;
      }
    }

    return code;
  };

  // Fetch random public lectures for Discover tab
  const fetchDiscoverLectures = async () => {
    const snapshot = await getDocs(
      query(collection(db, 'lectures'), where('visibility', '==', 'public'), orderBy('createdAt', 'desc'), limit(20))
    );
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Lecture[];
    setLectures(data);
    setLoading(false);
  };

  const fetchLectureByCode = async () => {
    const snapshot = await getDocs(
      query(collection(db, 'lectures'), where('privateCode', '==', codeSearchTerm), where('visibility', '==', 'private'))
    );
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Lecture[];
    setLectures(data);
    setLoading(false);
  };

  // Fetch all lectures for Your Lectures tab
  const fetchLectures = async () => {
    const snapshot = await getDocs(collection(db, 'lectures'));
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Lecture[];
    setLectures(data);
    setLoading(false);
  };

  // Create a new lecture
  const createLecture = async () => {
    if (!newTitle) return; // Don't create if title is missing

    const newLecture: Lecture = {
      title: newTitle,
      text: '',
      videoUrl: '',
      createdAt: new Date(),
      visibility,
      privateCode: await generateRandomCode() , // Generate code only if private
    };

    const docRef = await addDoc(collection(db, 'lectures'), newLecture);
    setNewTitle(''); // Reset the title input after creation
    setShowModal(false); // Close the modal
    fetchLectures(); // Refresh the list after adding
  };

  // Handle deleting a lecture
  const handleDelete = async (id: string) => {
    if (confirmDelete) {
      const lectureRef = doc(db, 'lectures', id);
      await deleteDoc(lectureRef); // Delete the lecture from Firestore
      await fetchLectures(); // Refresh the list after deletion
      setConfirmDelete(false); // Reset confirmation state
      setDeletingId(null); // Reset the ID of the lecture being deleted
    } else {
      setDeletingId(id); // Set lecture ID to confirm deletion
      setConfirmDelete(true); // Show confirmation dialog
    }
  };

  // Search for lectures
  const searchLectures = async () => {
    if (searchTerm.trim() === '') {
      // If search term is empty, fetch discover lectures
      fetchDiscoverLectures();
    } else {
      const q = query(
        collection(db, 'lectures'),
        where('title', '>=', searchTerm),
        where('title', '<=', searchTerm + '\uf8ff')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Lecture[];

      // Filter out private lectures for the Discover tab
      if (activeTab === 'discover') {
        setLectures(data.filter((lecture) => lecture.visibility === 'public'));
      } else {
        setLectures(data);
      }
    }
  };

  // Switch active tab
  const switchTab = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'lectures') {
      fetchLectures();
    } else if (tab === 'discover') {
      fetchDiscoverLectures(); // Fetch public lectures for Discover
    }else if (tab === 'codeSearch') {
        setLectures([]); // Clear lectures and prepare for code search
      }
    
  };

  useEffect(() => {
    if (activeTab === 'lectures') {
      fetchLectures();
    } else if (activeTab === 'discover') {
      fetchDiscoverLectures();
    }else if (activeTab === 'codeSearch') {
        fetchLectureByCode();
      }
  }, [activeTab]);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Your Lectures</h1>

      {/* Tab Navigation */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => switchTab('lectures')}
          className={`text-lg ${activeTab === 'lectures' ? 'font-bold' : ''}`}
        >
          Your Lectures
        </button>
        <button
          onClick={() => switchTab('discover')}
          className={`text-lg ${activeTab === 'discover' ? 'font-bold' : ''}`}
        >
          Discover
        </button>
        <button
          onClick={() => switchTab('codeSearch')}
          className={`text-lg ${activeTab === 'codeSearch' ? 'font-bold' : ''}`}
        >
          Search by Code
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'lectures' && (
        <div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {lectures.map(lecture => (
                <div
                  key={lecture.id}
                  className="bg-white rounded-xl shadow p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold mb-2">
                      {lecture.title || 'Untitled Lecture'}
                    </h2>
                    <button
                      onClick={() => handleDelete(lecture.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                    {lecture.videoUrl ? (
                      <video src={lecture.videoUrl} controls className="w-full h-full" />
                    ) : (
                      <span>No video</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mt-2">
                    Created on: {lecture.createdAt.toDate().toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Visibility: {lecture.visibility}
                  </p>

                  {/* Show the private code for both public and private lectures */}
                  {lecture.visibility === 'private' && (
                    <p className="text-sm text-gray-500">Private Code: {lecture.privateCode}</p>
                  )}
                  {lecture.visibility === 'public' && lecture.privateCode && (
                    <p className="text-sm text-gray-500">Code: {lecture.privateCode}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          

          {/* Plus button */}
          <button
            onClick={() => setShowModal(true)} // Show the modal on click
            className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      

{activeTab === 'discover' && (
        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchLectures()} // Trigger search on Enter
            placeholder="Search for lectures"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md"
          />

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {lectures.map(lecture => (
                <div
                  key={lecture.id}
                  className="bg-white rounded-xl shadow p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold mb-2">
                      {lecture.title || 'Untitled Lecture'}
                    </h2>
                  </div>

                  <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                    {lecture.videoUrl ? (
                      <video src={lecture.videoUrl} controls className="w-full h-full" />
                    ) : (
                      <span>No video</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mt-2">
                    Created on: {lecture.createdAt.toDate().toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

{activeTab === 'codeSearch' && (
        <div>
          <input
            type="text"
            value={codeSearchTerm}
            onChange={(e) => setCodeSearchTerm(e.target.value)}
            placeholder="Enter Private Code"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md"
          />
          <button
            onClick={fetchLectureByCode}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Search
          </button>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {lectures.map(lecture => (
                <div
                  key={lecture.id}
                  className="bg-white rounded-xl shadow p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold mb-2">
                      {lecture.title || 'Untitled Lecture'}
                    </h2>
                  </div>

                  <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                    {lecture.videoUrl ? (
                      <video src={lecture.videoUrl} controls className="w-full h-full" />
                    ) : (
                      <span>No video</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mt-2">
                    Created on: {lecture.createdAt.toDate().toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}


        </div>
      )}
      

      {/* Modal for adding new lecture */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Create a New Lecture</h2>

            {/* Title Input */}
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter Lecture Title"
              className="w-full p-3 mb-4 border border-gray-300 rounded-md"
            />

            {/* Visibility Checkbox */}
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={visibility === 'private'}
                onChange={() => setVisibility(visibility === 'public' ? 'private' : 'public')}
                id="visibility-toggle"
                className="mr-2"
              />
              <label htmlFor="visibility-toggle" className="text-sm">Private Lecture</label>
            </div>

            {/* Confirm Button */}
            <div className="flex justify-between">
              <button
                onClick={() => setShowModal(false)} // Close modal on cancel
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={createLecture} // Add the lecture and close modal
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deletingId && confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Are you sure you want to delete this lecture?</h2>
            <div className="flex justify-around">
              <button
                onClick={() => setConfirmDelete(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                No
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
