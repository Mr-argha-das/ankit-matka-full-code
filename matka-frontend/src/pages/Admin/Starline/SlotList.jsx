import React from "react";

const SlotList = ({ slots, loading, onRefresh }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-indigo-600">
          📋 Existing Slots
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center space-x-1 p-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m15.356-2H15V2M7 13.582V19H.582m0 0a8.001 8.001 0 0015.356-2H17v-5"
            ></path>
          </svg>
          <span>{loading ? "Refreshing..." : "Refresh List"}</span>
        </button>
      </div>

      {loading && slots.length === 0 ? (
        <p className="text-gray-500">Loading slots...</p>
      ) : slots.length === 0 ? (
        <p className="text-gray-500">No Starline slots found. Add one above!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Games Allowed
                </th>
                {/* <th className="px-6 py-3"></th> // For actions like Edit/Delete */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {slots.map((slot) => (
                <tr key={slot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {slot.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {slot.start_time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {slot.end_time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {slot.games.map((game) => (
                      <span
                        key={game}
                        className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2 mb-1"
                      >
                        {game}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SlotList;
