import { Route, Routes } from "react-router-dom";
import HomeScene from "./HomeScene";
import TrendsPage from "./trends/TrendsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScene />} />
      <Route path="/trends" element={<TrendsPage />} />
    </Routes>
  );
}
