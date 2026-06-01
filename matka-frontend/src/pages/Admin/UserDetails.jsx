import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../config";
import { PhoneCall } from "lucide-react";
import AdminBidHistory from "./History/AdminBidHistory";
import AdminDepositeHistory from "./History/AdminDepositeHistory";
import AdminWithdrawHistory from "./History/AdminWithdrawHistory";
import AdminWinHistory from "./History/AdminWinHistory";

export default function UserDetails() {
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [totalDepositList, setTotalDepositList] = useState([]);
  const [totalWithdrawalList, setTotalWithdrawalList] = useState([]);
  const [totalDeposit, setTotalDeposit] = useState(0);
  const [totalWithdrawal, setTotalWithdrawal] = useState(0);
  console.log("totalWithdrawal", totalWithdrawal);
  const [bids, setBids] = useState([]);
  const [wins, setWins] = useState([]);

  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBalance, setBalance] = useState(0);
  console.log("showBalance", showBalance);
  // password modal state
  const [password, setPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const token = localStorage.getItem("accessToken");

  // ================================
  // 📌 FETCH USER DETAILS ACCORDING TO BACKEND
  // ================================
  const fetchUser = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/v1/admin/user/user-details/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data.data;

      console.log("first", data);

      const u = data["@user"];

      const formattedUser = {
        id: u._id.$oid,
        username: u.username,
        mobile: u.mobile,
        status: u.status,
        is_bet: u.is_bet,
        balance: u.balance,
        password_hash: u.password_hash,
        created_at: u.created_at.$date,
        last_login: u.last_login ? u.last_login.$date : null,
      };

      setUser(formattedUser);
      setBalance(data["@wallet"]);
      setTotalDeposit(data["@total_deposit"]);
      setTotalDepositList(data["@total_deposit_tx"]);
      setTotalWithdrawalList(data["@total_withdrawal_tx"]);
      setTotalWithdrawal(data["@total_withdrawal"]);
      setBids(data["@user_bids"]);
      setWins(data["@wins"]);
      console.log("first", data["@wins"]);
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  // ================================
  // ADD MONEY
  // ================================
  const addMoney = async () => {
    try {
      await axios.get(
        `${API_URL}/api/v1/admin/user/add-money?amount=${amount}&user_id=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Money Added!");
      setShowAddModal(false);
      setAmount("");
      fetchUser();
    } catch (err) {
      alert(err.response?.data?.detail || "Error");
    }
  };

  // ================================
  // WITHDRAW MONEY
  // ================================
  const withdrawMoney = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/v1/admin/user/witdrawal-money?amount=${amount}&user_id=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("with response", res);

      alert("Money Withdrawn!");
      setShowWithdrawModal(false);
      setAmount("");
      fetchUser();
    } catch (err) {
      alert(err.response?.data?.detail || "Error");
    }
  };

  // ================================
  // UPDATE PASSWORD
  // ================================
  const updatePassword = async () => {
    if (!password || password.length < 4) {
      alert("Password must be at least 4 characters.");
      return;
    }

    try {
      setUpdatingPassword(true);

      const url = `${API_URL}/api/v1/admin/${id}/update-password?password=${password}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(res);

      // backend returns user info in your snippet — show success
      alert("Password updated successfully!");
      setShowPasswordModal(false);
      setPassword("");
      fetchUser();
    } catch (err) {
      console.log("Update password error:", err);
      alert(err.response?.data?.detail || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const [markets, setMarkets] = useState([]);

  const fetchMarkets = async () => {
    const res = await axios.get(`${API_URL}/api/admin/market`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setMarkets(res.data?.data || []);
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  const marketMap = useMemo(() => {
    const map = {};
    markets.forEach((m) => {
      const id = m._id?.$oid || m._id;
      map[id] = m.name;
    });
    return map;
  }, [markets]);

  // ==============================================================================

  if (loading) return <div className="text-white p-5">Loading...</div>;
  if (!user) return <div className="text-red-500 p-5">User Not Found</div>;

  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-bold mb-5">USER DETAILS</h2>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* LEFT CARD */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl capitalize font-semibold text-white">
                {user.username}
              </h3>

              <p className="text-gray-200 text-sm flex items-center gap-2 mt-2">
                {user.mobile} <PhoneCall size={13} />
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-end">
                Active:
                <span
                  className={`px-2 py-1 ml-2 rounded ${
                    user.status ? "bg-green-600/40" : "bg-red-600/40"
                  }`}
                >
                  {user.status ? "Yes" : "No"}
                </span>
              </p>

              <p>
                Betting:
                <span
                  className={`px-2 py-1 ml-2 rounded ${
                    user.is_bet ? "bg-green-600/40" : "bg-red-600/40"
                  }`}
                >
                  {user.is_bet ? "Yes" : "No"}
                </span>
              </p>
            </div>
          </div>

          {/* Balance */}
          <div className="mt-3">
            <p className="text-md font-medium">Available Balance</p>
            <h3 className="text-xl font-bold">₹ {showBalance}</h3>

            <div className="mt-3 flex flex-col gap-2">
              <span className="text-md font-medium text-white red-400">
                Current Password :{" "}
                <span className="text-md font-medium text-green-400">
                  {user?.password_hash}
                </span>
              </span>
              <button
                className="px-3 py-1.5 !text-sm font-medium bg-blue-600 rounded w-full"
                onClick={() => setShowPasswordModal(true)}
              >
                Password
              </button>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                className="px-3 py-1.5 !text-sm font-medium bg-green-600 rounded w-full"
                onClick={() => setShowAddModal(true)}
              >
                Add Money
              </button>

              <button
                className="px-3 py-1.5 !text-sm font-medium bg-red-600 rounded w-full"
                onClick={() => setShowWithdrawModal(true)}
              >
                Withdraw
              </button>
            </div>

            {showPasswordModal && (
              <PasswordModal
                title={`Update password for ${user.username}`}
                password={password}
                setPassword={setPassword}
                onSubmit={updatePassword}
                onClose={() => {
                  setShowPasswordModal(false);
                  setPassword("");
                }}
                loading={updatingPassword}
              />
            )}
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className="bg-white/10 rounded-xl p-4">
          <h3 className="text-xl font-semibold mb-2 border-b border-white/20 pb-1">
            Personal Information
          </h3>

          <div className="space-y-3 text-sm">
            <p>
              Full Name:{" "}
              <span className="text-gray-300 capitalize">{user.username}</span>
            </p>
            <p>Mobile: {user.mobile}</p>
            <p>Created: {new Date(user.created_at).toLocaleString("en-IN")}</p>
            <p>
              Last Login:{" "}
              {user.last_login
                ? new Date(user.last_login).toLocaleString("en-IN")
                : "No Login"}
            </p>
          </div>

          {/* STATS FROM BACKEND */}
        </div>
      </div>

      <div className="grid bg-white/10 p-3 rounded-xl lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-2 gap-3 mt-4">
        <div className="bg-green-700/40 px-2 py-1 rounded text-center">
          Total Deposit: ₹{totalDeposit}
        </div>
        <div className="bg-red-700/40 px-2 py-1 rounded text-center">
          Total Withdrawal: ₹{totalWithdrawal}
        </div>
        <div className="bg-blue-700/40 px-2 py-1 rounded text-center">
          Total Bids: {bids.length}
        </div>
        <div className="bg-yellow-700/40 px-2 py-1 rounded text-center">
          Total Wins: {wins.length}
        </div>
      </div>

      <AdminDepositeHistory transactions={totalDepositList} />
      <AdminWithdrawHistory withdrawals={totalWithdrawalList} />
      {/* <AdminBidHistory bids={bids} /> */}
      <AdminBidHistory bids={bids} marketMap={marketMap} />

      <AdminWinHistory wins={wins} />

      {/* ======================== */}
      {/* MODALS */}
      {/* ======================== */}

      {showAddModal && (
        <Modal
          title="Add Money"
          amount={amount}
          setAmount={setAmount}
          onSubmit={addMoney}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showWithdrawModal && (
        <Modal
          title="Withdraw Money"
          amount={amount}
          setAmount={setAmount}
          onSubmit={withdrawMoney}
          onClose={() => setShowWithdrawModal(false)}
        />
      )}
    </div>
  );
}

function Modal({ title, amount, setAmount, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-white/20 backdrop-blur p-5 rounded w-80">
        <h3 className="text-xl mb-3">{title}</h3>

        <input
          type="number"
          placeholder="Enter amount"
          className="w-full bg-black/30 border border-gray-600 p-2 rounded text-white"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <div className="flex gap-3 mt-4">
          <button className="px-4 py-2 bg-green-600 rounded" onClick={onSubmit}>
            Submit
          </button>
          <button className="px-4 py-2 bg-red-600 rounded" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordModal({
  title,
  password,
  setPassword,
  onSubmit,
  onClose,
  loading,
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white/20 backdrop-blur p-5 rounded w-80">
        <h3 className="text-xl mb-3">{title}</h3>

        <input
          type="password"
          placeholder="Enter new password"
          className="w-full bg-black/30 border border-gray-600 p-2 rounded text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex gap-3 mt-4">
          <button
            className="px-4 py-2 bg-green-600 rounded"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update"}
          </button>
          <button
            className="px-4 py-2 bg-red-600 rounded"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
