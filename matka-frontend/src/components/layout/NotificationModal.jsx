import { X } from "lucide-react";
import React from "react";

export default function NotificationModal({ html, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="backdrop-blur-2xl mx-3 border border-gray-50/20 rounded-xl shadow-xl w-full max-w-md p-6  relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-200 hover:text-black"
        >
          <X />
        </button>

        {/* <h2 className="text-xl font-bold mb-3 text-center">Notification</h2> */}

        {/* Render HTML from backend */}
        <div
          className="text-gray-200 text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* <button
          onClick={onClose}
          className="w-full mt-5 border border-gray-50/20 hover:bg-blue-700 text-white py-2 rounded-lg"
        >
          Close
        </button> */}
      </div>
    </div>
  );
}
