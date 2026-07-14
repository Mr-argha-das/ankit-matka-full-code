// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { API_URL } from "../../../config";

// export default function GameRates() {
//   const token = localStorage.getItem("accessToken");
//   const headers = { Authorization: `Bearer ${token}` };

//   const [form, setForm] = useState({
//     // ---- TYPE 1 DEFAULT VALUES ----
//     single_digit_1: 10,
//     jodi_digit_1: 10,
//     single_pana_1: 10,
//     double_pana_1: 10,
//     tripple_pana_1: 10,
//     half_sangam_1: 10,
//     full_sangam_1: 10,
//     left_digit_1: 10,
//     right_digit_1: 10,
//     starline_single_digit_1: 10,
//     starline_single_pana_1: 10,
//     starline_double_pana_1: 10,
//     starline_tripple_pana_1: 10,

//     // ---- TYPE 2 DEFAULT VALUES ----
//     single_digit_2: 100,
//     jodi_digit_2: 995,
//     single_pana_2: 1500,
//     double_pana_2: 3000,
//     tripple_pana_2: 7000,
//     half_sangam_2: 10000,
//     full_sangam_2: 100000,
//     left_digit_2: 100,
//     right_digit_2: 100,
//     starline_single_digit_2: 100,
//     starline_single_pana_2: 1500,
//     starline_double_pana_2: 3000,
//     starline_tripple_pana_2: 7000,
//   });

//   // Fetch existing rate chart
//   const fetchRates = async () => {
//     try {
//       const res = await axios.get(`${API_URL}/api/admin/rate/`, { headers });
//       const data = res.data;

//       if (data) {
//         setForm((prev) => ({
//           ...prev,
//           ...data, // fills all fields automatically
//         }));
//       }
//     } catch (err) {
//       console.log("Rate fetch error:", err);
//     }
//   };

//   useEffect(() => {
//     fetchRates();
//   }, []);

//   // Submit handler
//   const handleSubmit = async () => {
//     try {
//       await axios.post(`${API_URL}/api/admin/rate`, form, { headers });

//       alert("Rate Chart Updated Successfully!");
//     } catch (err) {
//       console.log("Rate Update Error:", err.response || err);
//       alert("Failed to update rate chart");
//     }
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold mb-6">Game Rate Chart</h2>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* LEFT COLUMN VALUES — Type 1 */}
//         <div className="space-y-5">
//           {[
//             "single_digit_1",
//             "jodi_digit_1",
//             "single_pana_1",
//             "double_pana_1",
//             "tripple_pana_1",
//             "half_sangam_1",
//             "full_sangam_1",
//             "left_digit_1",
//             "right_digit_1",
//             "starline_single_digit_1",
//             "starline_single_pana_1",
//             "starline_double_pana_1",
//             "starline_tripple_pana_1",
//           ].map((field) => (
//             <div key={field}>
//               <label className="font-semibold capitalize">
//                 {field.replace(/_/g, " ")}
//               </label>
//               <input
//                 type="number"
//                 className="w-full p-3 border rounded-lg mt-1"
//                 value={form[field] || ""}
//                 onChange={(e) => setForm({ ...form, [field]: e.target.value })}
//               />
//             </div>
//           ))}
//         </div>

//         {/* RIGHT COLUMN VALUES — Type 2 */}
//         <div className="space-y-5">
//           {[
//             "single_digit_2",
//             "jodi_digit_2",
//             "single_pana_2",
//             "double_pana_2",
//             "tripple_pana_2",
//             "half_sangam_2",
//             "full_sangam_2",
//             "left_digit_2",
//             "right_digit_2",
//             "starline_single_digit_2",
//             "starline_single_pana_2",
//             "starline_double_pana_2",
//             "starline_tripple_pana_2",
//           ].map((field) => (
//             <div key={field}>
//               <label className="font-semibold capitalize">
//                 {field.replace(/_/g, " ")}
//               </label>
//               <input
//                 type="number"
//                 className="w-full p-3 border rounded-lg mt-1"
//                 value={form[field] || ""}
//                 onChange={(e) => setForm({ ...form, [field]: e.target.value })}
//               />
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Submit Button */}
//       <div className="mt-8">
//         <button
//           onClick={handleSubmit}
//           className="bg-blue-600 text-white px-8 py-3 rounded-lg"
//         >
//           Submit
//         </button>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config";

