// import React, { useState } from "react";
// import {
//   Home,
//   Users,
//   Target,
//   FileText,
//   Wallet,
//   Settings,
//   Bell,
//   Layers,
//   UserCog,
//   ChevronDown,
//   QrCode,
//   Star,
//   ChevronUp,
//   ChevronDownIcon,
// } from "lucide-react";
// import { MdMoney } from "react-icons/md";
// import { SiMarketo } from "react-icons/si";

// const Sidebar = ({ open }) => {
//   const menuItems = [
//     { name: "Dashboard", link: "/admin", icon: <Home size={18} /> },

//     {
//       name: "User Management",
//       icon: <Users size={18} />,
//       dropdown: true,
//       children: [
//         { name: "All Users", link: "/admin/users" },
//         { name: "Active Users", link: "/admin/users/active" },
//         { name: "Blocked Users", link: "/admin/users/blocked" },
//       ],
//     },

//     {
//       name: "QR Manager",
//       link: "/admin/qr-manager",
//       icon: <QrCode size={18} />,
//     },

//     {
//       name: "Transactions",
//       icon: <MdMoney size={18} />,
//       dropdown: true,
//       children: [
//         { name: "Deposit Requests", link: "/admin/deposite-requests" },
//         { name: "Withdrawal Requests", link: "/admin/withdrawal-requests" },
//       ],
//     },

//     {
//       name: "Market Management",
//       icon: <SiMarketo size={18} />,
//       dropdown: true,
//       children: [
//         { name: "Starline", link: "/admin/starline" },
//         { name: "Jackpot", link: "/admin/jackpot" },
//       ],
//     },

//     {
//       name: "Settings",
//       icon: <Settings size={18} />,
//       dropdown: true,
//       children: [
//         { name: "App Settings", link: "/admin/settings/app" },
//         { name: "Admin Settings", link: "/admin/settings/admin" },
//       ],
//     },
//   ];

//   // { name: "Declare Result", icon: <Target size={18} /> },
//   // { name: "Winning Prediction", icon: <FileText size={18} /> },
//   // { name: "Wallet Management", icon: <Wallet size={18} />, dropdown: true },
//   // { name: "Games Management", icon: <Target size={18} />, dropdown: true },
//   // { name: "Notice Management", icon: <Bell size={18} />, dropdown: true },
//   // { name: "Galidesawar", icon: <Layers size={18} />, dropdown: true },
//   // { name: "Sub Admin Management", icon: <UserCog size={18} /> },

//   return (
//     <div
//       className={`fixed z-30 pt-16 left-0 top-0 h-full bg-[#0d1227] text-white transition-all duration-300 ${
//         open ? "w-64" : "w-0 overflow-hidden"
//       }`}
//     >
//       <div className="flex flex-col h-full p-4 space-y-3">
//         {menuItems.map((item, idx) => (
//           <div key={idx}>
//             {/* Main menu item */}
//             <div
//               className="flex justify-between items-center text-sm hover:bg-[#2a3047] p-2 rounded-md cursor-pointer"
//               onClick={() => (item.dropdown ? toggleDropdown(idx) : null)}
//             >
//               <a href={item.link} className="flex items-center gap-3">
//                 {item.icon}
//                 <span>{item.name}</span>
//               </a>

//               {item.dropdown &&
//                 (openDropdown === idx ? (
//                   <ChevronUp size={14} />
//                 ) : (
//                   <ChevronDownIcon size={14} />
//                 ))}
//             </div>

//             {/* Dropdown children */}
//             {item.dropdown && openDropdown === idx && (
//               <div className="ml-6 mt-1 space-y-1">
//                 {item.children.map((child, cIdx) => (
//                   <a
//                     key={cIdx}
//                     href={child.link}
//                     className="block text-sm text-gray-300 hover:text-white hover:bg-[#2a3047] p-2 rounded-md"
//                   >
//                     {child.name}
//                   </a>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Sidebar;

