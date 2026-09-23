import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import Home from "./pages/Home.jsx";
import Book from "./pages/Book.jsx";
import Track from "./pages/Track.jsx";

import AdminLogin from "./pages/admin/Login.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import AiInbox from "./pages/admin/AiInbox.jsx";
import ServicesAdmin from "./pages/admin/ServicesAdmin.jsx";
import Settings from "./pages/admin/Settings.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book" element={<Book />} />
        <Route path="/track" element={<Track />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="ai-inbox" element={<AiInbox />} />
          <Route path="services" element={<ServicesAdmin />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
