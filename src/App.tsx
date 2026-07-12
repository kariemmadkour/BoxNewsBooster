import { Route, Routes } from "react-router-dom";
import HomeScene from "./HomeScene";
import TrendsPage from "./trends/TrendsPage";
import DashboardPage from "./dashboard/DashboardPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScene />} />
      <Route path="/trends" element={<TrendsPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
