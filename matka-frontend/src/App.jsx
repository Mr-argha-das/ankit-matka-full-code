import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "./components/layout/layout";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/MatkaLandingPage";

import AdminDashboard from "./pages/Admin/Dashboard";
import AdminLayout from "./components/Admin/AdminLayout";
import UserManagement from "./pages/Admin/UserManagement";
import UserDetails from "./pages/Admin/UserDetails";
import UserBidHistory from "./pages/Admin/UserBidHistory";

import HowToPlay from "./pages/HowToPlay";
import ProfilePage from "./pages/ProfilePage";
import WalletPage from "./pages/WalletPage";
import WinHistory from "./pages/WinHistory";
import MyBids from "./pages/MyBids";
import AddMoney from "./pages/AddMoney";
import Charts from "./pages/Charts";
import BidHistoryPage from "./pages/BidHistory";

import WithdrawRequest from "./pages/WithdrawRequest";
import MyWithdrawals from "./pages/WithdrawlHistory";
import AdminDepositRequests from "./pages/Admin/AdminDepositRequests";
import AdminWithdrawalRequests from "./pages/Admin/WithdrawRequests";
import MarketList from "./pages/Admin/Market/MarketList";
import Games from "./pages/Games";
import MatkaGame from "./pages/MatkaGame";
import Passbook from "./pages/Passbook";
import MyDepositHistory from "./pages/DipositeHistory";
import AdminQRManager from "./pages/Admin/Qr/AdminQRManager";
import AdminStarline from "./pages/Admin/Starline/AdminStarline";
import StarlineGames from "./pages/StarlineUI/StarlineGamePanna";

import StarlineGamePannaBed from "./pages/StarlineUI/StarlineGamePannaBed";
import AdminDeclareStarlineResult from "./pages/Admin/Starline/AdminDeclareStarlineResult";
import StarlineResultBox from "./pages/StarlineUI/StarlineResultBox";

import AdminDepositApprovals from "./pages/Admin/Deposit/AdminDepositApprovals";
import WalletTransactionHistory from "./pages/Wallet/walletHistory";
import StarlineBidHistory from "./pages/StarlineUI/StarlineBidHistory";
import StarlineWinHistory from "./pages/StarlineUI/StarlineWinHistory";

import AdminJackpot from "./pages/Admin/Jackpot/AdminJackpot";
import JackpotGame from "./pages/JackpotUI/JackpotGame";
import JackpotBidHistory from "./pages/JackpotUI/JackpotBidHistory";
import JackpotWinHistory from "./pages/JackpotUI/JackpotWinHistory";

import GameRatePage from "./pages/GameRate";
import ContactUs from "./pages/ContactUs";
import UpdatePasswordPage from "./pages/ChangePassWord";
import AdminDeclareResult from "./pages/Admin/DeclareResult/AdminDeclareResult";
import AdminHowToPlay from "./pages/Admin/AdminHowToplay";
import MainSettings from "./pages/Admin/Settings/MainSettings";
import AdminSiteData from "./pages/Admin/SiteData/AdminSiteData";
import AdminNotificationList from "./pages/Admin/Notification/AdminNotificationList";
import GameList from "./pages/Admin/Game/GameList";
import GameRates from "./components/Admin/Game/GameRates";

import ResultDeclareMarket from "./components/Admin/Game/ResultDeclareMarket";
import StarlineMarket from "./pages/StarlineUI/StarlineGame";

import WithdrawReport from "./pages/Admin/ReportManagement/WithdrawReport";
import BidReport from "./pages/Admin/ReportManagement/BidReport";
import WinningReport from "./pages/Admin/ReportManagement/WinningReport";
import AutoDepositHistory from "./pages/Admin/ReportManagement/DepositeReport";

import GGameRates from "./components/Admin/Golidesawar/GGameRates";
import GGameList from "./components/Admin/Golidesawar/GGameMarkets";
import GBidHistoryReport from "./components/Admin/Golidesawar/GBidHistoryReport";
import GWinningHistory from "./components/Admin/Golidesawar/GWinningHistory";
import GDeclareResult from "./components/Admin/Golidesawar/GDeclareResult";
import JackpotDigitSelect from "./pages/JackpotUI/JackpotGamePanna";

import KingJackpotPlayBid from "./pages/JackpotUI/KingJackpotPlayBid";
import AllUserBids from "./pages/JackpotUI/AllUserBids";
import GWinHistory from "./pages/JackpotUI/KingWinHistory";

import AdminLoginPage from "./components/Admin/AdminLogin";
import { useEffect, useState } from "react";
import { getUserById } from "./components/layout/fetchUser";
import ReferralPage from "./pages/reffer";
import TodayBidHistory from "./components/Admin/TodayBidHistory";
import GMarketChart from "./pages/JackpotUI/GMarketChart";

const useAuthUser = () => {
  const [user, setUser] = useState(undefined);
  const token = localStorage.getItem("accessToken");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!token || !userId) {
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      const { data, error } = await getUserById(userId);
      console.log(data);
      if (error) setUser(null);
      else setUser(data); // backend user object
    };

    fetchUser();
  }, [token, userId]);

  return user;
};

const PublicRoute = () => {
  const user = useAuthUser();

  if (user === undefined)
    return <div className="text-white p-4">Checking...</div>;

  if (user) {
    return user.role === "admin" ? (
      <Navigate to="/admin" replace />
    ) : (
      <Navigate to="/" replace />
    );
  }

  return <Outlet />;
};

