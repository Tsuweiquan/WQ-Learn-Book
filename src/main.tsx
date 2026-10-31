import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* BASE_URL is "/" locally and "/<repo>/" on GitHub Pages (vite build --base). */}
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
