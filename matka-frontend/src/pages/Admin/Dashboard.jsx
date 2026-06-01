import React, { useEffect, useState } from "react";

import { User, Tag, Wallet, Wallet2 } from "lucide-react";
import Sidebar from "../../components/Admin/Sidebar";
import Header from "../../components/Admin/Header";
import DashboardCard from "../../components/Admin/DashboardCard";
import axios from "axios";
import { API_URL } from "../../config";
import AutoDepositHistory from "./ReportManagement/DepositeReport";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const colors = [
    "#3B82F6",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#F43F5E",
    "#10B981",
    "#3B82F6",
  ];

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("accessToken");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/user/all-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = res.data.map((u) => ({
        id: u.user_id,
        username: u.username,
        mobile: u.mobile,
        role: u.role,
        date: new Date(u.created_at).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      }));

      setUsers(formatted);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [approved, setApproved] = useState(0);
  const [unapproved, setUnapproved] = useState(0);
  const [todayCreated, setTodayCreated] = useState(0);
  const [todayPlayers, setTodayPlayers] = useState(0);
  const [todayLogins, setTodayLogins] = useState(0);

  const headers = { Authorization: `Bearer ${token}` };

  const [deposit, setDeposit] = useState(0);
  const [todaysDeposit, setTodayDeposit] = useState(0);
  const [withdrawal, setWithdrawal] = useState(0);
  const [todaysWithdrawal, setTodayWithdrawal] = useState(0);

  const fetchData = async () => {
    try {
      // Approved Users
      const approvedRes = await axios.get(
        `${API_URL}/api/v1/admin/users/status/approve`,
        { headers }
      );
      setApproved(approvedRes.data.count);

      const withdrawalDeposite = await axios.get(
        `${API_URL}/user-deposit-withdrawal/admin/withdraw`,
        {
          headers,
        }
      );
      const withdrawalList = withdrawalDeposite?.data || [];

      // console.log("With", withdrawalList);
      const todayw = new Date().toISOString().split("T")[0];

      const todaysWithdrawals = withdrawalList.filter((item) =>
        item.created_at?.startsWith(todayw)
      );

      // console.log("todaysWithdrawals", todaysWithdrawals);
      setTodayWithdrawal(todaysWithdrawals?.length);
      setWithdrawal(withdrawalDeposite?.data?.length);

      const totalDeposite = await axios.get(
        `${API_URL}/user-deposit-withdrawal/admin/deposit/pending`,
        {
          headers,
        }
      );

      const todayData = totalDeposite?.data; // your API structure
      const pendingDeposits = todayData.pending; // array of deposits

      // Get today's date (YYYY-MM-DD)
      const today = new Date().toISOString().split("T")[0];

      // Filter deposits uploaded today
      const todaysDeposits = pendingDeposits.filter((item) =>
        item.uploaded_at.startsWith(today)
      );

      // Total count
      const todaysDepositCount = todaysDeposits.length;
      console.log("Total Deposits Data:", todaysDeposits);
      var rawAmount = 0;
      for (let i = 0; i < todaysDeposits.length; i++) {
        rawAmount += parseFloat(todaysDeposits[i].amount);
      }

      // console.log("Today's Deposit Count:", todaysDepositCount);
      setTodayDeposit(rawAmount);
      setDeposit(totalDeposite?.data?.pending?.length || []);

      // Unapproved Users
      const unapprovedRes = await axios.get(
        `${API_URL}/api/v1/admin/users/status/disapprove`,
        { headers }
      );
      setUnapproved(unapprovedRes.data.count);

      // Today Created
      const createdRes = await axios.get(
        `${API_URL}/api/v1/admin/users/today-created`,
        { headers }
      );

      setTodayCreated(createdRes.data.count);

      const todayPlay = await axios.get(
        `${API_URL}/api/v1/admin/users/today-bid-users`,
        { headers }
      );

      console.log("todayPlay", todayPlay);
      setTodayPlayers(todayPlay.data.count);

      // Today Logins
      const loginRes = await axios.get(
        `${API_URL}/api/v1/admin/users/today-logins`,
        { headers }
      );

      console.log(loginRes);
      setTodayLogins(loginRes.data.count);
    } catch (error) {
      console.log("Dashboard Error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="">
      <div className="flex-1 flex flex-col">
        <main className="p-4 space-y-4 z-10">
          {/* Welcome Banner */}
          <div className="bg-white/5 gap-10 rounded-xl shadow backdrop-blur  p-4 flex flex-col justify-between ">
            <div>
              <h3 className="text-white font-semibold text-xl mb-2">
                Welcome Back!
              </h3>
              <p className="text-gray-300 text-sm">Admin Dashboard</p>
            </div>
            <div className="w-full  rounded-xl grid grid-cols-2 md:grid-cols-3 gap-6 ">
              <div>
                <p className="text-4xl font-semibold">{approved}</p>
                <p className="text-gray-300 mt-1">Approved Users</p>
              </div>

              <div>
                <p className="text-4xl font-semibold">{unapproved}</p>
                <p className="text-gray-300 mt-1">Unapproved Users</p>
              </div>
            </div>
            {/* <img
              src="/admin-desk.svg"
              alt="Dashboard Illustration"
              className="w-24"
            /> */}
          </div>

          {/* Summary Cards */}
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Approved Users */}
            <DashboardCard
              link="/admin/users"
              title="Users"
              value={approved}
              // subtext="All Users"
              color={colors[0]}
              icon={<User size={18} />}
            />

            {/* Admin Users */}
            <DashboardCard
              title="Login (Today)"
              value={todayLogins}
              // subtext="Total Login Accounts"
              color={colors[1]}
              icon={<User size={18} />}
            />

            {/* Today Registrations */}
            <DashboardCard
              title="Today Registration"
              value={todayCreated}
              color={colors[2]}
              icon={<Tag size={18} />}
            />

            {/* Today Logged-In Players */}
            <DashboardCard
              link={"/admin/today-play"}
              title="Players (Today)"
              value={todayPlayers}
              color={colors[3]}
              icon={<Tag size={18} />}
            />

            <DashboardCard
              link="/admin/deposite-requests"
              title="Total Deposits"
              value={deposit}
              color={colors[4]}
              icon={<Wallet size={18} />}
            />
            <DashboardCard
              title="Deposite (Today)"
              value={todaysDeposit}
              color={colors[5]}
              icon={<Wallet size={18} />}
            />
            <DashboardCard
              link="/admin/admin-withdrawal-requests"
              title="Total Withdrawals"
              value={withdrawal}
              color={colors[6]}
              icon={<Wallet2 size={18} />}
            />

            <DashboardCard
              title="Withdrawals (Today)"
              value={todaysWithdrawal}
              color={colors[7]}
              icon={<Wallet size={18} />}
            />
          </div>

          {/* Dropdown Filters */}
          {/* <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="font-semibold text-gray-700 mb-3">
              Total Bids On Single Ank Of Date 09 Nov 2025
            </h3>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-600">Game Name</label>
                <select className="w-full border rounded-md p-2 text-sm text-gray-700">
                  <option>-Select Game Name-</option>
                  <option>DESAWAR</option>
                  <option>FARIDABAD</option>
                  <option>GHAZIABAD</option>
                  <option>GALI</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Market Time</label>
                <select className="w-full border rounded-md p-2 text-sm text-gray-700">
                  <option>-Select Market Time-</option>
                  <option>Open Market</option>
                  <option>Close Market</option>
                </select>
              </div>
            </div>
          </div> */}

          {/* Ank Cards */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md p-4 text-center border-t-4"
                style={{ borderColor: colors[i % colors.length] }}
              >
                <p className="text-blue-600 font-semibold">Total Bids 0</p>
                <h2 className="text-2xl font-bold text-gray-800 my-2">0</h2>
                <p className="text-sm text-gray-600">Total Bid Amount</p>
                <p
                  className="mt-2 font-semibold"
                  style={{ color: colors[i % colors.length] }}
                >
                  Ank {i}
                </p>
              </div>
            ))}
          </div> */}
        </main>
      </div>
      <AutoDepositHistory />
    </div>
  );
}