import React, { useState } from "react";
import {
  Home,
  Users,
  Target,
  FileText,
  Wallet,
  Settings,
  Bell,
  Layers,
  UserCog,
  ChevronDown,
  ChevronUp,
  QrCode,
  Star,
  Notebook,
  Wallet2,
  LogOut,
} from "lucide-react";
import { MdMoney } from "react-icons/md";
import { SiMarketo } from "react-icons/si";

const Sidebar = ({ open }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    window.location.href = "/login";
  };

  const toggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  const menuItems = [
    { name: "Dashboard", link: "/admin", icon: <Home size={18} /> },

    {
      name: "User Management",
      icon: <Users size={18} />,
      link: "/admin/users",
    },

    {
      name: "Wallet Management",
      icon: <Wallet2 size={18} />,
      dropdown: true,
      children: [
        { name: "Deposite Requests", link: "/admin/deposite-requests" },
        {
          name: "Withdrawl Requests ",
          link: "/admin/admin-withdrawal-requests",
        },
      ],
    },

    {
      name: "Game Management",
      icon: <SiMarketo size={18} />,
      dropdown: true,
      children: [
        { name: "Add Game", link: "/admin/add-game" },
        { name: "Game Rates", link: "/admin/game-rates" },
        { name: "Declare Result ", link: "/admin/declare-result-market" },
      ],
    },
    {
      name: "Golidesawar ",
      icon: <SiMarketo size={18} />,
      dropdown: true,
      children: [
        { name: "Add Game", link: "/admin/golidesawar" },
        { name: "Game Rates", link: "/admin/golidesawar-game-rates" },
        { name: "Bid History", link: "/admin/golidesawar-bid-history" },
        { name: "Win History", link: "/admin/golidesawar-win-history" },
        { name: "Declare Result ", link: "/admin/golidesawar-declare-result" },
      ],
    },
    {
      name: "Report Management",
      icon: <SiMarketo size={18} />,
      dropdown: true,
      children: [
        { name: "User Bid History", link: "/admin/bid-history" },
        { name: "Withdraw Report", link: "/admin/withdraw-report" },
        { name: "Winning History", link: "/admin/winning-history" },
        { name: "Deposite History", link: "/admin/deposite-history" },
      ],
    },
    {
      name: "QR Manager",
      link: "/admin/qr-manager",
      icon: <QrCode size={18} />,
    },

    {
      name: "Settings",
      icon: <Settings size={18} />,
      dropdown: true,
      children: [
        { name: "Main Settings", link: "/admin/main-settings" },
        { name: "UPI Settings", link: "/admin/site-data" },
        { name: "Contact Details", link: "/admin/site-data" },
        { name: "How to Play", link: "/admin/how-to-play" },
      ],
    },
    {
      name: "Logout",
      onClick: handleLogout,
      icon: <LogOut size={18} />,
    },
  ];

  return (
    <div
      className={`fixed lg:z-30 md:z-30 z-40 pt-16 left-0 top-0 h-full lg:bg-transparent md:bg-transparent lg:border-r md:border-r border-gray-50/10 bg-[#000]  text-white transition-all duration-300 ${
        open ? "w-64" : "w-0 overflow-hidden"
      }`}
    >
      <div className="flex flex-col h-full p-4 space-y-2">
        {menuItems.map((item, idx) => (
          <div key={idx}>
            {/* Main menu item */}
            <div
              className="flex justify-between items-center text-sm hover:bg-[#2a3047] p-2 rounded-md cursor-pointer"
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else if (item.dropdown) {
                  toggleDropdown(idx);
                }
              }}
            >
              {/* If item has link → make clickable */}
              {item.link ? (
                <a href={item.link} className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.name}</span>
                </a>
              ) : (
                // For Logout: no link, just a div
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              )}

              {/* Dropdown chevrons */}
              {item.dropdown &&
                (openDropdown === idx ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                ))}
            </div>

            {/* Dropdown children */}
            {item.dropdown && openDropdown === idx && (
              <div className="ml-6 mt-1 space-y-1">
                {item.children.map((child, cIdx) => (
                  <a
                    key={cIdx}
                    href={child.link}
                    className="block text-sm text-gray-300 hover:text-white hover:bg-[#2a3047] p-2 rounded-md"
                  >
                    {child.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