const UserOnly = () => {
  const user = useAuthUser();
  const token = localStorage.getItem("accessToken");

  if (user === undefined) return <div>Checking...</div>;

  // Not logged in → login page
  if (!token) return <Navigate to="/login" replace />;

  // If ADMIN tries to access user pages → redirect to admin
  if (user?.role === "admin") return <Navigate to="/admin" replace />;

  // Player allowed
  return <Outlet />;
};

const AdminOnly = () => {
  const user = useAuthUser();

  if (user === undefined) return <div>Checking...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // If PLAYER tries to access admin routes → redirect home
  if (user?.role === "player") return <Navigate to="/" replace />;

  return <Outlet />;
};

const App = () => {
  return (
    <section className="theme-page">
      <div className="theme-shell fixed top-0 left-0 right-0 bottom-0 z-0" />
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50" />
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* ADMIN ROUTES */}
        <Route element={<AdminOnly />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />

            <Route path="users" element={<UserManagement />} />
            <Route path="details/:id" element={<UserDetails />} />
            <Route path="markets" element={<MarketList />} />
            <Route path="user-bid-history" element={<UserBidHistory />} />
            <Route
              path="deposite-requests"
              element={<AdminDepositRequests />}
            />
            <Route path="qr-manager" element={<AdminQRManager />} />
            <Route path="add-game" element={<GameList />} />
            <Route path="game-rates" element={<GameRates />} />
            <Route path="today-play" element={<TodayBidHistory />} />

            <Route
              path="declare-result-market"
              element={<ResultDeclareMarket />}
            />

            <Route path="starline" element={<AdminStarline />} />
            <Route path="jackpot" element={<AdminJackpot />} />
            <Route
              path="deposit-approvals"
              element={<AdminDepositApprovals />}
            />

            <Route path="main-settings" element={<MainSettings />} />
            <Route path="how-to-play" element={<AdminHowToPlay />} />
            <Route path="site-data" element={<AdminSiteData />} />
            <Route path="notifications" element={<AdminNotificationList />} />

            {/* Report */}
            <Route path="winning-history" element={<WinningReport />} />
            <Route path="withdraw-report" element={<WithdrawReport />} />
            <Route path="bid-history" element={<BidReport />} />
            <Route path="deposite-history" element={<AutoDepositHistory />} />

            {/* Golidesawar */}
            <Route path="golidesawar-game-rates" element={<GGameRates />} />
            <Route
              path="golidesawar-bid-history"
              element={<GBidHistoryReport />}
            />

            <Route
              path="golidesawar-win-history"
              element={<GWinningHistory />}
            />
            <Route path="golidesawar" element={<GGameList />} />
            <Route
              path="golidesawar-declare-result"
              element={<GDeclareResult />}
            />

            <Route
              path="declare-result/:marketId"
              element={<AdminDeclareResult />}
            />
            <Route
              path="starline-declare-result"
              element={<AdminDeclareStarlineResult />}
            />
            <Route
              path="admin-withdrawal-requests"
              element={<AdminWithdrawalRequests />}
            />
          </Route>
        </Route>

        {/* ===================== USER ROUTES ===================== */}
        <Route element={<UserOnly />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="win-history" element={<WinHistory />} />
            <Route path="withdrawal-request" element={<WithdrawRequest />} />
            <Route path="my-bids" element={<MyBids />} />
            <Route path="how-to-play" element={<HowToPlay />} />
            <Route path="add-points" element={<AddMoney />} />
            <Route path="/referrals" element={<ReferralPage />} />
            <Route path="charts/:marketId" element={<Charts />} />
            <Route path="gcharts/:marketId" element={<GMarketChart />} />
            <Route path="starline" element={<StarlineMarket />} />
            <Route
              path="starline-bid-history"
              element={<StarlineBidHistory />}
            />
            <Route
              path="starline-win-history"
              element={<StarlineWinHistory />}
            />

            <Route path="/starline/:marketId" element={<StarlineGames />} />
            <Route
              path="/starline/:marketId/:gameId"
              element={<StarlineGamePannaBed />}
            />

            <Route path="game-rate" element={<GameRatePage />} />
            <Route path="contact-us" element={<ContactUs />} />
            <Route path="change-password" element={<UpdatePasswordPage />} />

            <Route path="jackpot-bid-history" element={<JackpotBidHistory />} />
            <Route path="jackpot-win-history" element={<JackpotWinHistory />} />

            <Route path="golidesawar" element={<JackpotGame />} />
            <Route path="/king/:marketId" element={<JackpotDigitSelect />} />
            <Route path="/king-win-history" element={<GWinHistory />} />
            <Route path="/king-bids-history" element={<AllUserBids />} />

            <Route
              path="/jackpot/:marketId/:gameId"
              element={<KingJackpotPlayBid />}
            />

            <Route path="bid-history" element={<BidHistoryPage />} />
            <Route path="withdrawal-history" element={<MyWithdrawals />} />
            <Route path="starline-result-box" element={<StarlineResultBox />} />

            <Route path="deposit-history" element={<MyDepositHistory />} />
            <Route
              path="wallet-history"
              element={<WalletTransactionHistory />}
            />
            <Route path="passbook" element={<Passbook />} />

            <Route path="/play/:marketId" element={<Games />} />
            <Route path="/game/:marketId/:gameId" element={<MatkaGame />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={<div className=" h-screen">404 Not Found</div>}
        />
      </Routes>
    </section>
  );
};

export default App;
