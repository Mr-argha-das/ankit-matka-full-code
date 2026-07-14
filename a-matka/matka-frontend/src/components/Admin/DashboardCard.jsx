import React from "react";

export default function DashboardCard({
  title,
  value,
  subtext,
  color,
  icon,
  link,
}) {
  return (
    <a
      href={link}
      className="bg-white/10 rounded-xl shadow-md p-4 flex  justify-between items-center"
    >
      <div>
        <h3 className="text-white text-sm">{title}</h3>
        <p className="text-2xl font-semibold mt-1 text-gray-200">{value}</p>
        {subtext && <p className="text-xs text-gray-300">{subtext}</p>}
      </div>
      <div
        className={`w-10 h-10 flex mt-6 items-center justify-center rounded-full text-white`}
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
    </a>
  );
}