export default function GameRates() {
  const token = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  const [form, setForm] = useState({
    // -------- RATE (_1) --------
    single_digit_1: 10,
    jodi_digit_1: 10,
    single_pana_1: 10,
    double_pana_1: 10,
    tripple_pana_1: 10,
    half_sangam_1: 10,
    full_sangam_1: 10,
    left_digit_1: 10,
    right_digit_1: 10,
    starline_single_digit_1: 10,
    starline_single_pana_1: 10,
    starline_double_pana_1: 10,
    starline_tripple_pana_1: 10,

    // -------- MULTIPLIER --------
    single_digit_x: 10,
    jodi_digit_x: 10,
    single_pana_x: 10,
    double_pana_x: 10,
    tripple_pana_x: 10,
    half_sangam_x: 10,
    full_sangam_x: 10,
    left_digit_x: 10,
    right_digit_x: 10,
    starline_single_digit_x: 10,
    starline_single_pana_x: 10,
    starline_double_pana_x: 10,
    starline_tripple_pana_x: 10,

    // -------- WIN (_2) --------
    single_digit_2: 100,
    jodi_digit_2: 995,
    single_pana_2: 1500,
    double_pana_2: 3000,
    tripple_pana_2: 7000,
    half_sangam_2: 10000,
    full_sangam_2: 100000,
    left_digit_2: 100,
    right_digit_2: 100,
    starline_single_digit_2: 100,
    starline_single_pana_2: 1500,
    starline_double_pana_2: 3000,
    starline_tripple_pana_2: 7000,
  });

  const fetchRates = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/rate/`, { headers });
      if (res.data) setForm((prev) => ({ ...prev, ...res.data }));
    } catch (err) {
      console.log("Rate fetch error:", err);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value === "" ? "" : Number(value),
    }));
  };

  const handleSubmit = async () => {
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === "" ? 0 : v])
    );

    try {
      await axios.post(`${API_URL}/api/admin/rate`, payload, { headers });
      alert("Rate Chart Updated Successfully!");
    } catch (err) {
      console.log(err);
      alert("Failed to update rate chart");
    }
  };

  return (
    <div className="p-3">
      <h2 className="text-2xl font-bold mb-6">Game Rate Chart</h2>

      <div className="grid grid-cols-3 md:grid-cols-3 gap-3">
        {/* RATE (_1) */}
        <div className="space-y-4">
          {Object.keys(form)
            .filter((k) => k.endsWith("_1"))
            .map((k) => (
              <Field key={k} name={k} value={form[k]} onChange={handleChange} />
            ))}
        </div>

        {/* x */}
        <div className="space-y-4">
          {Object.keys(form)
            .filter((k) => k.endsWith("_x"))
            .map((k) => (
              <Field key={k} name={k} value={form[k]} onChange={handleChange} />
            ))}
        </div>

        {/* WIN (_2) */}
        <div className="space-y-4">
          {Object.keys(form)
            .filter((k) => k.endsWith("_2"))
            .map((k) => (
              <Field key={k} name={k} value={form[k]} onChange={handleChange} />
            ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-lg"
      >
        Submit
      </button>
    </div>
  );
}

function Field({ name, value, onChange }) {
  return (
    <div>
      <label className="font-light text-[12px] capitalize">
        {name.replace(/_/g, " ")}
      </label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 border-[0.5px] border-gray-50/20 rounded-lg mt-1"
      />
    </div>
  );
}
