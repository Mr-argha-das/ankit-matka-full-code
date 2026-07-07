import React, { useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
import "tinymce/skins/ui/oxide-dark/skin.min.css";
import "tinymce/skins/content/dark/content.min.css";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autolink";
import "tinymce/plugins/lists";
import "tinymce/plugins/link";
import "tinymce/plugins/image";
import "tinymce/plugins/charmap";
import "tinymce/plugins/preview";
import "tinymce/plugins/anchor";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/code";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/insertdatetime";
import "tinymce/plugins/media";
import "tinymce/plugins/table";
import "tinymce/plugins/help";
import "tinymce/plugins/wordcount";
import axios from "axios";
import { API_URL } from "../../config";

const editorInit = {
  height: 320,
  menubar: false,
  license_key: "gpl",
  skin: false,
  content_css: false,
  content_style: "body { background: #1f2d3a; color: #f8fafc; }",
  plugins: [
    "advlist autolink lists link image charmap preview anchor",
    "searchreplace visualblocks code fullscreen",
    "insertdatetime media table help wordcount",
  ],
  toolbar:
    "undo redo | bold italic underline | " +
    "alignleft aligncenter alignright alignjustify | " +
    "bullist numlist outdent indent | removeformat",
};

export default function AdminHowToPlay() {
  const [content, setContent] = useState("");
  const [video_id, setVideoId] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = API_URL;

  // new
  // Load saved content
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/howtoplay/get`);
        setContent(res.data.content || "");
        setVideoId(res.data.video_id || "");
      } catch (error) {
        console.log("Error loading data", error);
      }
    };
    fetchData();
  }, []);

  // Save / Update
  const handleSubmit = async () => {
    if (!content) return alert("Content cannot be empty!");
    setLoading(true);

    try {
      await axios.post(`${API_BASE}/howtoplay/update`, {
        content,
        video_id,
      });

      alert("How To Play Updated Successfully!");
    } catch {
      alert("Error saving data.");
    }

    setLoading(false);
  };

  // Delete
  const handleDelete = async () => {
    if (!confirm("Are you sure?")) return;

    try {
      await axios.delete(`${API_BASE}/howtoplay/delete`);
      setContent("");
      setVideoId("");
      alert("Deleted Successfully");
    } catch {
      alert("Error deleting");
    }
  };

  return (
    <div className=" mx-auto mt-2 p-3 rounded-xl shadow-lg text-white">
      <h1 className="text-xl font-semibold mb-4">How to Play Content</h1>

      <Editor
        value={content}
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        init={editorInit}
        onEditorChange={(value) => setContent(value)}
      />

      {/* YouTube Input */}
      <label className="block mt-6 mb-2 text-sm font-medium">
        YouTube Video ID
      </label>

      <input
        type="text"
        className="w-full px-4 py-2 border border-gray-50/15 rounded-md text-white"
        placeholder="Enter YouTube video ID"
        value={video_id}
        onChange={(e) => setVideoId(e.target.value)}
      />

      {/* Buttons */}
      <div className="flex gap-4 mt-5">
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Submit"}
        </button>

        <button
          onClick={handleDelete}
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
