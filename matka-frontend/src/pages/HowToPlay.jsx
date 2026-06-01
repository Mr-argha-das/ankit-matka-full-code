import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { ArrowLeft } from "lucide-react";

export default function HowToPlay() {
  const [content, setContent] = useState("");
  const [videoId, setVideoId] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await axios.get(`${API_URL}/howtoplay/get`);
      setContent(res.data?.content || "");
      setVideoId(res.data?.video_id || "");
    } catch (err) {
      console.error("Error loading How To Play:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-white">
        Loading How To Play...
      </div>
    );
  }

  return (
    <div className="min-h-screen mx-auto max-w-md  text-white ">
      {/* Title */}
      <div className="w-full relative bg-gradient-to-b from-black to-black/0 py-2 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="p-2 pl-4 z-10 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-md z-0 w-full absolute   justify-between font-bold bg-gradient-to-b from-black to-black/0 px-4 py-2  flex justify-center items-center gap-2">
          <span className="flex gap-2 text-md items-center">How to Play</span>
        </h2>
        <a className="pr-4 z-10"></a>
      </div>

      {/* Video Section */}
      {videoId ? (
        <div className="flex justify-center mb-3 p-3 ">
          <iframe
            className="rounded-xl shadow-lg w-full max-w-3xl aspect-video"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="How to Play Video"
            frameBorder="0"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="text-center text-gray-400 mb-10">
          No tutorial video available.
        </p>
      )}

      {/* Content Section */}
      <div className="bg-white/5 p-5 mx-3 rounded-2xl shadow-lg backdrop-blur-lg">
        {content ? (
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="text-gray-300 text-center">
            No instructions added yet.
          </p>
        )}
      </div>
    </div>
  );
}
