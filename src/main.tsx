import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import Test from "@/pages/test.tsx";
import "./i18n";
import {Analytics} from "@vercel/analytics/react"; // Import the i18n configuration

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Analytics/>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/test" element={<Test />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
